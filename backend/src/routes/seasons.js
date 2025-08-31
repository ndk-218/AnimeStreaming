// @ts-nocheck
const express = require('express');
const router = express.Router();

// Import controllers
const {
  createSeason,
  getSeasonById,
  getSeasonsBySeries,
  updateSeason,
  deleteSeason,
  getSeasonsByType,
  searchSeasons,
  getRecentSeasons,
  getSeasonStats,
  getSeasonByNumber,
  updateEpisodeCount,
  getMoviesBySeries,
  getNextSeasonNumber
} = require('../controllers/seasons.controller');

// Use temporary middleware to fix server startup
const {
  adminAuth,
  optionalAuth,
  validateCreateSeason,
  validateUpdateSeason,
  validateMongoId,
  validateSeriesId,
  validateSeasonId,
  validatePagination,
  validateSearch,
  validateRequest,
  catchAsync
} = require('../middleware/temp-backup');

// Import additional validation from express-validator
const { body, param, query } = require('express-validator');

/**
 * ===== PUBLIC ROUTES (Anonymous access) =====
 */

// Get season by ID với episodes
// GET /api/seasons/507f1f77bcf86cd799439011?includeProcessing=false
router.get('/:id', 
  optionalAuth,
  validateMongoId,
  catchAsync(getSeasonById)
);

// Search seasons
// GET /api/seasons/search?q=season&limit=20
router.get('/search', 
  optionalAuth,
  validateSearch,
  catchAsync(searchSeasons)
);

// Get recent seasons
// GET /api/seasons/recent?limit=10
router.get('/recent', 
  optionalAuth,
  validatePagination,
  catchAsync(getRecentSeasons)
);

// Get seasons by series ID
// GET /api/seasons/series/507f1f77bcf86cd799439011?includeEpisodes=true
router.get('/series/:seriesId', 
  optionalAuth,
  validateSeriesId,
  catchAsync(getSeasonsBySeries)
);

// Get seasons by type trong series
// GET /api/seasons/series/507f1f77bcf86cd799439011/type/movie
router.get('/series/:seriesId/type/:seasonType', 
  optionalAuth,
  validateSeriesId,
  [
    param('seasonType')
      .isIn(['tv', 'movie', 'ova', 'special'])
      .withMessage('Season type must be: tv, movie, ova, or special'),
    validateRequest
  ],
  catchAsync(getSeasonsByType)
);

// Get season by series ID và season number
// GET /api/seasons/series/507f1f77bcf86cd799439011/number/1
router.get('/series/:seriesId/number/:seasonNumber', 
  optionalAuth,
  validateSeriesId,
  [
    param('seasonNumber')
      .isInt({ min: 0 })
      .withMessage('Season number must be a non-negative integer'),
    validateRequest
  ],
  catchAsync(getSeasonByNumber)
);

// Get all movies của series (shortcut cho movie type)
// GET /api/seasons/series/507f1f77bcf86cd799439011/movies
router.get('/series/:seriesId/movies', 
  optionalAuth,
  validateSeriesId,
  catchAsync(getMoviesBySeries)
);

/**
 * ===== ADMIN ROUTES (Authentication required) =====
 */

// Create new season (Admin only)
// POST /api/seasons/admin
router.post('/admin', 
  adminAuth,
  validateCreateSeason,
  catchAsync(createSeason)
);

// Update season (Admin only)
// PUT /api/seasons/admin/507f1f77bcf86cd799439011
router.put('/admin/:id', 
  adminAuth,
  validateUpdateSeason,
  catchAsync(updateSeason)
);

// Delete season (Admin only)
// DELETE /api/seasons/admin/507f1f77bcf86cd799439011
router.delete('/admin/:id', 
  adminAuth,
  validateMongoId,
  catchAsync(deleteSeason)
);

// Update episode count for season (Internal/Admin use)
// PUT /api/seasons/admin/507f1f77bcf86cd799439011/episode-count
router.put('/admin/:id/episode-count', 
  adminAuth,
  validateMongoId,
  catchAsync(updateEpisodeCount)
);

// Get season statistics (Admin only)
// GET /api/seasons/admin/stats
router.get('/admin/stats', 
  adminAuth,
  catchAsync(getSeasonStats)
);

// Get suggested next season number và title
// GET /api/seasons/admin/series/507f1f77bcf86cd799439011/next-number?type=tv
router.get('/admin/series/:seriesId/next-number', 
  adminAuth,
  validateSeriesId,
  [
    query('type')
      .optional()
      .isIn(['tv', 'movie', 'ova', 'special'])
      .withMessage('Type must be: tv, movie, ova, or special'),
    validateRequest
  ],
  catchAsync(getNextSeasonNumber)
);

module.exports = router;