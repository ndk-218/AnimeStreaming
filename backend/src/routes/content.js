const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const seasonsController = require('../controllers/seasons.controller');
const { adminAuth } = require('../middleware/auth');

// ========== PUBLIC ROUTES (Anonymous Access) ==========
// Trending & Top Content - homepage features
router.get('/trending-genres', contentController.getTrendingGenres);
router.get('/top-genres', contentController.getTopGenres);
router.get('/top-seasons', seasonsController.getTopSeasons);

// Genres - public access for browsing
router.get('/genres/search', contentController.searchGenres);
router.get('/genres/:id', contentController.getGenreById);
router.get('/genres', contentController.getGenres);

// Studios - public access for browsing
router.get('/studios/search', contentController.searchStudios);
router.get('/studios/:id', contentController.getStudioById);
router.get('/studios', contentController.getStudios);

// ========== ADMIN ROUTES (Protected) ==========
// Create/Edit operations require authentication
router.post('/studios', adminAuth, contentController.createStudio);
router.post('/genres', adminAuth, contentController.createGenre);

module.exports = router;
