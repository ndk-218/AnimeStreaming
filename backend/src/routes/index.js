// @ts-nocheck
const express = require('express');
const router = express.Router();

// Import all route modules
const seriesRoutes = require('./series');
const seasonsRoutes = require('./seasons');
const episodesRoutes = require('./episodes');
const adminRoutes = require('./admin');

/**
 * ===== API ROUTES SETUP =====
 * Organize routes theo logical grouping
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Anime Streaming API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      series: '/api/series',
      seasons: '/api/seasons', 
      episodes: '/api/episodes',
      admin: '/api/admin'
    }
  });
});

// Mount route modules
router.use('/series', seriesRoutes);
router.use('/seasons', seasonsRoutes);
router.use('/episodes', episodesRoutes);
router.use('/admin', adminRoutes);

// Utility routes cũng có thể access từ root level
router.use('/genres', seriesRoutes); // Redirect to series routes for genres
router.use('/studios', seriesRoutes); // Redirect to series routes for studios

/**
 * ===== ERROR HANDLING =====
 */

// 404 handler cho API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `API route ${req.originalUrl} not found`,
      availableRoutes: [
        'GET /api/health',
        'GET /api/series',
        'GET /api/seasons', 
        'GET /api/episodes',
        'POST /api/admin/auth/login'
      ]
    }
  });
});

module.exports = router;// @ts-nocheck
const express = require('express');
const router = express.Router();

// Import all route modules
const seriesRoutes = require('./series');
const seasonsRoutes = require('./seasons');
const episodesRoutes = require('./episodes');
const adminRoutes = require('./admin');

/**
 * ===== API ROUTES SETUP =====
 * Organize routes theo logical grouping
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Anime Streaming API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      series: '/api/series',
      seasons: '/api/seasons', 
      episodes: '/api/episodes',
      admin: '/api/admin'
    }
  });
});

// Mount route modules
router.use('/series', seriesRoutes);
router.use('/seasons', seasonsRoutes);
router.use('/episodes', episodesRoutes);
router.use('/admin', adminRoutes);

// Utility routes cũng có thể access từ root level
router.use('/genres', seriesRoutes); // Redirect to series routes for genres
router.use('/studios', seriesRoutes); // Redirect to series routes for studios

/**
 * ===== ERROR HANDLING =====
 */

// 404 handler cho API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `API route ${req.originalUrl} not found`,
      availableRoutes: [
        'GET /api/health',
        'GET /api/series',
        'GET /api/seasons', 
        'GET /api/episodes',
        'POST /api/admin/auth/login'
      ]
    }
  });
});

module.exports = router;