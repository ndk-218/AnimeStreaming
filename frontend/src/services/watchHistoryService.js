import api from './api';

/**
 * ===== WATCH HISTORY SERVICE =====
 * Handle watch history and progress tracking
 */

/**
 * Update watch progress for an episode
 * @param {String} episodeId - Episode ID
 * @param {Number} watchedDuration - Watched duration in seconds
 */
export const updateWatchProgress = async (episodeId, watchedDuration) => {
  try {
    const response = await api.post('/user/watch-history/update', {
      episodeId,
      watchedDuration
    });
    return response.data;
  } catch (error) {
    console.error('❌ Update watch progress error:', error);
    throw error;
  }
};

/**
 * Get user's complete watch history
 */
export const getWatchHistory = async () => {
  try {
    const response = await api.get('/user/watch-history');
    return response.data;
  } catch (error) {
    console.error('❌ Get watch history error:', error);
    throw error;
  }
};

/**
 * Get resume information for a specific series
 * @param {String} seriesId - Series ID
 */
export const getResumeInfo = async (seriesId) => {
  try {
    const response = await api.get(`/user/watch-history/resume/${seriesId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get resume info error:', error);
    throw error;
  }
};

export default {
  updateWatchProgress,
  getWatchHistory,
  getResumeInfo
};
