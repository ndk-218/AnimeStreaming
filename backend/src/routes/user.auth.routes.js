// @ts-nocheck
const express = require('express');
const router = express.Router();

// Import controllers
const userAuthController = require('../controllers/user.auth.controller');

// Import middleware
const { userAuth } = require('../middleware/userAuth');
const {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateResetPassword,
  validateEmail
} = require('../middleware/userValidation');

/**
 * ===== USER AUTHENTICATION ROUTES =====
 * All routes prefixed with /api/users/auth
 */

/**
 * @route   POST /api/users/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', validateRegister, userAuthController.register);

/**
 * @route   GET /api/users/auth/verify-email/:token
 * @desc    Verify email with token
 * @access  Public
 */
router.get('/verify-email/:token', userAuthController.verifyEmail);

/**
 * @route   POST /api/users/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', validateEmail, userAuthController.resendVerification);

/**
 * @route   POST /api/users/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateLogin, userAuthController.login);

/**
 * @route   POST /api/users/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh-token', userAuthController.refreshToken);

/**
 * @route   POST /api/users/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private (requires authentication)
 */
router.post('/logout', userAuth, userAuthController.logout);

/**
 * @route   POST /api/users/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password', validateEmail, userAuthController.forgotPassword);

/**
 * @route   POST /api/users/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', validateResetPassword, userAuthController.resetPassword);

/**
 * @route   POST /api/users/auth/change-password
 * @desc    Change password (for logged-in users)
 * @access  Private (requires authentication)
 */
router.post('/change-password', userAuth, validateChangePassword, userAuthController.changePassword);

/**
 * @route   GET /api/users/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get('/me', userAuth, userAuthController.getCurrentUser);

/**
 * ===== OTP-BASED PASSWORD RESET ROUTES =====
 */

/**
 * @route   POST /api/users/auth/request-otp
 * @desc    Request OTP for password reset
 * @access  Public
 */
router.post('/request-otp', validateEmail, userAuthController.requestOTP);

/**
 * @route   POST /api/users/auth/verify-otp
 * @desc    Verify OTP code
 * @access  Public
 */
router.post('/verify-otp', userAuthController.verifyOTP);

/**
 * @route   POST /api/users/auth/reset-password-otp
 * @desc    Reset password with verified OTP
 * @access  Public
 */
router.post('/reset-password-otp', userAuthController.resetPasswordWithOTP);

module.exports = router;
