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
// PUBLIC ROUTES (Anonymous Access)
// ============================================
// Series: GET /api/series, GET /api/series/:slug
// Seasons: GET /api/seasons, GET /api/seasons/:seasonId/episodes  
// Episodes: GET /api/episodes, GET /api/episodes/:episodeId/playback
router.use('/series', seriesRoutes);
router.use('/seasons', seasonsRoutes);
router.use('/episodes', episodesRoutes);

// ============================================
// ADMIN ROUTES (Protected)
// ============================================
router.use('/admin', adminRoutes);
router.use('/admin', contentRoutes);

module.exports = router;