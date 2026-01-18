// @ts-nocheck
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * ===== AUTHENTICATION MIDDLEWARE =====
 * JWT-based admin authentication cho Phase 1
 */

/**
 * Verify JWT token và admin permissions
 */
const adminAuth = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No authorization header provided.'
      });
    }

    // Check Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Invalid authorization format. Use: Bearer <token>'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is admin token
    if (decoded.role && decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'User token cannot access admin resources.',
        tokenRole: 'user',
        shouldClearToken: true
      });
    }
    
    // Find admin in database
    const admin = await Admin.findById(decoded.adminId).select('-password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Admin not found.'
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Admin account is deactivated.'
      });
    }

    // Attach admin to request object
    req.admin = admin;
    req.adminId = admin._id.toString();

    next();

  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Token expired.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Authentication error occurred.'
    });
  }
};

/**
 * Optional auth - không bắt buộc đăng nhập nhưng attach user nếu có token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Không có token thì skip
      return next();
    }

    const token = authHeader.substring(7);
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.adminId).select('-password');
        
        if (admin && admin.isActive) {
          req.admin = admin;
          req.adminId = admin._id.toString();
        }
      } catch (error) {
        // Token không hợp lệ thì skip, không throw error
        console.log('Optional auth: Invalid token, continuing without auth');
      }
    }

    next();

  } catch (error) {
    // Optional auth nên không block request
    console.error('❌ Optional auth error:', error.message);
    next();
  }
};

/**
 * Check specific admin permissions (future use)
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    // Đơn giản hóa cho Phase 1 - tất cả admin có full permission
    // Sau này có thể extend với role-based permissions
    if (req.admin.role !== 'admin' && req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions.'
      });
    }

    next();
  };
};

/**
 * Generate JWT token cho admin
 */
const generateToken = (admin) => {
  const payload = {
    adminId: admin._id.toString(),
    email: admin.email,
    role: 'admin', // Always 'admin' for admin tokens
    adminRole: admin.role, // 'admin' or 'super_admin'
    displayName: admin.displayName
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'anime-streaming-api'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Verify token without middleware (utility function)
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  adminAuth,
  optionalAuth,
  requirePermission,
  generateToken,
  verifyToken
};