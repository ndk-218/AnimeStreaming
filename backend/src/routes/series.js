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

// TODO: Import middleware (sẽ tạo sau)
// const { adminAuth } = require('../middleware/auth');
// const { upload } = require('../middleware/upload');

/**
 * ===== PUBLIC ROUTES (Anonymous access) =====
 */

// Get series list với filtering và pagination
// GET /api/series?search=term&genres=Action,Drama&status=ongoing&page=1&limit=20
router.get('/', getSeriesList);

// Search series
// GET /api/series/search?q=jujutsu&limit=10
router.get('/search', searchSeries);

// Search suggestions cho autocomplete
// GET /api/series/suggestions?q=ju&limit=5
router.get('/suggestions', getSearchSuggestions);

// Get trending series
// GET /api/series/trending?limit=10
router.get('/trending', getTrendingSeries);

// Get latest series
// GET /api/series/latest?limit=10
router.get('/latest', getLatestSeries);

// Get all available genres
// GET /api/genres
router.get('/genres', getAllGenres);

// Get all available studios
// GET /api/studios  
router.get('/studios', getAllStudios);

// Get series by genre
// GET /api/series/genre/Action?limit=20
router.get('/genre/:genre', getSeriesByGenre);

// Get series by slug (for SEO-friendly URLs)
// GET /api/series/slug/jujutsu-kaisen
router.get('/slug/:slug', getSeriesBySlug);

// Get series by ID với full details
// GET /api/series/507f1f77bcf86cd799439011
router.get('/:id', getSeriesById);

/**
 * ===== ADMIN ROUTES (Authentication required) =====
 */

// Create new series (Admin only)
// POST /api/admin/series
router.post('/admin', createSeries); // TODO: Add adminAuth middleware

// Update series (Admin only)  
// PUT /api/admin/series/507f1f77bcf86cd799439011
router.put('/admin/:id', updateSeries); // TODO: Add adminAuth middleware

// Delete series (Admin only)
// DELETE /api/admin/series/507f1f77bcf86cd799439011
router.delete('/admin/:id', deleteSeries); // TODO: Add adminAuth middleware

// Get series statistics (Admin only)
// GET /api/admin/series/stats
router.get('/admin/stats', getSeriesStats); // TODO: Add adminAuth middleware

module.exports = router;