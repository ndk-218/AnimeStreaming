// @ts-nocheck
const favoritesService = require('../services/user.favorites.service');

/**
 * ===== USER FAVORITES CONTROLLER =====
 * Handle HTTP requests for user favorites operations
 */

/**
 * POST /api/user/favorites/:seriesId
 * Add series to favorites
 */
const addFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { seriesId } = req.params;

    if (!seriesId) {
      return res.status(400).json({
        success: false,
        error: 'Series ID is required'
      });
    }

    const result = await favoritesService.addFavorite(userId, seriesId);

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ [FavoritesController] addFavorite error:', error.message);
    
    const statusCode = error.message.includes('already in favorites') ? 409 : 400;
    
    return res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * DELETE /api/user/favorites/:seriesId
 * Remove series from favorites
 */
const removeFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { seriesId } = req.params;

    if (!seriesId) {
      return res.status(400).json({
        success: false,
        error: 'Series ID is required'
      });
    }

    const result = await favoritesService.removeFavorite(userId, seriesId);

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ [FavoritesController] removeFavorite error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/user/favorites
 * Get user's favorite series list
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const favorites = await favoritesService.getFavorites(userId);

    return res.status(200).json({
      success: true,
      data: favorites
    });

  } catch (error) {
    console.error('❌ [FavoritesController] getFavorites error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/user/favorites/check/:seriesId
 * Check if series is in favorites
 */
const checkFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { seriesId } = req.params;

    if (!seriesId) {
      return res.status(400).json({
        success: false,
        error: 'Series ID is required'
      });
    }

    const result = await favoritesService.isFavorite(userId, seriesId);

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ [FavoritesController] checkFavorite error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite
};
