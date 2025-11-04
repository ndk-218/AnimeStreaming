// @ts-nocheck
const jwt = require('jsonwebtoken');

/**
 * ===== JWT UTILITIES FOR USER AUTHENTICATION =====
 * Generate và verify JWT tokens cho user system
 * Tách riêng với admin JWT để dễ quản lý và có thể config khác nhau
 */

/**
 * Generate Access Token (short-lived)
 * Used for API requests authentication
 * 
 * @param {Object} user - User document from database
 * @returns {String} JWT access token
 */
const generateAccessToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    username: user.username,
    isPremium: user.isPremium || false,
    type: 'access'
  };

  const options = {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h', // 1 hour default
    issuer: 'anime-streaming-api'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Generate Refresh Token (long-lived)
 * Used to get new access token without re-login
 * 
 * @param {Object} user - User document from database
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    type: 'refresh'
  };

  const options = {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d', // 30 days default
    issuer: 'anime-streaming-api'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Verify Access Token
 * 
 * @param {String} token - JWT access token
 * @returns {Object|null} Decoded payload or null if invalid
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's an access token
    if (decoded.type !== 'access') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('❌ Access token verification failed:', error.message);
    return null;
  }
};

/**
 * Verify Refresh Token
 * 
 * @param {String} token - JWT refresh token
 * @returns {Object|null} Decoded payload or null if invalid
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's a refresh token
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('❌ Refresh token verification failed:', error.message);
    return null;
  }
};

/**
 * Decode token without verification (for debugging)
 * 
 * @param {String} token - JWT token
 * @returns {Object|null} Decoded payload or null if invalid format
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('❌ Token decode failed:', error.message);
    return null;
  }
};

/**
 * Extract token from Authorization header
 * 
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  extractTokenFromHeader
};
