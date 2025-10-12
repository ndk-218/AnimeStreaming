// backend/src/controllers/playbackController.js
// CONTROLLER: Xử lý HTTP requests cho playback

const playbackService = require('../services/playback.service');

class PlaybackController {
  /**
   * GET /api/episodes/:episodeId/playback
   * Lấy thông tin episode để playback
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

      // Lấy playback info từ service
      const playbackData = await playbackService.getEpisodePlaybackInfo(episodeId);

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
   * GET /api/seasons/:seasonId/episodes
   * Lấy danh sách episodes của season (cho next/previous navigation)
   */
  async getSeasonEpisodes(req, res) {
    try {
      const { seasonId } = req.params;

      // Validate seasonId format
      if (!seasonId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid season ID format'
        });
      }

      const episodes = await playbackService.getSeasonEpisodes(seasonId);

      return res.status(200).json({
        success: true,
        data: episodes
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