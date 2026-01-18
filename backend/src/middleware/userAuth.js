// @ts-nocheck
const User = require('../models/User');
const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwtUtils');

/**
 * ===== USER AUTHENTICATION MIDDLEWARE =====
 * JWT-based user authentication
 */

/**
 * Require user authentication
 * Verify JWT token và attach user to request
 */
const userAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    // Verify access token
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Invalid or expired token.'
      });
    }
    
    // Check if token is user token (not admin)
    if (decoded.role && decoded.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin token cannot access user resources.',
        tokenRole: 'admin',
        shouldClearToken: true
      });
    }

    // Find user in database
    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. User not found.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Account is deactivated.'
      });
    }

    // Check premium expiry (removed email verification check)
    if (user.isPremium && user.premiumExpiry) {
      if (new Date() > user.premiumExpiry) {
        user.isPremium = false;
        user.premiumExpiry = null;
        await user.save();
      }
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id.toString();

    next();

  } catch (error) {
    console.error('❌ User auth middleware error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Authentication error occurred.'
    });
  }
};

/**
 * Optional user authentication
 * Attach user if token exists, otherwise continue without user
 */
const optionalUserAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      // No token, continue without user
      return next();
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      // Invalid token, continue without user
      return next();
    }

    // Find user
    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    
    if (user && user.isActive) {
      // Check premium expiry
      if (user.isPremium && user.premiumExpiry) {
        if (new Date() > user.premiumExpiry) {
          user.isPremium = false;
          user.premiumExpiry = null;
          await user.save();
        }
      }

      req.user = user;
      req.userId = user._id.toString();
    }

    next();

  } catch (error) {
    console.error('❌ Optional user auth error:', error.message);
    // Continue without user on error
    next();
  }
};

/**
 * Require premium user
 * DEPRECATED: No longer used - All logged in users have full access
 * Kept for backward compatibility
 */
const requirePremium = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    // All logged in users now have full access
    next();

  } catch (error) {
    console.error('❌ Require premium middleware error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Authorization error occurred.'
    });
  }
};

/**
 * Check video quality access based on user tier
 * NEW LOGIC:
 * - Anonymous (not logged in): 480p, 720p only
 * - Logged in users: All qualities (480p, 720p, 1080p, Upscaled)
 */
const checkVideoQualityAccess = (req, res, next) => {
  try {
    const requestedQuality = req.query.quality || req.params.quality || '480p';

    // Define quality hierarchy
    const qualityLevels = {
      '360p': 1,
      '480p': 2,
      '720p': 3,
      '1080p': 4,
      'Upscaled': 5
    };

    const requestedLevel = qualityLevels[requestedQuality] || 2;

    // Determine user tier
    let maxAllowedLevel;
    let userTier;

    if (req.user) {
      // Logged in users: Full access to all qualities
      maxAllowedLevel = 5; // All qualities including Upscaled
      userTier = 'logged_in';
    } else {
      // Anonymous users: 480p and 720p only
      maxAllowedLevel = 3; // Max 720p
      userTier = 'anonymous';
    }

    // Check access
    if (requestedLevel > maxAllowedLevel) {
      const maxQuality = Object.keys(qualityLevels).find(
        key => qualityLevels[key] === maxAllowedLevel
      );

      return res.status(403).json({
        success: false,
        error: `Video quality ${requestedQuality} requires user login.`,
        message: 'Please login to access higher quality videos (1080p, Upscaled).',
        maxAllowedQuality: maxQuality,
        loginUrl: `${process.env.FRONTEND_URL}/login`
      });
    }

    // Attach allowed quality to request
    req.allowedQuality = requestedQuality;
    req.userTier = userTier;

    next();

  } catch (error) {
    console.error('❌ Check video quality access error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Authorization error occurred.'
    });
  }
};

module.exports = {
  userAuth,
  optionalUserAuth,
  requirePremium,
  checkVideoQualityAccess
};
