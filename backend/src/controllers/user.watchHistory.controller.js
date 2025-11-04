// @ts-nocheck
const watchHistoryService = require('../services/user.watchHistory.service');

/**
 * ===== WATCH HISTORY CONTROLLER =====
 * Handle HTTP requests for user watch history
 */

/**
 * @route   POST /api/user/watch-history/update
 * @desc    Update watch progress for an episode
 * @access  Private
 * @body    { episodeId: String, watchedDuration: Number }
 */
const updateWatchProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { episodeId, watchedDuration } = req.body;

    // Validation
    if (!episodeId) {
      return res.status(400).json({
        success: false,
        error: 'Episode ID is required'
      });
    }

    if (watchedDuration === undefined || watchedDuration < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid watched duration is required'
      });
    }

    const result = await watchHistoryService.updateWatchProgress(
      userId,
      episodeId,
      watchedDuration
    );

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ [WatchHistoryController] updateWatchProgress error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @route   GET /api/user/watch-history
 * @desc    Get user's complete watch history
 * @access  Private
 */
const getWatchHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const history = await watchHistoryService.getWatchHistory(userId);

    return res.status(200).json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('❌ [WatchHistoryController] getWatchHistory error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @route   GET /api/user/watch-history/resume/:seriesId
 * @desc    Get resume information for a specific series
 * @access  Private
 */
const getResumeInfo = async (req, res) => {
  try {
    const userId = req.user._id;
    const { seriesId } = req.params;

    if (!seriesId) {
      return res.status(400).json({
        success: false,
        error: 'Series ID is required'
      });
    }

    const resumeInfo = await watchHistoryService.getResumeInfo(userId, seriesId);

    if (!resumeInfo) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No watch history found for this series'
      });
    }

    return res.status(200).json({
      success: true,
      data: resumeInfo
    });

  } catch (error) {
    console.error('❌ [WatchHistoryController] getResumeInfo error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  updateWatchProgress,
  getWatchHistory,
  getResumeInfo
};
