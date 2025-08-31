const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/series.controller');
const seasonsController = require('../controllers/seasons.controller');
// const { adminAuth } = require('../middleware/auth'); // Temporarily disabled

/**
 * ===== ADMIN SERIES ROUTES (NO AUTH FOR TESTING) =====
 */
router.post('/series', seriesController.createSeries);
router.put('/series/:id', seriesController.updateSeries);
router.delete('/series/:id', seriesController.deleteSeries);

/**
 * ===== ADMIN SEASONS ROUTES (NO AUTH FOR TESTING) =====
 */
router.post('/seasons', seasonsController.createSeason);
router.put('/seasons/:id', seasonsController.updateSeason);
router.delete('/seasons/:id', seasonsController.deleteSeason);

/**
 * ===== ADMIN DASHBOARD ROUTES =====
 */
router.get('/series/stats', (req, res) => res.json({ success: true, data: { total: 0 } }));
router.get('/seasons/stats', seasonsController.getSeasonStats);

module.exports = router;
