const express = require('express');
const router = express.Router();

// Import route modules
const seriesRoutes = require('./series');
const seasonsRoutes = require('./seasons');
const episodesRoutes = require('./episodes');
const adminRoutes = require('./admin');
const contentRoutes = require('./content'); // New content management routes

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

// Public routes
router.use('/series', seriesRoutes);
router.use('/seasons', seasonsRoutes);
router.use('/episodes', episodesRoutes);

// Admin routes (protected)
router.use('/admin', adminRoutes);

// Content management routes (studios & genres)
router.use('/admin', contentRoutes);

module.exports = router;
