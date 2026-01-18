// @ts-nocheck

/**
 * ===== OTP SERVICE (IN-MEMORY) =====
 * Quản lý OTP cho forgot password flow
 * OTP được lưu trong memory, tự động xóa sau 120 giây
 */

// In-memory OTP store
// Structure: { email: { otp, expiresAt, verified } }
const otpStore = new Map();

// OTP configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 120; // 2 minutes
const OTP_RESEND_COOLDOWN = 60; // 1 minute

/**
 * Generate random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP for email
 */
const storeOTP = (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  otpStore.set(normalizedEmail, {
    otp,
    expiresAt: Date.now() + (OTP_EXPIRY_SECONDS * 1000),
    verified: false,
    createdAt: Date.now()
  });

  // Auto-cleanup after expiry
  setTimeout(() => {
    if (otpStore.has(normalizedEmail)) {
      const data = otpStore.get(normalizedEmail);
      if (!data.verified) {
        otpStore.delete(normalizedEmail);
        console.log(`🗑️ Auto-deleted expired OTP for: ${normalizedEmail}`);
      }
    }
  }, OTP_EXPIRY_SECONDS * 1000);

  console.log(`✅ OTP stored for ${normalizedEmail}, expires in ${OTP_EXPIRY_SECONDS}s`);
};

/**
 * Get OTP data for email
 */
const getOTP = (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  return otpStore.get(normalizedEmail);
};

/**
 * Verify OTP for email
 */
const verifyOTP = (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();
  const data = otpStore.get(normalizedEmail);

  if (!data) {
    return {
      success: false,
      error: 'OTP not found. Please request a new one.'
    };
  }

  // Check if expired
  if (Date.now() > data.expiresAt) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      error: 'OTP has expired. Please request a new one.'
    };
  }

  // Check if OTP matches
  if (data.otp !== otp) {
    return {
      success: false,
      error: 'Invalid OTP. Please try again.'
    };
  }

  // Mark as verified
  data.verified = true;
  otpStore.set(normalizedEmail, data);

  console.log(`✅ OTP verified for: ${normalizedEmail}`);

  return {
    success: true,
    message: 'OTP verified successfully'
  };
};

/**
 * Check if OTP is verified for email
 */
const isOTPVerified = (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const data = otpStore.get(normalizedEmail);

  if (!data) return false;
  if (Date.now() > data.expiresAt) {
    otpStore.delete(normalizedEmail);
    return false;
  }

  return data.verified === true;
};

/**
 * Delete OTP for email (cleanup after password reset)
 */
const deleteOTP = (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  otpStore.delete(normalizedEmail);
  console.log(`🗑️ OTP deleted for: ${normalizedEmail}`);
};

/**
 * Check if can resend OTP (cooldown)
 */
const canResendOTP = (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const data = otpStore.get(normalizedEmail);

  if (!data) return { canResend: true }; // No OTP exists, can send

  const timeSinceCreation = Date.now() - data.createdAt;
  const cooldownRemaining = OTP_RESEND_COOLDOWN * 1000 - timeSinceCreation;

  if (cooldownRemaining > 0) {
    return {
      canResend: false,
      waitSeconds: Math.ceil(cooldownRemaining / 1000)
    };
  }

  return { canResend: true };
};

/**
 * Get remaining time for OTP
 */
const getRemainingTime = (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const data = otpStore.get(normalizedEmail);

  if (!data) return 0;

  const remaining = data.expiresAt - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

module.exports = {
  generateOTP,
  storeOTP,
  getOTP,
  verifyOTP,
  isOTPVerified,
  deleteOTP,
  canResendOTP,
  getRemainingTime,
  OTP_EXPIRY_SECONDS
};
