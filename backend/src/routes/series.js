// @ts-nocheck
const express = require('express');
const router = express.Router();

// Import controllers
const {
  createSeries,
  getSeriesById,
  getSeriesBySlug,
  getSeriesList,
  updateSeries,
  deleteSeries,
  getTrendingSeries,
  getLatestSeries,
  getSeriesByGenre,
  getAllGenres,
  getAllStudios,
  searchSeries,
  getSearchSuggestions,
  getSeriesStats
} = require('../controllers/series.controller');

// Import middleware
const {
  adminAuth,
  optionalAuth,
  validateCreateSeries,
  validateUpdateSeries,
  validateGenre,
  validateSlug,
  validateMongoId,
  validatePagination,
  validateSearch,
  validateSeriesFilters,
  catchAsync
} = require('../middleware');

/**
 * ===== PUBLIC ROUTES (Anonymous access) =====
 */

// Get series list với filtering và pagination
// GET /api/series?search=term&genres=Action,Drama&status=ongoing&page=1&limit=20
router.get('/', 
  optionalAuth,
  validateSeriesFilters,
  catchAsync(getSeriesList)
);

// Search series
// GET /api/series/search?q=jujutsu&limit=10
router.get('/search', 
  optionalAuth,
  validateSearch,
  catchAsync(searchSeries)
);

// Search suggestions cho autocomplete
// GET /api/series/suggestions?q=ju&limit=5
router.get('/suggestions', 
  optionalAuth,
  validateSearch,
  catchAsync(getSearchSuggestions)
);

// Get trending series
// GET /api/series/trending?limit=10
router.get('/trending', 
  optionalAuth,
  validatePagination,
  catchAsync(getTrendingSeries)
);

// Get latest series
// GET /api/series/latest?limit=10
router.get('/latest', 
  optionalAuth,
  validatePagination,
  catchAsync(getLatestSeries)
);

// Get all available genres
// GET /api/series/genres
router.get('/genres', 
  optionalAuth,
  catchAsync(getAllGenres)
);

// Get all available studios  
// GET /api/series/studios
router.get('/studios', 
  optionalAuth,
  catchAsync(getAllStudios)
);

// Get series by genre
// GET /api/series/genre/Action?limit=20
router.get('/genre/:genre', 
  optionalAuth,
  validateGenre,
  validatePagination,
  catchAsync(getSeriesByGenre)
);

// Get series by slug (for SEO-friendly URLs)
// GET /api/series/slug/jujutsu-kaisen
router.get('/slug/:slug', 
  optionalAuth,
  validateSlug,
  catchAsync(getSeriesBySlug)
);

// Get series by ID với full details
// GET /api/series/507f1f77bcf86cd799439011
router.get('/:id', 
  optionalAuth,
  validateMongoId,
  catchAsync(getSeriesById)
);

/**
 * ===== ADMIN ROUTES (Authentication required) =====
 */

// Create new series (Admin only)
// POST /api/series/admin
router.post('/admin', 
  adminAuth,
  validateCreateSeries,
  catchAsync(createSeries)
);

// Update series (Admin only)  
// PUT /api/series/admin/507f1f77bcf86cd799439011
router.put('/admin/:id', 
  adminAuth,
  validateUpdateSeries,
  catchAsync(updateSeries)
);

// Delete series (Admin only)
// DELETE /api/series/admin/507f1f77bcf86cd799439011
router.delete('/admin/:id', 
  adminAuth,
  validateMongoId,
  catchAsync(deleteSeries)
);

// Get series statistics (Admin only)
// GET /api/series/admin/stats
router.get('/admin/stats', 
  adminAuth,
  catchAsync(getSeriesStats)
);

module.exports = router;