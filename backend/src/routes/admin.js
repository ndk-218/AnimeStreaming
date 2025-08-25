// @ts-nocheck
const express = require('express');
const router = express.Router();

// TODO: Import admin controller (sẽ tạo sau)
// const {
//   login,
//   logout,
//   getProfile,
//   updateProfile,
//   getDashboardStats
// } = require('../controllers/admin.controller');

// TODO: Import middleware
// const { adminAuth } = require('../middleware/auth');

/**
 * ===== ADMIN AUTHENTICATION ROUTES =====
 */

// Admin login
// POST /api/admin/auth/login
// Body: { email, password, rememberMe }
// router.post('/auth/login', login);

// Admin logout  
// POST /api/admin/auth/logout
// router.post('/auth/logout', logout); // TODO: Add adminAuth middleware

// Get admin profile
// GET /api/admin/auth/profile
// router.get('/auth/profile', getProfile); // TODO: Add adminAuth middleware

// Update admin profile
// PUT /api/admin/auth/profile
// router.put('/auth/profile', updateProfile); // TODO: Add adminAuth middleware

/**
 * ===== ADMIN DASHBOARD ROUTES =====
 */

// Get dashboard statistics
// GET /api/admin/dashboard/stats
// router.get('/dashboard/stats', getDashboardStats); // TODO: Add adminAuth middleware

/**
 * ===== CONTENT MANAGEMENT ROUTES =====
 * Note: Các routes content management đã được define trong series, seasons, episodes routes
 * với prefix /admin, nhưng có thể group lại ở đây nếu cần
 */

// Placeholder routes - sẽ implement admin controller sau
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin routes are working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;