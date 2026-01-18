// backend/src/services/playbackService.js
// SERVICE: Logic lấy thông tin episode để playback

const Episode = require('../models/Episode');
const Season = require('../models/Season');
const Series = require('../models/Series');

class PlaybackService {
  /**
   * Lấy thông tin episode để playback (HLS path, qualities, metadata)
   * @param {string} episodeId - MongoDB ObjectId của episode
   * @param {Object} user - User object (null if anonymous)
   * @returns {Promise<Object>} - Episode playback data
   */
  async getEpisodePlaybackInfo(episodeId, user = null) {
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

      // ❌ REMOVED: Auto view increment
      // View counting is now handled by frontend after 10 seconds of watching
      // Frontend will call POST /api/episodes/:id/view

      // 4. ALWAYS return all qualities, let frontend handle access control
      // NEW LOGIC:
      // - Anonymous: 480p + 720p (can watch, but prompt login for 1080p)
      // - Registered: 480p + 720p + 1080p (full access)
      const availableQualities = episode.qualities;
      
      const userTier = !user || !user.isEmailVerified ? 'anonymous' : 'registered';
      
      console.log(`👤 User tier: ${userTier} - All qualities sent: ${availableQualities.map(q => q.quality).join(', ')}`);

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
          qualities: availableQualities.map(q => ({
            quality: q.quality,
            file: q.file.replace(/\\/g, '/') // ✅ Convert \ to /
          })),
          subtitles: episode.subtitles.map(sub => ({
            language: sub.language,
            label: sub.label,
            file: sub.file,
            type: sub.type
          }))
        },
        // User info for frontend
        userAccess: {
          tier: userTier, // 'anonymous' | 'registered'
          isLoggedIn: !!(user && user.isEmailVerified)
        }
      };

      console.log(`📺 Playback info loaded for episode: ${episode.title} (ID: ${episodeId})`);
      console.log(`👤 User: ${user ? user.email : 'Anonymous'}`);
      return playbackData;

    } catch (error) {
      console.error('PlaybackService.getEpisodePlaybackInfo error:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách episodes của season với batch pagination
   * @param {string} seasonId - Season ID
   * @param {number} batch - Batch number (default: 1)
   * @param {number} limit - Episodes per batch (default: 24)
   * @returns {Promise<Object>} - Episodes with pagination info
   */
  async getSeasonEpisodes(seasonId, batch = 1, limit = 24) {
    try {
      const skip = (batch - 1) * limit;

      // Get episodes for this batch
      const episodes = await Episode.find({
        seasonId,
        processingStatus: 'completed'
      })
        .select('episodeNumber title thumbnail duration')
        .sort({ episodeNumber: 1 })
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const totalEpisodes = await Episode.countDocuments({
        seasonId,
        processingStatus: 'completed'
      });

      const totalBatches = Math.ceil(totalEpisodes / limit);

      console.log(`📺 PlaybackService: Found ${episodes.length} episodes (Batch ${batch}/${totalBatches})`);

      return {
        episodes,
        pagination: {
          currentBatch: batch,
          totalBatches,
          totalEpisodes,
          episodesPerBatch: limit
        }
      };
    } catch (error) {
      console.error('PlaybackService.getSeasonEpisodes error:', error);
      throw error;
    }
  }
}

module.exports = new PlaybackService();
