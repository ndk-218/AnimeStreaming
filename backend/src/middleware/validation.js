// @ts-nocheck
const { body, param, query, validationResult } = require('express-validator');
const { handleValidationErrors } = require('./errorHandler');

/**
 * ===== REQUEST VALIDATION MIDDLEWARE =====
 * Express-validator rules cho API endpoints
 */

/**
 * Handle validation results
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const error = handleValidationErrors(errors.array());
    return next(error);
  }
  
  next();
};

/**
 * ===== SERIES VALIDATION RULES =====
 */
const validateCreateSeries = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1-200 characters'),
    
  body('originalTitle')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Original title must not exceed 200 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),
    
  body('releaseYear')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage('Release year must be between 1900 and future 5 years'),
    
  body('status')
    .optional()
    .isIn(['ongoing', 'completed', 'upcoming'])
    .withMessage('Status must be: ongoing, completed, or upcoming'),
    
  body('genres')
    .optional()
    .isArray()
    .withMessage('Genres must be an array')
    .custom((value) => {
      if (value && value.length > 10) {
        throw new Error('Maximum 10 genres allowed');
      }
      return true;
    }),
    
  body('genres.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each genre must be 1-50 characters'),
    
  body('studio')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Studio name must not exceed 100 characters'),
    
  validateRequest
];

const validateUpdateSeries = [
  param('id')
    .isMongoId()
    .withMessage('Invalid series ID'),
    
  ...validateCreateSeries.slice(0, -1), // Reuse create validation without validateRequest
  validateRequest
];

/**
 * ===== SEASON VALIDATION RULES =====
 */
const validateCreateSeason = [
  body('seriesId')
    .notEmpty()
    .withMessage('Series ID is required')
    .isMongoId()
    .withMessage('Invalid series ID'),
    
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1-200 characters'),
    
  body('seasonNumber')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Season number must be a non-negative integer'),
    
  body('seasonType')
    .notEmpty()
    .withMessage('Season type is required')
    .isIn(['tv', 'movie', 'ova', 'special'])
    .withMessage('Season type must be: tv, movie, ova, or special'),
    
  body('releaseYear')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage('Release year must be between 1900 and future 5 years'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
    
  validateRequest
];

const validateUpdateSeason = [
  param('id')
    .isMongoId()
    .withMessage('Invalid season ID'),
    
  // seriesId - OPTIONAL for update, không cho phép thay đổi
  body('seriesId')
    .optional()
    .isMongoId()
    .withMessage('Invalid series ID'),
    
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1-200 characters'),
    
  body('seasonNumber')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Season number must be a non-negative integer'),
    
  // seasonType - OPTIONAL for update
  body('seasonType')
    .optional()
    .isIn(['tv', 'movie', 'ova', 'special'])
    .withMessage('Season type must be: tv, movie, ova, or special'),
    
  body('releaseYear')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage('Release year must be between 1900 and future 5 years'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
    
  body('status')
    .optional()
    .isIn(['upcoming', 'airing', 'completed', 'cancelled'])
    .withMessage('Status must be: upcoming, airing, completed, or cancelled'),
    
  body('studios')
    .optional()
    .isArray()
    .withMessage('Studios must be an array'),
    
  body('genres')
    .optional()
    .isArray()
    .withMessage('Genres must be an array'),
    
  validateRequest
];

/**
 * ===== EPISODE VALIDATION RULES =====
 */
const validateCreateEpisode = [
  body('seriesId')
    .notEmpty()
    .withMessage('Series ID is required')
    .isMongoId()
    .withMessage('Invalid series ID'),
    
  body('seasonId')
    .notEmpty()
    .withMessage('Season ID is required')
    .isMongoId()
    .withMessage('Invalid season ID'),
    
  body('episodeNumber')
    .notEmpty()
    .withMessage('Episode number is required')
    .toInt() // ← Convert string to int FIRST
    .isInt({ min: 1 })
    .withMessage('Episode number must be a positive integer'),
    
  body('title')
    .notEmpty()
    .withMessage('Episode title is required')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Title must be between 1-300 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Description must not exceed 3000 characters'),
    
  validateRequest
];

const validateUpdateEpisode = [
  param('id')
    .isMongoId()
    .withMessage('Invalid episode ID'),
    
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Title must be between 1-300 characters'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Description must not exceed 3000 characters'),
    
  validateRequest
];

const validateAddSubtitle = [
  param('id')
    .isMongoId()
    .withMessage('Invalid episode ID'),
    
  body('language')
    .notEmpty()
    .withMessage('Language code is required')
    .isLength({ min: 2, max: 5 })
    .withMessage('Language code must be 2-5 characters (e.g., "en", "ja", "vi")'),
    
  body('label')
    .notEmpty()
    .withMessage('Language label is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Label must be between 1-50 characters'),
    
  validateRequest
];

/**
 * ===== ADMIN VALIDATION RULES =====
 */
const validateAdminLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    
  validateRequest
];

