// @ts-nocheck
const User = require('../models/User');
const Series = require('../models/Series');

/**
 * ===== USER FAVORITES SERVICE =====
 * Business logic for managing user's favorite series
 */

/**
 * Add series to favorites
 */
const addFavorite = async (userId, seriesId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if series exists
    const series = await Series.findById(seriesId);
    if (!series) {
      throw new Error('Series not found');
    }

    // Check if already in favorites
    if (user.favorites.includes(seriesId)) {
      throw new Error('Series already in favorites');
    }

    // Add to favorites
    user.favorites.push(seriesId);
    await user.save();

    console.log(`✅ Added to favorites: ${series.title} for user ${user.email}`);

    return {
      success: true,
      message: 'Added to favorites successfully'
    };

  } catch (error) {
    console.error('❌ Add favorite error:', error.message);
    throw error;
  }
};

/**
 * Remove series from favorites
 */
const removeFavorite = async (userId, seriesId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Remove from favorites
    user.favorites = user.favorites.filter(
      id => id.toString() !== seriesId.toString()
    );
    
    await user.save();

    console.log(`✅ Removed from favorites: ${seriesId} for user ${user.email}`);

    return {
      success: true,
      message: 'Removed from favorites successfully'
    };

  } catch (error) {
    console.error('❌ Remove favorite error:', error.message);
    throw error;
  }
};

/**
 * Get user's favorite series list
 */
const getFavorites = async (userId) => {
  try {
    const Season = require('../models/Season');
    
    const user = await User.findById(userId)
      .populate({
        path: 'favorites',
        select: 'title originalTitle slug posterImage releaseYear status genres viewCount'
      });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Filter out null values (deleted series)
    let favorites = user.favorites.filter(series => series !== null);

    // Manually populate latest season for each series
    favorites = await Promise.all(
      favorites.map(async (series) => {
        const seriesObj = series.toObject();
        
        // Find latest season (highest seasonNumber for TV/OVA, or most recent movie)
        const latestSeason = await Season.findOne({ seriesId: series._id })
          .sort({ createdAt: -1 })
          .select('posterImage seasonNumber seasonType releaseYear')
          .lean();
        
        return {
          ...seriesObj,
          latestSeason
        };
      })
    );

    console.log(`✅ Retrieved ${favorites.length} favorites for user ${user.email}`);

    return favorites;

  } catch (error) {
    console.error('❌ Get favorites error:', error.message);
    throw error;
  }
};

/**
 * Check if series is in user's favorites
 */
const isFavorite = async (userId, seriesId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const inFavorites = user.favorites.some(
      id => id.toString() === seriesId.toString()
    );

    return {
      success: true,
      data: { isFavorite: inFavorites }
    };

  } catch (error) {
    console.error('❌ Check favorite error:', error.message);
    throw error;
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
  isFavorite
};
