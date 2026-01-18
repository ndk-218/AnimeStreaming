// @ts-nocheck

/**
 * ===== MIDDLEWARE INDEX =====
 * Export tất cả middleware từ một nơi
 */

// Authentication middleware
const {
  adminAuth,
  optionalAuth,
  requirePermission,
  generateToken,
  verifyToken
} = require('./auth');

// User authentication middleware
const {
  userAuth,
  optionalUserAuth,
  requirePremium,
  checkVideoQualityAccess
} = require('./userAuth');

// Upload middleware
const {
  uploadVideo,
  uploadSubtitles,
  uploadSubtitle,
  uploadImage,
  uploadSingleImage,
  uploadEpisode,
  handleUploadError,
  cleanupTempFile,
  validateFileUpload,
  ensureUploadDirs
} = require('./upload');

// Error handling middleware
const {
  globalErrorHandler,
  notFound,
  createOperationalError,
  catchAsync,
  handleValidationErrors,
  handleDatabaseError
} = require('./errorHandler');

// Validation middleware
const {
  validateRequest,
  validateCreateSeries,
  validateUpdateSeries,
  validateCreateSeason,
  validateUpdateSeason,
  validateCreateEpisode,
  validateUpdateEpisode,
  validateAddSubtitle,
  validateProcessingStatus,
  validateAdminLogin,
  validateAdminRegister,
  validateMongoId,
  validateSeriesId,
  validateSeasonId,
  validateGenre,
  validateSlug,
  validatePagination,
  validateSearch,
  validateSeriesFilters,
  sanitizeString,
  sanitizeArray
} = require('./validation');

/**
 * ===== GROUPED EXPORTS =====
 */

// Authentication
const auth = {
  adminAuth,
  optionalAuth,
  requirePermission,
  generateToken,
  verifyToken,
  userAuth,
  optionalUserAuth,
  requirePremium,
  checkVideoQualityAccess
};

// File uploads
const upload = {
  uploadVideo,
  uploadSubtitles,
  uploadSubtitle,
  uploadImage,
  uploadSingleImage,
  uploadEpisode,
  handleUploadError,
  cleanupTempFile,
  validateFileUpload,
  ensureUploadDirs
};

// Error handling
const errors = {
  globalErrorHandler,
  notFound,
  createOperationalError,
  catchAsync,
  handleValidationErrors,
  handleDatabaseError
};

// Validation
const validation = {
  validateRequest,
  // Series validations
  validateCreateSeries,
  validateUpdateSeries,
  // Season validations
  validateCreateSeason,
  validateUpdateSeason,
  // Episode validations
  validateCreateEpisode,
  validateUpdateEpisode,
  validateAddSubtitle,
  validateProcessingStatus,
  // Admin validations
  validateAdminLogin,
  validateAdminRegister,
  // Parameter validations
  validateMongoId,
  validateSeriesId,
  validateSeasonId,
  validateGenre,
  validateSlug,
  // Query validations
  validatePagination,
  validateSearch,
  validateSeriesFilters,
  // Utilities
  sanitizeString,
  sanitizeArray
};

/**
 * ===== COMBINED MIDDLEWARE CHAINS =====
 * Pre-configured middleware chains cho common use cases
 */

// Admin content creation chain
const adminContentCreation = [
  auth.adminAuth,
  // validation will be added per route
];

// File upload with auth
const adminVideoUpload = [
  auth.adminAuth,
  upload.uploadEpisode,
  upload.handleUploadError
];

const adminSubtitleUpload = [
  auth.adminAuth,
  upload.uploadSubtitle,
  upload.handleUploadError
];

const adminImageUpload = [
  auth.adminAuth,
  upload.uploadSingleImage,
  upload.handleUploadError
];

// Public content access (with optional auth)
const publicContentAccess = [
  auth.optionalAuth,
  // No file upload needed
];

// Admin update operations
const adminUpdate = [
  auth.adminAuth,
  validation.validateMongoId
];

// Search and filtering
const publicSearch = [
  auth.optionalAuth,
  validation.validateSearch
];

const publicFilter = [
  auth.optionalAuth,
  validation.validateSeriesFilters
];

/**
 * ===== INDIVIDUAL EXPORTS =====
 * For direct imports
 */
module.exports = {
  // Grouped middleware
  auth,
  upload,
  errors,
  validation,
  
  // Pre-configured chains
  adminContentCreation,
  adminVideoUpload,
  adminSubtitleUpload,
  adminImageUpload,
  publicContentAccess,
  adminUpdate,
  publicSearch,
  publicFilter,
  
  // Individual middleware (for backward compatibility)
  adminAuth,
  optionalAuth,
  requirePermission,
  generateToken,
  verifyToken,
  userAuth,
  optionalUserAuth,
  requirePremium,
  checkVideoQualityAccess,
  
  uploadVideo,
  uploadSubtitles,
  uploadSubtitle,
  uploadImage,
  uploadSingleImage,
  uploadEpisode,
  handleUploadError,
  cleanupTempFile,
  validateFileUpload,
  ensureUploadDirs,
  
  globalErrorHandler,
  notFound,
  createOperationalError,
  catchAsync,
  handleValidationErrors,
  handleDatabaseError,
  
  validateRequest,
  validateCreateSeries,
  validateUpdateSeries,
  validateCreateSeason,
  validateUpdateSeason,
  validateCreateEpisode,
  validateUpdateEpisode,
  validateAddSubtitle,
  validateProcessingStatus,
  validateAdminLogin,
  validateAdminRegister,
  validateMongoId,
  validateSeriesId,
  validateSeasonId,
  validateGenre,
  validateSlug,
  validatePagination,
  validateSearch,
  validateSeriesFilters,
  sanitizeString,
  sanitizeArray
};