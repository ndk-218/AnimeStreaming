// @ts-nocheck
const Season = require('../models/Season');
const Episode = require('../models/Episode');
const Series = require('../models/Series');

/**
 * ===== SEASON SERVICE - JAVASCRIPT VERSION =====
 * Quản lý seasons: TV, Movies, OVAs, Specials
 */
class SeasonService {

  /**
   * Tạo season mới trong series
   */
  static async createSeason(data) {
    try {
      // Validate dữ liệu đầu vào
      if (!data.seriesId || !data.title || data.seasonNumber === undefined) {
        throw new Error('Missing required fields: seriesId, title, seasonNumber');
      }

      // Kiểm tra series tồn tại
      const series = await Series.findById(data.seriesId);
      if (!series) {
        throw new Error('Series not found');
      }

      // Kiểm tra season number + type đã tồn tại chưa
      const existingSeason = await Season.findOne({
        seriesId: data.seriesId,
        seasonNumber: data.seasonNumber,
        seasonType: data.seasonType || 'tv'
      });

      if (existingSeason) {
        const typeLabel = data.seasonType || 'tv';
        throw new Error(`${typeLabel.toUpperCase()} ${data.seasonNumber} already exists in this series`);
      }

      // Đối với movies: seasonNumber là year, title format "Movie YYYY"
      if (data.seasonType === 'movie') {
        // Validate year cho movies
        if (data.seasonNumber < 1900 || data.seasonNumber > new Date().getFullYear() + 5) {
          throw new Error('Invalid release year for movie');
        }
        
        // Auto-generate title nếu chưa có format chuẩn
        if (!data.title.includes('Movie')) {
          data.title = `Movie ${data.seasonNumber}`;
        }
      }

      // Tạo season mới
      const season = await Season.create({
        seriesId: data.seriesId,
        title: data.title,
        seasonNumber: data.seasonNumber,
        seasonType: data.seasonType || 'tv',
        releaseYear: data.releaseYear || (data.seasonType === 'movie' ? data.seasonNumber : null),
        description: data.description || '',
        posterImage: data.posterImage || '',
        status: data.status || 'upcoming'
      });

      console.log(`✅ Season created: ${season.title} (Type: ${season.seasonType}, Number: ${season.seasonNumber})`);
      return season;

    } catch (error) {
      console.error('❌ Error creating season:', error.message);
      throw error;
    }
  }

  /**
   * Lấy season với episodes
   */
  static async getSeasonWithEpisodes(seasonId, onlyCompleted = true) {
    try {
      const season = await Season.findById(seasonId)
        .populate('seriesId', 'title slug posterImage genres status');

      if (!season) {
        return null;
      }

      // Lấy episodes thuộc season này
      const episodeQuery = { seasonId: seasonId };
      if (onlyCompleted) {
        episodeQuery.processingStatus = 'completed';
      }

      const episodes = await Episode.find(episodeQuery)
        .select('episodeNumber title description duration thumbnail hlsPath subtitles viewCount processingStatus')
        .sort({ episodeNumber: 1 });

      // Gắn episodes vào season object
      const seasonWithEpisodes = season.toObject();
      seasonWithEpisodes.episodes = episodes;
      seasonWithEpisodes.availableEpisodes = episodes.filter(ep => ep.processingStatus === 'completed').length;

      return seasonWithEpisodes;

    } catch (error) {
      console.error('❌ Error getting season with episodes:', error.message);
      throw error;
    }
  }

  /**
   * Lấy tất cả seasons của một series
   */
  static async getSeasonsBySeries(seriesId, includeEpisodes = false) {
    try {
      const seasons = await Season.find({ seriesId })
        .select('title seasonNumber seasonType releaseYear description posterImage episodeCount status')
        .sort({ seasonNumber: 1 });

      if (!includeEpisodes) {
        return seasons;
      }

      // Nếu cần episodes, populate cho từng season
      const seasonsWithEpisodes = await Promise.all(
        seasons.map(async (season) => {
          const episodes = await Episode.find({
            seasonId: season._id,
            processingStatus: 'completed'
          })
          .select('episodeNumber title duration thumbnail')
          .sort({ episodeNumber: 1 });

          const seasonObj = season.toObject();
          seasonObj.episodes = episodes;
          seasonObj.availableEpisodes = episodes.length;
          
          return seasonObj;
        })
      );

      return seasonsWithEpisodes;

    } catch (error) {
      console.error('❌ Error getting seasons by series:', error.message);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin season
   */
  static async updateSeason(seasonId, updateData) {
    try {
      const season = await Season.findById(seasonId);
      if (!season) {
        throw new Error('Season not found');
      }

      // Không cho phép thay đổi seriesId và seasonNumber
      delete updateData.seriesId;
      delete updateData.seasonNumber;

      // Cập nhật các trường được phép
      const allowedFields = [
        'title', 
        'seasonType', 
        'releaseYear', 
        'description', 
        'posterImage', 
        'status'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          season[field] = updateData[field];
        }
      });

      await season.save();
      
      console.log(`📺 Season updated: ${season.title}`);
      return season;

    } catch (error) {
      console.error('❌ Error updating season:', error.message);
      throw error;
    }
  }

