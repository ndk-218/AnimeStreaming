// @ts-nocheck
const express = require('express');
const router = express.Router();

// Import admin controller
const {
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  getDashboardStats,
  createAdmin
} = require('../controllers/admin.controller');

// Import controller for image upload
const seriesController = require('../controllers/series.controller');
const seasonsController = require('../controllers/seasons.controller');

// Import middleware
const {
  adminAuth,
  validateAdminLogin,
  validateAdminRegister,
  catchAsync
} = require('../middleware');

// Import upload middleware for images
const { uploadSingleImage, handleUploadError } = require('../middleware/upload');

// Import validation from express-validator for custom admin validations
const { body, validationResult } = require('express-validator');

/**
 * ===== ADMIN AUTHENTICATION ROUTES =====
 */

// Admin login
// POST /api/admin/auth/login
// Body: { email, password, rememberMe }
router.post('/auth/login', 
  validateAdminLogin,
  catchAsync(login)
);

// Admin logout 
// POST /api/admin/auth/logout
router.post('/auth/logout', 
  adminAuth,
  catchAsync(logout)
);

// Get admin profile
// GET /api/admin/auth/profile
router.get('/auth/profile', 
  adminAuth,
  catchAsync(getProfile)
);

// Update admin profile
// PUT /api/admin/auth/profile
router.put('/auth/profile',
  adminAuth,
  [
    body('displayName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Display name must be between 2-50 characters'),
      
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
      
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array().map(err => err.msg).join(', ')
        });
      }
      next();
    }
  ],
  catchAsync(updateProfile)
);

// Change admin password
// PUT /api/admin/auth/password
router.put('/auth/password',
  adminAuth,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
      
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
      
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array().map(err => err.msg).join(', ')
        });
      }
      next();
    }
  ],
  catchAsync(changePassword)
);

/**
 * ===== ADMIN DASHBOARD ROUTES =====
 */

// Get dashboard statistics
// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', 
  adminAuth,
  catchAsync(getDashboardStats)
);

/**
 * ===== ADMIN USER MANAGEMENT =====
 */

// Create new admin user
// POST /api/admin/users
router.post('/users',
  adminAuth,
  // TODO: Add super admin check
  validateAdminRegister,
  catchAsync(createAdmin)
);

// Get all users with pagination
// GET /api/admin/users?page=1&limit=18
router.get('/users',
  adminAuth,
  catchAsync(async (req, res) => {
    try {
      const { page = 1, limit = 18 } = req.query;
      const User = require('../models/User');
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [users, total] = await Promise.all([
        User.find()
          .select('displayName avatar role createdAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        User.countDocuments()
      ]);
      
      res.json({
        success: true,
        data: {
          users,
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          total
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users'
      });
    }
  })
);

/**
 * ===== CONTENT MANAGEMENT ROUTES (CRUD) =====
 */

// Series Management
router.post('/series',
  adminAuth,
  uploadSingleImage, // Thêm middleware để xử lý FormData + file upload
  handleUploadError,
  catchAsync(seriesController.createSeries.bind(seriesController))
);

router.put('/series/:id',
  adminAuth,
  catchAsync(seriesController.updateSeries.bind(seriesController))
);

router.delete('/series/:id',
  adminAuth,
  catchAsync(seriesController.deleteSeries.bind(seriesController))
);

// Seasons Management
router.post('/seasons',
  adminAuth,
  catchAsync(seasonsController.createSeason)
);

router.put('/seasons/:id',
  adminAuth,
  catchAsync(seasonsController.updateSeason)
);

router.delete('/seasons/:id',
  adminAuth,
  catchAsync(seasonsController.deleteSeason)
);

/**
 * ===== CONTENT IMAGE UPLOAD ROUTES =====
 */

// Upload series banner image
// PUT /api/admin/series/:id/banner
router.put('/series/:id/banner',
  adminAuth,
  uploadSingleImage,
  handleUploadError,
  catchAsync(seriesController.uploadBanner.bind(seriesController))
);

// Upload season poster image
// PUT /api/admin/seasons/:id/poster
router.put('/seasons/:id/poster',
  adminAuth,
  uploadSingleImage,
  handleUploadError,
  catchAsync(seasonsController.uploadPoster)
);

/**
 * ===== SYSTEM ROUTES =====
 */

// Health check for admin routes
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin routes are working',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        login: 'POST /api/admin/auth/login',
        logout: 'POST /api/admin/auth/logout',
        profile: 'GET /api/admin/auth/profile',
        updateProfile: 'PUT /api/admin/auth/profile',
        changePassword: 'PUT /api/admin/auth/password'
      },
      dashboard: {
        stats: 'GET /api/admin/dashboard/stats'
      },
      users: {
        create: 'POST /api/admin/users'
      }
    }
  });
});

module.exports = router;