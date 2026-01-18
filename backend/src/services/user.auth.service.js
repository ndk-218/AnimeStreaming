// @ts-nocheck
const crypto = require('crypto');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwtUtils');
const { sendVerificationEmail, sendPasswordResetEmail, sendOTPEmail } = require('../utils/emailService');
const otpService = require('./otp.service');

/**
 * ===== USER AUTH SERVICE =====
 * Business logic cho user authentication và authorization
 */

/**
 * Register new user
 */
const register = async (email, password, username, displayName) => {
  try {
    // 1. Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      throw new Error('Email already registered');
    }

    // 2. Check if username already exists
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      throw new Error('Username already taken');
    }

    // 3. Create new user (email verified by default)
    const user = new User({
      email: email.toLowerCase().trim(),
      username: username.toLowerCase().trim(),
      displayName: displayName.trim(),
      password // Will be hashed by pre-save hook
      // isEmailVerified: true (set by default in model)
    });

    await user.save();

    console.log(`✅ New user registered: ${user.email}`);

    return {
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName
      },
      message: 'Đăng ký thành công! Bạn có thể đăng nhập ngay.'
    };

  } catch (error) {
    console.error('❌ User registration error:', error.message);
    throw error;
  }
};

/**
 * Verify email with token
 */
const verifyEmail = async (token) => {
  try {
    // Find user with valid verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    console.log(`✅ Email verified: ${user.email}`);

    return {
      success: true,
      message: 'Email verified successfully. You can now login.'
    };

  } catch (error) {
    console.error('❌ Email verification error:', error.message);
    throw error;
  }
};

/**
 * Resend verification email
 */
const resendVerification = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, user.displayName, verificationToken);

    console.log(`✅ Verification email resent: ${user.email}`);

    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    };

  } catch (error) {
    console.error('❌ Resend verification error:', error.message);
    throw error;
  }
};

/**
 * Login user
 */
const login = async (emailOrUsername, password) => {
  try {
    // 1. Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() }
      ]
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Check if account is active
    if (!user.isActive) {
      throw new Error('Account is deactivated. Please contact support.');
    }

    // 3. Verify password (removed email verification check)
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // 5. Check premium expiry
    if (user.isPremium && user.premiumExpiry) {
      if (new Date() > user.premiumExpiry) {
        user.isPremium = false;
        user.premiumExpiry = null;
        await user.save();
        console.log(`⏰ Premium expired for user: ${user.email}`);
      }
    }

    // 6. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 7. Save refresh token to database
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    console.log(`✅ User logged in: ${user.email}`);

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          isPremium: user.isPremium,
          premiumExpiry: user.premiumExpiry
        }
      },
      message: 'Login successful'
    };

  } catch (error) {
    console.error('❌ User login error:', error.message);
    throw error;
  }
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    // 1. Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    // 2. Find user and verify stored refresh token
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // 3. Generate new access token
    const newAccessToken = generateAccessToken(user);

    console.log(`✅ Access token refreshed: ${user.email}`);

    return {
      success: true,
      data: {
        accessToken: newAccessToken
      }
    };

  } catch (error) {
    console.error('❌ Refresh token error:', error.message);
    throw error;
  }
};

/**
 * Logout user (invalidate refresh token)
 */
const logout = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
      console.log(`✅ User logged out: ${user.email}`);
    }

    return {
      success: true,
      message: 'Logout successful'
    };

  } catch (error) {
    console.error('❌ Logout error:', error.message);
    throw error;
  }
};

/**
 * Request password reset
 */
const requestPasswordReset = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists or not (security)
      return {
        success: true,
        message: 'If the email exists, a password reset link will be sent.'
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user.email, user.displayName, resetToken);

    console.log(`✅ Password reset requested: ${user.email}`);

    return {
      success: true,
      message: 'If the email exists, a password reset link will be sent.'
    };

  } catch (error) {
    console.error('❌ Password reset request error:', error.message);
    throw error;
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (token, newPassword) => {
  try {
    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Set new password
    await user.setPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    user.refreshToken = null; // Invalidate existing sessions
    await user.save();

    console.log(`✅ Password reset successful: ${user.email}`);

    return {
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    };

  } catch (error) {
    console.error('❌ Password reset error:', error.message);
    throw error;
  }
};

/**
 * Change password (for logged-in users)
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Set new password
    await user.setPassword(newPassword);
    user.refreshToken = null; // Invalidate existing sessions
    await user.save();

    console.log(`✅ Password changed: ${user.email}`);

    return {
      success: true,
      message: 'Password changed successfully. Please login again.'
    };

  } catch (error) {
    console.error('❌ Change password error:', error.message);
    throw error;
  }
};

/**
 * ===== OTP-BASED PASSWORD RESET =====
 */

/**
 * Request OTP for password reset
 */
const requestOTP = async (email) => {
  try {
    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists or not (security)
      return {
        success: true,
        message: 'Nếu email tồn tại, mã OTP sẽ được gửi đến hòm thư của bạn.'
      };
    }

    // Check cooldown
    const cooldownCheck = otpService.canResendOTP(user.email);
    if (!cooldownCheck.canResend) {
      throw new Error(`Vui lòng chờ ${cooldownCheck.waitSeconds} giây trước khi gửi lại mã OTP.`);
    }

    // Generate OTP
    const otp = otpService.generateOTP();

    // Store OTP in memory
    otpService.storeOTP(user.email, otp);

    // Send OTP via email
    await sendOTPEmail(user.email, user.displayName, otp);

    console.log(`✅ OTP requested for: ${user.email}`);

    return {
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn.',
      expiresIn: otpService.OTP_EXPIRY_SECONDS
    };

  } catch (error) {
    console.error('❌ Request OTP error:', error.message);
    throw error;
  }
};

/**
 * Verify OTP code
 */
const verifyOTP = async (email, otp) => {
  try {
    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify OTP
    const verifyResult = otpService.verifyOTP(user.email, otp);

    if (!verifyResult.success) {
      throw new Error(verifyResult.error);
    }

    console.log(`✅ OTP verified for: ${user.email}`);

    return {
      success: true,
      message: 'Mã OTP đúng. Bạn có thể đặt lại mật khẩu.'
    };

  } catch (error) {
    console.error('❌ Verify OTP error:', error.message);
    throw error;
  }
};

/**
 * Reset password with verified OTP
 */
const resetPasswordWithOTP = async (email, newPassword) => {
  try {
    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if OTP is verified
    const isVerified = otpService.isOTPVerified(user.email);
    if (!isVerified) {
      throw new Error('OTP chưa được xác thực. Vui lòng xác thực mã OTP trước.');
    }

    // Set new password (this will be hashed by pre-save hook)
    user.password = newPassword; // Direct assignment, let pre-save hook handle hashing
    user.refreshToken = null; // Invalidate existing sessions
    await user.save();

    // Delete OTP after successful password reset
    otpService.deleteOTP(user.email);

    console.log(`✅ Password reset with OTP successful: ${user.email}`);

    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.'
    };

  } catch (error) {
    console.error('❌ Reset password with OTP error:', error.message);
    throw error;
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshAccessToken,
  logout,
  requestPasswordReset,
  resetPassword,
  changePassword,
  // OTP-based password reset
  requestOTP,
  verifyOTP,
  resetPasswordWithOTP
};
