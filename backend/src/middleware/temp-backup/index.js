/**
 * Temporary middleware functions for server startup
 * This is used to temporarily fix middleware import errors while we set up the project
 */

// Temporary auth functions (always pass through)
const tempAuth = (req, res, next) => {
  console.log('⚠️ Using temporary auth middleware - no actual authentication');
  next();
};

// Temporary validation functions (always pass through)
const tempValidation = (req, res, next) => {
  next();
};

// Temporary async wrapper
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Export all common middleware that routes expect
module.exports = {
  // Auth
  adminAuth: tempAuth,
  optionalAuth: tempAuth,
  requireAuth: tempAuth,
  
  // Validation
  validateCreateSeason: tempValidation,
  validateUpdateSeason: tempValidation,
  validateCreateEpisode: tempValidation,
  validateUpdateEpisode: tempValidation,
  validateAddSubtitle: tempValidation,
  validateProcessingStatus: tempValidation,
  validateMongoId: tempValidation,
  validateSeriesId: tempValidation,
  validateSeasonId: tempValidation,
  validatePagination: tempValidation,
  validateSearch: tempValidation,
  validateRequest: tempValidation,
  validateAdminLogin: tempValidation,
  validateAdminRegister: tempValidation,
  
  // Upload middleware (temporary)
  uploadEpisode: tempValidation,
  uploadSubtitle: tempValidation,
  handleUploadError: tempValidation,
  
  // Utils
  catchAsync
};
