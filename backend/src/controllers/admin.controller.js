// @ts-nocheck
const Admin = require('../models/Admin');
const { generateToken } = require('../middleware/auth');
const { SeriesService, SeasonService, EpisodeService } = require('../services');

/**
 * ===== ADMIN CONTROLLER - JAVASCRIPT VERSION =====
 * Authentication và admin management cho Phase 1
 */

/**
 * Admin login
 * POST /api/admin/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if admin account is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated. Please contact system administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(admin);

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Return success with token
    res.json({
      success: true,
      data: {
        accessToken: token,
        expiresIn: rememberMe ? '30d' : '7d',
        admin: {
          id: admin._id,
          email: admin.email,
          displayName: admin.displayName,
          role: admin.role,
          lastLogin: admin.lastLogin
        }
      },
      message: 'Login successful'
    });

    console.log(`👤 Admin logged in: ${admin.email}`);

  } catch (error) {
    console.error('❌ Admin login error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
};

/**
 * Admin logout (optional - mainly for logging)
 * POST /api/admin/auth/logout
 */
const logout = async (req, res) => {
  try {
    // Since we're using stateless JWT, logout is mainly logging
    const admin = req.admin;
    
    console.log(`👤 Admin logged out: ${admin.email}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('❌ Admin logout error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

/**
 * Get admin profile
 * GET /api/admin/auth/profile
 */
const getProfile = async (req, res) => {
  try {
    const admin = req.admin;

    res.json({
      success: true,
      data: {
        id: admin._id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Get admin profile error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
};

/**
 * Update admin profile
 * PUT /api/admin/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const admin = req.admin;
    const { displayName, email } = req.body;

    // Only allow updating certain fields
    if (displayName) {
      admin.displayName = displayName.trim();
    }

    // Check if email is already taken (if changing)
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          error: 'Email is already taken'
        });
      }
      admin.email = email.toLowerCase().trim();
    }

    await admin.save();

    res.json({
      success: true,
      data: {
        id: admin._id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('❌ Update admin profile error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Change admin password
 * PUT /api/admin/auth/password
 */
const changePassword = async (req, res) => {
  try {
    const admin = req.admin;
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Set new password (will be hashed in pre-save hook)
    await admin.setPassword(newPassword);
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

    console.log(`🔑 Admin password changed: ${admin.email}`);

  } catch (error) {
    console.error('❌ Change admin password error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get stats from all services
    const [seriesStats, seasonStats, episodeStats] = await Promise.all([
      SeriesService.getSeriesStats(),
      SeasonService.getSeasonStats(), 
      EpisodeService.getEpisodeStats()
    ]);

    // Calculate totals
    const totalContent = {
      series: seriesStats.total,
      seasons: seasonStats.total,
      episodes: episodeStats.total,
      totalViews: seriesStats.totalViews + (episodeStats.totalViews || 0)
    };

    // Processing status summary
    const processingStatus = {
      pending: episodeStats.byStatus?.pending || 0,
      processing: episodeStats.byStatus?.processing || 0,
      completed: episodeStats.byStatus?.completed || 0,
      failed: episodeStats.byStatus?.failed || 0
    };

    // Content breakdown
    const contentBreakdown = {
      seriesByStatus: seriesStats.byStatus,
      seasonsByType: seasonStats.byType,
      episodesByStatus: episodeStats.byStatus
    };

    res.json({
      success: true,
      data: {
        totalContent,
        processingStatus,
        contentBreakdown,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Get dashboard stats error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard statistics'
    });
  }
};

/**
 * Create admin user (Super admin only - for setup)
 * POST /api/admin/users
 */
const createAdmin = async (req, res) => {
  try {
    const { email, password, displayName, role = 'admin' } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin with this email already exists'
      });
    }

    // Create new admin
    const admin = new Admin({
      email: email.toLowerCase().trim(),
      displayName: displayName.trim(),
      role,
      isActive: true
    });

    await admin.setPassword(password);
    await admin.save();

    res.status(201).json({
      success: true,
      data: {
        id: admin._id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role
      },
      message: 'Admin user created successfully'
    });

    console.log(`👤 New admin created: ${admin.email}`);

  } catch (error) {
    console.error('❌ Create admin error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  getDashboardStats,
  createAdmin
};