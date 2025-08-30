const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/series.controller');
const { adminAuth } = require('../middleware/auth');

// Public routes - no authentication required
router.get('/', seriesController.getSeries);
router.get('/:slug', seriesController.getSeriesBySlug);

// Admin routes - authentication required
router.post('/', adminAuth, seriesController.createSeries);
router.put('/:id', adminAuth, seriesController.updateSeries);
router.delete('/:id', adminAuth, seriesController.deleteSeries);

// Admin utility routes
router.get('/admin/recent', adminAuth, seriesController.getRecentSeries);

module.exports = router;