  /**
   * Cập nhật số lượng episodes trong season
   */
  static async updateEpisodeCount(seasonId) {
    try {
      const episodeCount = await Episode.countDocuments({ 
        seasonId: seasonId,
        processingStatus: 'completed'
      });

      const season = await Season.findByIdAndUpdate(
        seasonId,
        { episodeCount: episodeCount },
        { new: true }
      );

      return season;

    } catch (error) {
      console.error('❌ Error updating episode count:', error.message);
      throw error;
    }
  }

  /**
   * Xóa season (chỉ khi không có episodes)
   */
  static async deleteSeason(seasonId) {
    try {
      const season = await Season.findById(seasonId);
      if (!season) {
        return false;
      }

      // Kiểm tra có episodes không
      const episodeCount = await Episode.countDocuments({ seasonId: seasonId });
      if (episodeCount > 0) {
        throw new Error('Cannot delete season that contains episodes. Delete episodes first.');
      }

      await Season.findByIdAndDelete(seasonId);
      
      console.log(`✅ Season deleted: ${season.title}`);
      return true;

    } catch (error) {
      console.error('❌ Error deleting season:', error.message);
      throw error;
    }
  }

  /**
   * Lấy seasons theo type (tv, movie, ova, special)
   */
  static async getSeasonsByType(seriesId, seasonType) {
    try {
      const seasons = await Season.find({
        seriesId: seriesId,
        seasonType: seasonType
      })
      .select('title seasonNumber releaseYear description posterImage episodeCount status')
      .sort({ seasonNumber: 1 });

      return seasons;

    } catch (error) {
      console.error('❌ Error getting seasons by type:', error.message);
      throw error;
    }
  }

  /**
   * Tìm kiếm seasons
   */
  static async searchSeasons(searchTerm, limit = 20) {
    try {
      const seasons = await Season.find({
        title: { $regex: searchTerm, $options: 'i' }
      })
      .populate('seriesId', 'title slug posterImage')
      .select('title seasonNumber seasonType releaseYear description posterImage episodeCount')
      .limit(limit);

      return seasons;

    } catch (error) {
      console.error('❌ Error searching seasons:', error.message);
      throw error;
    }
  }

  /**
   * Lấy seasons gần đây
   */
  static async getRecentSeasons(limit = 10) {
    try {
      const seasons = await Season.find({
        status: { $in: ['airing', 'completed'] }
      })
      .populate('seriesId', 'title slug posterImage genres')
      .select('title seasonNumber seasonType releaseYear posterImage episodeCount status')
      .sort({ createdAt: -1 })
      .limit(limit);

      return seasons;

    } catch (error) {
      console.error('❌ Error getting recent seasons:', error.message);
      throw error;
    }
  }

  /**
   * Lấy thống kê seasons
   */
  static async getSeasonStats() {
    try {
      const stats = await Season.aggregate([
        {
          $group: {
            _id: '$seasonType',
            count: { $sum: 1 }
          }
        }
      ]);

      const statusStats = await Season.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalSeasons = await Season.countDocuments();

      return {
        total: totalSeasons,
        byType: stats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byStatus: statusStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };

    } catch (error) {
      console.error('❌ Error getting season stats:', error.message);
      throw error;
    }
  }

  /**
   * Kiểm tra season có episodes đã xử lý xong chưa
   */
  static async hasCompletedEpisodes(seasonId) {
    try {
      const completedCount = await Episode.countDocuments({
        seasonId: seasonId,
        processingStatus: 'completed'
      });

      return completedCount > 0;

    } catch (error) {
      console.error('❌ Error checking completed episodes:', error.message);
      return false;
    }
  }

  /**
   * Lấy season theo series và season number
   */
  static async getSeasonByNumber(seriesId, seasonNumber) {
    try {
      const season = await Season.findOne({
        seriesId: seriesId,
        seasonNumber: seasonNumber
      })
      .populate('seriesId', 'title slug');

      return season;

    } catch (error) {
      console.error('❌ Error getting season by number:', error.message);
      throw error;
    }
  }
}

module.exports = SeasonService;