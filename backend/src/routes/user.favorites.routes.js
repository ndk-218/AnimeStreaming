// @ts-nocheck
const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/user.favorites.controller');
const { userAuth } = require('../middleware/userAuth');

/**
 * ===== USER FAVORITES ROUTES =====
 * All routes require authentication
 */

/**
 * GET /api/user/favorites
 * Get user's favorite series list
 */
router.get('/', userAuth, favoritesController.getFavorites);

/**
 * GET /api/user/favorites/check/:seriesId
 * Check if series is in favorites
 */
router.get('/check/:seriesId', userAuth, favoritesController.checkFavorite);

/**
 * POST /api/user/favorites/:seriesId
 * Add series to favorites
 */
router.post('/:seriesId', userAuth, favoritesController.addFavorite);

/**
 * DELETE /api/user/favorites/:seriesId
 * Remove series from favorites
 */
router.delete('/:seriesId', userAuth, favoritesController.removeFavorite);

module.exports = router;
