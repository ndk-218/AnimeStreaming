// backend/src/controllers/playbackController.js
// CONTROLLER: Xử lý HTTP requests cho playback

const playbackService = require('../services/playback.service');

class PlaybackController {
  /**
   * GET /api/episodes/:episodeId/playback
   * Lấy thông tin episode để playback
   * Optional authentication - qualities filtered based on login status
   */
  async getPlaybackInfo(req, res) {
    try {
      const { episodeId } = req.params;

      // Validate episodeId format
      if (!episodeId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid episode ID format'
        });
      }

      // Get user from optionalUserAuth middleware (can be undefined)
      const user = req.user || null;

      // Lấy playback info từ service với user info
      const playbackData = await playbackService.getEpisodePlaybackInfo(episodeId, user);

      return res.status(200).json({
        success: true,
        data: playbackData
      });

    } catch (error) {
      console.error('PlaybackController.getPlaybackInfo error:', error);

      // Handle specific errors
      if (error.message === 'Episode not found') {
        return res.status(404).json({
          success: false,
          error: 'Episode not found'
        });
      }

      if (error.message.includes('processing')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      // Generic error
      return res.status(500).json({
        success: false,
        error: 'Failed to get playback information'
      });
    }
  }

  /**
   * GET /api/seasons/:seasonId/episodes?batch=1&limit=24
   * Lấy danh sách episodes của season với batch pagination
   */
  async getSeasonEpisodes(req, res) {
    try {
      const { seasonId } = req.params;
      const batch = parseInt(req.query.batch) || 1;
      const limit = parseInt(req.query.limit) || 24;

      // Validate seasonId format
      if (!seasonId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid season ID format'
        });
      }

      const result = await playbackService.getSeasonEpisodes(seasonId, batch, limit);

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('PlaybackController.getSeasonEpisodes error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get season episodes'
      });
    }
  }
}

module.exports = new PlaybackController();