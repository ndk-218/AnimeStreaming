// @ts-nocheck
const userAuthService = require('../services/user.auth.service');
const { validationResult } = require('express-validator');

/**
 * ===== USER AUTH CONTROLLER =====
 * HTTP request/response handling cho user authentication
 */

/**
 * Register new user
 * POST /api/users/auth/register
 */
const register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, username, displayName } = req.body;

    // Call service
    const result = await userAuthService.register(
      email,
      password,
      username,
      displayName
    );

    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Register controller error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Verify email with token
 * GET /api/users/auth/verify-email/:token
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required'
      });
    }

    const result = await userAuthService.verifyEmail(token);

    res.json(result);

  } catch (error) {
    console.error('❌ Verify email controller error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Resend verification email
 * POST /api/users/auth/resend-verification
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const result = await userAuthService.resendVerification(email);

    res.json(result);

  } catch (error) {
    console.error('❌ Resend verification controller error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Login user
 * POST /api/users/auth/login
 */
const login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { emailOrUsername, password } = req.body;

    // Call service
    const result = await userAuthService.login(emailOrUsername, password);

    res.json(result);

  } catch (error) {
    console.error('❌ Login controller error:', error.message);
    
    // Return 401 for authentication errors
    const statusCode = error.message.includes('credentials') || 
                       error.message.includes('verify') || 
                       error.message.includes('deactivated') ? 401 : 400;

    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Refresh access token
 * POST /api/users/auth/refresh-token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const result = await userAuthService.refreshAccessToken(refreshToken);

    res.json(result);

  } catch (error) {
    console.error('❌ Refresh token controller error:', error.message);
    
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Logout user
 * POST /api/users/auth/logout
 */
const logout = async (req, res) => {
  try {
    // userId comes from auth middleware
    const userId = req.user._id;

    const result = await userAuthService.logout(userId);

    res.json(result);

  } catch (error) {
    console.error('❌ Logout controller error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

/**
 * Request password reset
 * POST /api/users/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const result = await userAuthService.requestPasswordReset(email);

    res.json(result);

  } catch (error) {
    console.error('❌ Forgot password controller error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request'
    });
  }
};

/**
 * Reset password with token
 * POST /api/users/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required'
      });
    }

    const result = await userAuthService.resetPassword(token, newPassword);

    res.json(result);

  } catch (error) {
    console.error('❌ Reset password controller error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Change password (for logged-in users)
 * POST /api/users/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    const result = await userAuthService.changePassword(
      userId,
      currentPassword,
      newPassword
    );

    res.json(result);

  } catch (error) {
    console.error('❌ Change password controller error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get current user profile
 * GET /api/users/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        isPremium: user.isPremium,
        premiumExpiry: user.premiumExpiry,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Get current user controller error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
};

/**
 * ===== OTP-BASED PASSWORD RESET CONTROLLERS =====
 */

/**
 * Request OTP for password reset
 * POST /api/users/auth/request-otp
 */
const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const result = await userAuthService.requestOTP(email);

    res.json(result);

  } catch (error) {
    console.error('❌ Request OTP controller error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Verify OTP code
 * POST /api/users/auth/verify-otp
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }

    const result = await userAuthService.verifyOTP(email, otp);

    res.json(result);

  } catch (error) {
    console.error('❌ Verify OTP controller error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Reset password with verified OTP
 * POST /api/users/auth/reset-password-otp
 */
const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    const result = await userAuthService.resetPasswordWithOTP(email, newPassword);

    res.json(result);

  } catch (error) {
    console.error('❌ Reset password with OTP controller error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
  // OTP-based password reset
  requestOTP,
  verifyOTP,
  resetPasswordWithOTP
};
