// backend/src/services/playbackService.js
// SERVICE: Logic lấy thông tin episode để playback

const Episode = require('../models/Episode');
const Season = require('../models/Season');
const Series = require('../models/Series');

class PlaybackService {
  /**
   * Lấy thông tin episode để playback (HLS path, qualities, metadata)
   * @param {string} episodeId - MongoDB ObjectId của episode
   * @returns {Promise<Object>} - Episode playback data
   */
  async getEpisodePlaybackInfo(episodeId) {
    try {
      // 1. Tìm episode và populate series + season info
      const episode = await Episode.findById(episodeId)
        .populate('seriesId', 'title originalTitle slug')
        .populate('seasonId', 'title seasonNumber seasonType');

      if (!episode) {
        throw new Error('Episode not found');
      }

      // 2. Kiểm tra processing status
      if (episode.processingStatus !== 'completed') {
        throw new Error(`Episode is still processing. Status: ${episode.processingStatus}`);
      }

      // 3. Kiểm tra HLS files có tồn tại không
      if (!episode.hlsPath) {
        throw new Error('HLS files not available for this episode');
      }

      // 4. Tăng view count (async, không cần await)
      this.incrementViewCount(episodeId);

      // 5. Format response data
      const playbackData = {
        episode: {
          id: episode._id,
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          description: episode.description,
          duration: episode.duration,
          thumbnail: episode.thumbnail,
          viewCount: episode.viewCount
        },
        series: {
          id: episode.seriesId._id,
          title: episode.seriesId.title,
          originalTitle: episode.seriesId.originalTitle,
          slug: episode.seriesId.slug
        },
        season: {
          id: episode.seasonId._id,
          title: episode.seasonId.title,
          seasonNumber: episode.seasonId.seasonNumber,
          seasonType: episode.seasonId.seasonType
        },
        video: {
        hlsPath: episode.hlsPath.replace(/\\/g, '/'), // ✅ Convert \ to /
        qualities: episode.qualities.map(q => ({
          quality: q.quality,
          file: q.file.replace(/\\/g, '/') // ✅ Convert \ to /
        }))
        },
        subtitles: episode.subtitles.map(sub => ({
          language: sub.language,
          label: sub.label,
          file: sub.file,
          type: sub.type
        }))
      };

      return playbackData;

    } catch (error) {
      console.error('PlaybackService.getEpisodePlaybackInfo error:', error);
      throw error;
    }
  }

  /**
   * Tăng view count của episode (fire-and-forget)
   * @param {string} episodeId 
   */
  async incrementViewCount(episodeId) {
    try {
      await Episode.findByIdAndUpdate(
        episodeId,
        { $inc: { viewCount: 1 } },
        { new: false } // Không cần return document
      );
    } catch (error) {
      console.error('Failed to increment view count:', error);
      // Không throw error vì đây là non-critical operation
    }
  }

  /**
   * Lấy danh sách episodes của cùng season (để next/previous)
   * @param {string} seasonId 
   * @returns {Promise<Array>} - List of episodes
   */
  async getSeasonEpisodes(seasonId) {
    try {
      const episodes = await Episode.find({
        seasonId,
        processingStatus: 'completed'
      })
        .select('episodeNumber title thumbnail duration')
        .sort({ episodeNumber: 1 });

      return episodes;
    } catch (error) {
      console.error('PlaybackService.getSeasonEpisodes error:', error);
      throw error;
    }
  }
}

module.exports = new PlaybackService();