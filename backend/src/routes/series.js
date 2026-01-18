const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/series.controller');
const { adminAuth } = require('../middleware/auth');
const { uploadSingleImage, handleUploadError } = require('../middleware/upload');

// Public routes - no authentication required
router.get('/', seriesController.getSeries);
router.get('/search', seriesController.searchSeriesPublic);
router.get('/:slug', seriesController.getSeriesBySlug);

// Admin routes - authentication required
router.post('/', adminAuth, uploadSingleImage, handleUploadError, seriesController.createSeries);
router.put('/:id', adminAuth, seriesController.updateSeries);
router.delete('/:id', adminAuth, seriesController.deleteSeries);

module.exports = router;
