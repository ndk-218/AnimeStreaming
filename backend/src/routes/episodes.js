// @ts-nocheck
const express = require('express');
const router = express.Router();

// Import controllers
const {
  createEpisode,
  getEpisodeById,
  getEpisodesBySeason,
  streamEpisode,
  incrementView,
  updateEpisode,
  replaceEpisodeVideo, 
  deleteEpisode,
  addSubtitle,
  searchEpisodes,
  getPopularEpisodes,
  getRecentEpisodes,
  getTrendingEpisodes,
  getEpisodeStats,
  updateProcessingStatus
} = require('../controllers/episodes.controller');

const {
  getProcessingStatus,
  getAllProcessingJobs,
  cancelProcessing
} = require('../controllers/processing.controller');

// ✅ THÊM: Import playback controller
const playbackController = require('../controllers/playback.controller');

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
 * ===== ADMIN ROUTES (Authentication required) =====
 * ⚠️ CRITICAL: Admin routes MUST be defined BEFORE public routes
 * to prevent Express from matching "/admin/xxx" with "/:id" pattern
 */

// Get episode statistics (Admin only)
// GET /api/episodes/admin/stats
router.get('/admin/stats', 
  adminAuth,
  catchAsync(getEpisodeStats)
);

// Get all processing jobs (Admin only)
// GET /api/episodes/admin/processing/jobs
router.get('/admin/processing/jobs', 
  adminAuth,
  catchAsync(getAllProcessingJobs)
);

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

// Get processing status for specific episode (Admin only)
// GET /api/episodes/admin/507f1f77bcf86cd799439011/processing-status
router.get('/admin/:id/processing-status', 
  adminAuth,
  validateMongoId,
  catchAsync(getProcessingStatus)
);

// Cancel processing for episode (Admin only)
// POST /api/episodes/admin/507f1f77bcf86cd799439011/cancel-processing
router.post('/admin/:id/cancel-processing',
  adminAuth,
  validateMongoId,
  catchAsync(cancelProcessing)
);

// Update processing status (Internal use by video processing service)
// PUT /api/episodes/admin/507f1f77bcf86cd799439011/processing
// Body: { processingStatus, hlsPath, qualities, duration, thumbnail, subtitles }
router.put('/admin/:id/processing', 
  adminAuth,
  validateProcessingStatus,
  catchAsync(updateProcessingStatus)
);

// Update episode metadata OR replace video/subtitle (Admin only)
// PUT /api/episodes/admin/507f1f77bcf86cd799439011
// Supports:
// - Metadata update: { title, description, episodeNumber }
// - Video replacement: multipart with videoFile
// - Subtitle update: multipart with subtitleFiles
router.put('/admin/:id', 
  adminAuth,
  uploadEpisode, // Handle file uploads if present
  handleUploadError,
  validateMongoId,
  catchAsync(replaceEpisodeVideo) // This handles both cases
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

/**
 * ===== PUBLIC ROUTES (Anonymous access) =====
 * These routes MUST come AFTER admin routes to prevent conflicts
 */

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

// Get recent episodes
// GET /api/episodes/recent?limit=12
router.get('/recent', 
  optionalAuth,
  validatePagination,
  catchAsync(getRecentEpisodes)
);

// Get trending episodes (last 10 days + most views)
// GET /api/episodes/trending?limit=12
router.get('/trending', 
  optionalAuth,
  validatePagination,
  catchAsync(getTrendingEpisodes)
);

// Get episodes by season
// GET /api/episodes/season/507f1f77bcf86cd799439011?playable=true
router.get('/season/:seasonId', 
  optionalAuth,
  validateSeasonId,
  catchAsync(getEpisodesBySeason)
);

// ✅ Playback endpoint with quality filtering
// GET /api/episodes/507f1f77bcf86cd799439011/playback
// Returns: HLS path, qualities (filtered by login status), episode metadata
// Anonymous users: 480p, 720p only
// Logged in users: All qualities (480p, 720p, 1080p, Upscaled)
router.get('/:episodeId/playback', 
  require('../middleware/userAuth').optionalUserAuth,
  catchAsync(playbackController.getPlaybackInfo)
);

// ✅ NEW: Increment view count (debounced from frontend)
// POST /api/episodes/507f1f77bcf86cd799439011/view
router.post('/:id/view',
  optionalAuth,
  validateMongoId,
  catchAsync(incrementView)
);

// Stream episode (with view count increment)
// GET /api/episodes/507f1f77bcf86cd799439011/stream
router.get('/:id/stream', 
  optionalAuth,
  validateMongoId,
  catchAsync(streamEpisode)
);

// Get episode by ID
// GET /api/episodes/507f1f77bcf86cd799439011
// ⚠️ This MUST be the LAST route because it's a catch-all pattern
router.get('/:id', 
  optionalAuth,
  validateMongoId,
  catchAsync(getEpisodeById)
);

module.exports = router;