const validateAdminRegister = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  body('displayName')
    .notEmpty()
    .withMessage('Display name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2-50 characters'),
    
  validateRequest
];

/**
 * ===== COMMON PARAMETER VALIDATIONS =====
 */
const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
    
  validateRequest
];

const validateSeriesId = [
  param('seriesId')
    .isMongoId()
    .withMessage('Invalid series ID'),
    
  validateRequest
];

const validateSeasonId = [
  param('seasonId')
    .isMongoId()
    .withMessage('Invalid season ID'),
    
  validateRequest
];

/**
 * ===== QUERY PARAMETER VALIDATIONS =====
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100')
    .toInt(),
    
  validateRequest
];

const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1-100 characters'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1-50')
    .toInt(),
    
  validateRequest
];

const validateSeriesFilters = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1-100 characters'),
    
  query('genres')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const genres = value.split(',');
        if (genres.length > 10) {
          throw new Error('Maximum 10 genres allowed');
        }
      }
      return true;
    }),
    
  query('status')
    .optional()
    .isIn(['ongoing', 'completed', 'upcoming'])
    .withMessage('Status must be: ongoing, completed, or upcoming'),
    
  query('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage('Year must be between 1900 and future 5 years')
    .toInt(),
    
  query('studio')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Studio name must be between 1-100 characters'),
    
  ...validatePagination.slice(0, -1), // Include pagination without validateRequest
  validateRequest
];

/**
 * ===== PROCESSING STATUS VALIDATION =====
 */
const validateProcessingStatus = [
  param('id')
    .isMongoId()
    .withMessage('Invalid episode ID'),
    
  body('processingStatus')
    .notEmpty()
    .withMessage('Processing status is required')
    .isIn(['pending', 'processing', 'completed', 'failed'])
    .withMessage('Processing status must be: pending, processing, completed, or failed'),
    
  body('hlsPath')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('HLS path must not be empty'),
    
  body('duration')
    .optional()
    .toInt() // ← Convert string to int
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (seconds)'),
    
  body('qualities')
    .optional()
    .isArray()
    .withMessage('Qualities must be an array'),
    
  validateRequest
];

/**
 * ===== CUSTOM VALIDATORS =====
 */
const validateGenre = [
  param('genre')
    .notEmpty()
    .withMessage('Genre is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Genre must be between 1-50 characters')
    .matches(/^[a-zA-Z\s-]+$/)
    .withMessage('Genre must contain only letters, spaces, and hyphens'),
    
  validateRequest
];

const validateSlug = [
  param('slug')
    .notEmpty()
    .withMessage('Slug is required')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Slug must be between 1-200 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
    
  validateRequest
];

/**
 * ===== SANITIZATION HELPERS =====
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/\s+/g, ' '); // Remove extra whitespace
};

const sanitizeArray = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return arr.filter(item => item && typeof item === 'string').map(sanitizeString);
};

/**
 * ===== EXPORT ALL VALIDATORS =====
 */
module.exports = {
  // Core validation
  validateRequest,
  
  // Series validators
  validateCreateSeries,
  validateUpdateSeries,
  
  // Season validators
  validateCreateSeason,
  validateUpdateSeason,
  
  // Episode validators
  validateCreateEpisode,
  validateUpdateEpisode,
  validateAddSubtitle,
  validateProcessingStatus,
  
  // Admin validators
  validateAdminLogin,
  validateAdminRegister,
  
  // Parameter validators
  validateMongoId,
  validateSeriesId,
  validateSeasonId,
  validateGenre,
  validateSlug,
  
  // Query validators
  validatePagination,
  validateSearch,
  validateSeriesFilters,
  
  // Utilities
  sanitizeString,
  sanitizeArray
};