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

// TODO: Import middleware
// const { adminAuth } = require('../middleware/auth');

/**
 * ===== PUBLIC ROUTES (Anonymous access) =====
 */

// Get season by ID với episodes
// GET /api/seasons/507f1f77bcf86cd799439011?includeProcessing=false
router.get('/:id', getSeasonById);

// Search seasons
// GET /api/seasons/search?q=season&limit=20
router.get('/search', searchSeasons);

// Get recent seasons
// GET /api/seasons/recent?limit=10
router.get('/recent', getRecentSeasons);

// Get seasons by series ID
// GET /api/series/507f1f77bcf86cd799439011/seasons?includeEpisodes=true
router.get('/series/:seriesId', getSeasonsBySeries);

// Get seasons by type trong series
// GET /api/series/507f1f77bcf86cd799439011/seasons/type/movie
router.get('/series/:seriesId/type/:seasonType', getSeasonsByType);

// Get season by series ID và season number
// GET /api/series/507f1f77bcf86cd799439011/seasons/number/1
router.get('/series/:seriesId/number/:seasonNumber', getSeasonByNumber);

// Get all movies của series (shortcut cho movie type)
// GET /api/series/507f1f77bcf86cd799439011/movies
router.get('/series/:seriesId/movies', getMoviesBySeries);

/**
 * ===== ADMIN ROUTES (Authentication required) =====
 */

// Create new season (Admin only)
// POST /api/admin/seasons
router.post('/admin', createSeason); // TODO: Add adminAuth middleware

// Update season (Admin only)
// PUT /api/admin/seasons/507f1f77bcf86cd799439011
router.put('/admin/:id', updateSeason); // TODO: Add adminAuth middleware

// Delete season (Admin only)
// DELETE /api/admin/seasons/507f1f77bcf86cd799439011
router.delete('/admin/:id', deleteSeason); // TODO: Add adminAuth middleware

// Update episode count for season (Internal/Admin use)
// PUT /api/admin/seasons/507f1f77bcf86cd799439011/episode-count
router.put('/admin/:id/episode-count', updateEpisodeCount); // TODO: Add adminAuth middleware

// Get season statistics (Admin only)
// GET /api/admin/seasons/stats
router.get('/admin/stats', getSeasonStats); // TODO: Add adminAuth middleware

// Get suggested next season number và title
// GET /api/admin/series/507f1f77bcf86cd799439011/seasons/next-number?type=tv
router.get('/admin/series/:seriesId/next-number', getNextSeasonNumber); // TODO: Add adminAuth middleware

module.exports = router;