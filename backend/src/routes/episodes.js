// @ts-nocheck
const express = require('express');
const router = express.Router();

// Import controllers
const {
  createEpisode,
  getEpisodeById,
  getEpisodesBySeason,
  streamEpisode,
  updateEpisode,
  deleteEpisode,
  addSubtitle,
  searchEpisodes,
  getPopularEpisodes,
  getEpisodeStats,
  updateProcessingStatus
} = require('../controllers/episodes.controller');

// Import middleware
const {
  adminAuth,
  optionalAuth,
  uploadEpisode,
  uploadSubtitle,
  handleUploadError,
  validateCreateEpisode,
  validateUpdateEpisode,
  validateAddSubtitle,
  validateProcessingStatus,
  validateMongoId,
  validateSeasonId,
  validatePagination,
  validateSearch,
  catchAsync
} = require('../middleware');

/**
 * ===== PUBLIC ROUTES (Anonymous access) =====
 */

// Get episode by ID
// GET /api/episodes/507f1f77bcf86cd799439011
router.get('/:id', 
  optionalAuth,
  validateMongoId,
  catchAsync(getEpisodeById)
);

// Stream episode (with view count increment)
// GET /api/episodes/507f1f77bcf86cd799439011/stream
router.get('/:id/stream', 
  optionalAuth,
  validateMongoId,
  catchAsync(streamEpisode)
);

// Get episodes by season
// GET /api/episodes/season/507f1f77bcf86cd799439011?playable=true
router.get('/season/:seasonId', 
  optionalAuth,
  validateSeasonId,
  catchAsync(getEpisodesBySeason)
);

// Search episodes
// GET /api/episodes/search?q=episode&limit=20
router.get('/search', 
  optionalAuth,
  validateSearch,
  catchAsync(searchEpisodes)
);

// Get popular episodes
// GET /api/episodes/popular?limit=10
router.get('/popular', 
  optionalAuth,
  validatePagination,
  catchAsync(getPopularEpisodes)
);

/**
 * ===== ADMIN ROUTES (Authentication required) =====
 */

// Upload new episode với video file (Admin only)
// POST /api/episodes/admin (multipart/form-data)
// Body: { seriesId, seasonId, episodeNumber, title, description, videoFile, subtitleFiles }
router.post('/admin', 
  adminAuth,
  uploadEpisode,
  handleUploadError,
  validateCreateEpisode,
  catchAsync(createEpisode)
);

// Update episode metadata (Admin only)
// PUT /api/episodes/admin/507f1f77bcf86cd799439011
router.put('/admin/:id', 
  adminAuth,
  validateUpdateEpisode,
  catchAsync(updateEpisode)
);

// Delete episode (Admin only)
// DELETE /api/episodes/admin/507f1f77bcf86cd799439011
router.delete('/admin/:id', 
  adminAuth,
  validateMongoId,
  catchAsync(deleteEpisode)
);

// Add subtitle to episode (Admin only)
// POST /api/episodes/admin/507f1f77bcf86cd799439011/subtitles (multipart/form-data)
// Body: { language, label, subtitleFile }
router.post('/admin/:id/subtitles', 
  adminAuth,
  uploadSubtitle,
  handleUploadError,
  validateAddSubtitle,
  catchAsync(addSubtitle)
);

// Update processing status (Internal use by video processing service)
// PUT /api/episodes/admin/507f1f77bcf86cd799439011/processing
// Body: { processingStatus, hlsPath, qualities, duration, thumbnail, subtitles }
router.put('/admin/:id/processing', 
  adminAuth,
  validateProcessingStatus,
  catchAsync(updateProcessingStatus)
);

// Get episode statistics (Admin only)
// GET /api/episodes/admin/stats
router.get('/admin/stats', 
  adminAuth,
  catchAsync(getEpisodeStats)
);

module.exports = router;