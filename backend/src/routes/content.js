const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const { adminAuth } = require('../middleware/auth');

// All content management routes require authentication
router.use(adminAuth);

// ========== STUDIO ROUTES ==========
router.get('/studios/search', contentController.searchStudios);
router.get('/studios/:id', contentController.getStudioById);
router.get('/studios', contentController.getStudios);
router.post('/studios', contentController.createStudio);

// ========== GENRE ROUTES ==========
router.get('/genres/search', contentController.searchGenres);
router.get('/genres/:id', contentController.getGenreById);
router.get('/genres', contentController.getGenres);
router.post('/genres', contentController.createGenre);

module.exports = router;
