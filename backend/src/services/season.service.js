// @ts-nocheck
const Season = require('../models/Season');
const Episode = require('../models/Episode');
const Series = require('../models/Series');
const Studio = require('../models/Studio');
const Genre = require('../models/Genre');

/**
 * ===== SEASON SERVICE - JAVASCRIPT VERSION =====
 * Quản lý seasons: TV, Movies, OVAs, Specials với Studios và Genres
 */
class SeasonService {

  /**
   * Tạo season mới trong series với studios và genres
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

      // Process studios và genres
      let studioIds = [];
      let genreIds = [];

      // Convert studio names to ObjectIds
      if (data.studios && Array.isArray(data.studios)) {
        const studioPromises = data.studios.map(async (studioName) => {
          let studio = await Studio.findOne({ 
            name: { $regex: `^${studioName.trim()}$`, $options: 'i' } 
          });
          
          if (!studio) {
            // Tạo studio mới nếu chưa có
            studio = new Studio({ name: studioName.trim() });
            await studio.save();
            console.log(`📍 Created new studio: ${studioName}`);
          }
          
          return studio._id;
        });
        studioIds = await Promise.all(studioPromises);
      }

      // Convert genre names to ObjectIds
      if (data.genres && Array.isArray(data.genres)) {
        const genrePromises = data.genres.map(async (genreName) => {
          let genre = await Genre.findOne({ 
            name: { $regex: `^${genreName.trim()}$`, $options: 'i' } 
          });
          
          if (!genre) {
            // Tạo genre mới nếu chưa có
            genre = new Genre({ name: genreName.trim() });
            await genre.save();
            console.log(`🎭 Created new genre: ${genreName}`);
          }
          
          return genre._id;
        });
        genreIds = await Promise.all(genrePromises);
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
        status: data.status || 'upcoming',
        studios: studioIds,
        genres: genreIds
      });

      // Update studio và genre usage counts
      if (studioIds.length > 0) {
        await Studio.updateMany(
          { _id: { $in: studioIds } },
          { $inc: { seriesCount: 1 } }
        );
      }

      if (genreIds.length > 0) {
        await Genre.updateMany(
          { _id: { $in: genreIds } },
          { $inc: { seriesCount: 1 } }
        );
      }

      console.log(`✅ Season created: ${season.title} (Type: ${season.seasonType}, Number: ${season.seasonNumber})`);
      console.log(`   Studios: ${data.studios?.join(', ') || 'None'}`);
      console.log(`   Genres: ${data.genres?.join(', ') || 'None'}`);
      
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
        .populate('seriesId', 'title slug posterImage status')
        .populate('studios', 'name description')
        .populate('genres', 'name description');

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
   * Lấy tất cả seasons của một series với studios và genres
   */
  static async getSeasonsBySeries(seriesId, includeEpisodes = false) {
    try {
      console.log('🔍 SeasonService.getSeasonsBySeries called with seriesId:', seriesId);
      
      const seasons = await Season.find({ seriesId })
        .populate('studios', 'name')
        .populate('genres', 'name')
        .select('title seasonNumber seasonType releaseYear description posterImage episodeCount status studios genres')
        .sort({ seasonNumber: 1 });
      
      console.log('📊 Found seasons count:', seasons.length);
      console.log('📋 Season seriesIds:', seasons.map(s => ({ id: s._id, seriesId: s.seriesId })));

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

      // Process studios và genres nếu có trong updateData
      if (updateData.studios && Array.isArray(updateData.studios)) {
        const studioPromises = updateData.studios.map(async (studioName) => {
          let studio = await Studio.findOne({ 
            name: { $regex: `^${studioName.trim()}$`, $options: 'i' } 
          });
          
          if (!studio) {
            studio = new Studio({ name: studioName.trim() });
            await studio.save();
          }
          
          return studio._id;
        });
        updateData.studios = await Promise.all(studioPromises);
      }

      if (updateData.genres && Array.isArray(updateData.genres)) {
        const genrePromises = updateData.genres.map(async (genreName) => {
          let genre = await Genre.findOne({ 
            name: { $regex: `^${genreName.trim()}$`, $options: 'i' } 
          });
          
          if (!genre) {
            genre = new Genre({ name: genreName.trim() });
            await genre.save();
          }
          
          return genre._id;
        });
        updateData.genres = await Promise.all(genrePromises);
      }

      // Cập nhật các trường được phép
      const allowedFields = [
        'title', 
        'seasonType', 
        'releaseYear', 
        'description', 
        'posterImage', 
        'status',
        'studios',
        'genres'
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
      .populate('studios', 'name')
      .populate('genres', 'name')
      .select('title seasonNumber releaseYear description posterImage episodeCount status studios genres')
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
      .populate('studios', 'name')
      .populate('genres', 'name')
      .select('title seasonNumber seasonType releaseYear description posterImage episodeCount studios genres')
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
      .populate('seriesId', 'title slug posterImage')
      .populate('studios', 'name')
      .populate('genres', 'name')
      .select('title seasonNumber seasonType releaseYear posterImage episodeCount status studios genres')
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
      .populate('seriesId', 'title slug')
      .populate('studios', 'name')
      .populate('genres', 'name');

      return season;

    } catch (error) {
      console.error('❌ Error getting season by number:', error.message);
      throw error;
    }
  }

  static async getNextSeasonNumber(seriesId, seasonType) {
    try {
      if (seasonType === 'movie') {
        // Cho movies, return current year
        return new Date().getFullYear();
      }

      // Cho TV/OVA/Special, tìm số cao nhất + 1
      const lastSeason = await Season.findOne({
        seriesId: seriesId,
        seasonType: seasonType
      })
      .sort({ seasonNumber: -1 })
      .select('seasonNumber');

      return lastSeason ? lastSeason.seasonNumber + 1 : 1;

    } catch (error) {
      console.error('❌ Error getting next season number:', error.message);
      return 1;
    }
  }

  /**
   * Helper: Generate season title based on type và number
   */
  static generateSeasonTitle(seasonType, seasonNumber, customTitle = null) {
    if (customTitle) {
      return customTitle;
    }

    switch (seasonType) {
      case 'movie':
        return `Movie ${seasonNumber}`;
      case 'ova':
        return `OVA`;
      case 'special':
        return `Special`;
      case 'tv':
      default:
        return `Season ${seasonNumber}`;
    }
  }

  /**
   * Lấy tất cả movies của series (sorted by year)
   */
  static async getMoviesBySeries(seriesId) {
    try {
      const movies = await Season.find({
        seriesId: seriesId,
        seasonType: 'movie'
      })
      .populate('studios', 'name')
      .populate('genres', 'name')
      .select('title seasonNumber releaseYear description posterImage episodeCount status studios genres')
      .sort({ seasonNumber: 1 }); // Sort by year

      return movies;

    } catch (error) {
      console.error('❌ Error getting movies by series:', error.message);
      throw error;
    }
  }

  /**
   * Validate season data trước khi tạo
   */
  static validateSeasonData(data) {
    const errors = [];

    if (!data.seriesId) errors.push('Series ID is required');
    if (!data.title || data.title.trim() === '') errors.push('Title is required');
    if (data.seasonNumber === undefined || data.seasonNumber === null) {
      errors.push('Season number is required');
    }

    // Validate theo từng type
    if (data.seasonType === 'movie') {
      if (data.seasonNumber < 1900 || data.seasonNumber > new Date().getFullYear() + 5) {
        errors.push('Movie year must be between 1900 and future 5 years');
      }
    } else {
      if (data.seasonNumber < 1) {
        errors.push('Season number must be greater than 0');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = SeasonService;
