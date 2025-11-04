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

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error: 'Please verify your email before accessing this resource.'
      });
    }

    // Check premium expiry
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
    
    if (user && user.isActive && user.isEmailVerified) {
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
 * Must be used after userAuth middleware
 */
const requirePremium = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (!req.user.isPremium) {
      return res.status(403).json({
        success: false,
        error: 'Premium subscription required to access this resource.',
        upgradeUrl: `${process.env.FRONTEND_URL}/premium`
      });
    }

    // Check premium expiry
    if (req.user.premiumExpiry && new Date() > req.user.premiumExpiry) {
      req.user.isPremium = false;
      req.user.premiumExpiry = null;
      await req.user.save();

      return res.status(403).json({
        success: false,
        error: 'Your premium subscription has expired.',
        renewUrl: `${process.env.FRONTEND_URL}/premium`
      });
    }

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
 * Anonymous: max 480p
 * Regular user: max 720p
 * Premium user: max 1080p
 */
const checkVideoQualityAccess = (req, res, next) => {
  try {
    const requestedQuality = req.query.quality || req.params.quality || '480p';

    // Define quality hierarchy
    const qualityLevels = {
      '360p': 1,
      '480p': 2,
      '720p': 3,
      '1080p': 4
    };

    const requestedLevel = qualityLevels[requestedQuality] || 2;

    // Determine user tier
    let maxAllowedLevel = 2; // Default: Anonymous (480p)

    if (req.user) {
      if (req.user.isPremium && new Date() < req.user.premiumExpiry) {
        maxAllowedLevel = 4; // Premium: 1080p
      } else if (req.user.isEmailVerified) {
        maxAllowedLevel = 3; // Regular user: 720p
      }
    }

    // Check access
    if (requestedLevel > maxAllowedLevel) {
      const maxQuality = Object.keys(qualityLevels).find(
        key => qualityLevels[key] === maxAllowedLevel
      );

      return res.status(403).json({
        success: false,
        error: `Video quality ${requestedQuality} requires ${
          maxAllowedLevel === 4 ? 'Premium subscription' : 
          maxAllowedLevel === 3 ? 'User account' : 
          'higher access level'
        }`,
        maxAllowedQuality: maxQuality,
        upgradeUrl: !req.user 
          ? `${process.env.FRONTEND_URL}/register`
          : `${process.env.FRONTEND_URL}/premium`
      });
    }

    // Attach allowed quality to request
    req.allowedQuality = requestedQuality;
    req.userTier = !req.user ? 'anonymous' : req.user.isPremium ? 'premium' : 'regular';

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
