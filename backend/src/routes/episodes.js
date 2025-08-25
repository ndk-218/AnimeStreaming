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

// TODO: Import middleware
// const { adminAuth } = require('../middleware/auth');
// const { uploadVideo, uploadSubtitle } = require('../middleware/upload');

/**
 * ===== PUBLIC ROUTES (Anonymous access) =====
 */

// Get episode by ID
// GET /api/episodes/507f1f77bcf86cd799439011
router.get('/:id', getEpisodeById);

// Stream episode (with view count increment)
// GET /api/episodes/507f1f77bcf86cd799439011/stream
router.get('/:id/stream', streamEpisode);

// Get episodes by season
// GET /api/seasons/507f1f77bcf86cd799439011/episodes?playable=true
router.get('/season/:seasonId', getEpisodesBySeason);

// Search episodes
// GET /api/episodes/search?q=episode&limit=20
router.get('/search', searchEpisodes);

// Get popular episodes
// GET /api/episodes/popular?limit=10
router.get('/popular', getPopularEpisodes);

/**
 * ===== ADMIN ROUTES (Authentication required) =====
 */

// Upload new episode với video file (Admin only)
// POST /api/admin/episodes (multipart/form-data)
// Body: { seriesId, seasonId, episodeNumber, title, description, videoFile }
router.post('/admin', createEpisode); // TODO: Add adminAuth + uploadVideo middleware

// Update episode metadata (Admin only)
// PUT /api/admin/episodes/507f1f77bcf86cd799439011
router.put('/admin/:id', updateEpisode); // TODO: Add adminAuth middleware

// Delete episode (Admin only)
// DELETE /api/admin/episodes/507f1f77bcf86cd799439011
router.delete('/admin/:id', deleteEpisode); // TODO: Add adminAuth middleware

// Add subtitle to episode (Admin only)
// POST /api/admin/episodes/507f1f77bcf86cd799439011/subtitles (multipart/form-data)
// Body: { language, label, subtitleFile }
router.post('/admin/:id/subtitles', addSubtitle); // TODO: Add adminAuth + uploadSubtitle middleware

// Update processing status (Internal use by video processing service)
// PUT /api/admin/episodes/507f1f77bcf86cd799439011/processing
// Body: { processingStatus, hlsPath, qualities, duration, thumbnail, subtitles }
router.put('/admin/:id/processing', updateProcessingStatus); // TODO: Add internal auth

// Get episode statistics (Admin only)
// GET /api/admin/episodes/stats
router.get('/admin/stats', getEpisodeStats); // TODO: Add adminAuth middleware

module.exports = router;