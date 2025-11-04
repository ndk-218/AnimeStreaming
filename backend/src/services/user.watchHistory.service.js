// @ts-nocheck
const User = require('../models/User');
const Episode = require('../models/Episode');
const Season = require('../models/Season');
const Series = require('../models/Series');

/**
 * ===== USER WATCH HISTORY SERVICE =====
 * Business logic for managing user's watch history and progress
 */

/**
 * Update watch progress for an episode
 * @param {String} userId - User ID
 * @param {String} episodeId - Episode ID
 * @param {Number} watchedDuration - Watched duration in seconds
 */
const updateWatchProgress = async (userId, episodeId, watchedDuration) => {
  try {
    // Find user and episode
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const episode = await Episode.findById(episodeId);
    if (!episode) {
      throw new Error('Episode not found');
    }

    // Update watch history (chỉ lưu episode có number lớn nhất mỗi series)
    await user.updateWatchHistory(
      episode.seriesId,
      episode.seasonId,
      episode._id,
      episode.episodeNumber,
      watchedDuration
    );

    console.log(`✅ Updated watch progress: User ${user.email} watched Episode ${episode.episodeNumber} at ${watchedDuration}s`);

    return {
      success: true,
      message: 'Watch progress updated successfully'
    };

  } catch (error) {
    console.error('❌ Update watch progress error:', error.message);
    throw error;
  }
};

/**
 * Get user's complete watch history with populated data
 * @param {String} userId - User ID
 */
const getWatchHistory = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Manually populate watch history
    const populatedHistory = await Promise.all(
      user.watchHistory.map(async (item) => {
        const series = await Series.findById(item.seriesId)
          .select('title originalTitle slug')
          .lean();
        
        const season = await Season.findById(item.seasonId)
          .select('title seasonNumber seasonType posterImage')
          .lean();
        
        const episode = await Episode.findById(item.episodeId)
          .select('episodeNumber title duration thumbnail')
          .lean();

        return {
          seriesId: item.seriesId,
          seasonId: item.seasonId,
          episodeId: item.episodeId,
          episodeNumber: item.episodeNumber,
          watchedDuration: item.watchedDuration,
          series,
          season,
          episode
        };
      })
    );

    // Filter out null values (deleted content)
    const validHistory = populatedHistory.filter(
      item => item.series && item.season && item.episode
    );

    console.log(`✅ Retrieved ${validHistory.length} watch history items for user ${user.email}`);

    return validHistory;

  } catch (error) {
    console.error('❌ Get watch history error:', error.message);
    throw error;
  }
};

/**
 * Get resume information for a specific series
 * @param {String} userId - User ID
 * @param {String} seriesId - Series ID
 */
const getResumeInfo = async (userId, seriesId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Find watch history for this series
    const historyItem = user.watchHistory.find(
      h => h.seriesId.toString() === seriesId.toString()
    );

    if (!historyItem) {
      return null; // No watch history for this series
    }

    // Populate data
    const series = await Series.findById(historyItem.seriesId)
      .select('title originalTitle slug')
      .lean();
    
    const season = await Season.findById(historyItem.seasonId)
      .select('title seasonNumber seasonType')
      .lean();
    
    const episode = await Episode.findById(historyItem.episodeId)
      .select('episodeNumber title duration')
      .lean();

    if (!series || !season || !episode) {
      return null; // Content deleted
    }

    console.log(`✅ Retrieved resume info for series ${series.title}, episode ${episode.episodeNumber}`);

    return {
      episodeId: historyItem.episodeId,
      episodeNumber: historyItem.episodeNumber,
      watchedDuration: historyItem.watchedDuration,
      series,
      season,
      episode
    };

  } catch (error) {
    console.error('❌ Get resume info error:', error.message);
    throw error;
  }
};

module.exports = {
  updateWatchProgress,
  getWatchHistory,
  getResumeInfo
};
