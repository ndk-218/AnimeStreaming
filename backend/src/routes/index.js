const express = require('express');
const router = express.Router();

// Import route modules
const seriesRoutes = require('./series');
const seasonsRoutes = require('./seasons');
const episodesRoutes = require('./episodes');
const adminRoutes = require('./admin');
const contentRoutes = require('./content');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '🎌 Anime Streaming Platform API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    status: 'healthy'
  });
});

// ============================================
// ADMIN ROUTES (Protected)
// ============================================
// CRITICAL: Admin routes MUST be mounted FIRST to prevent
// /api/series from catching /api/admin/series requests
router.use('/admin', adminRoutes);

// ============================================
// PUBLIC ROUTES (Anonymous Access)
// ============================================
// Series: GET /api/series, GET /api/series/:slug
// Seasons: GET /api/seasons, GET /api/seasons/:seasonId/episodes  
// Episodes: GET /api/episodes, GET /api/episodes/:episodeId/playback

// ============================================
// CONTENT ROUTES (Public for browsing)
// ============================================
// Content: GET /api/content/genres, GET /api/content/studios
router.use('/content', contentRoutes);

// Then mount series/seasons/episodes routes AFTER admin routes
router.use('/series', seriesRoutes);
router.use('/seasons', seasonsRoutes);
router.use('/episodes', episodesRoutes);

module.exports = router;