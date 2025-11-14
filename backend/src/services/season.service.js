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
        seasonId: seasonId
        // Count ALL episodes regardless of processing status
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
      const seasons = await Season.find({})
      .populate('seriesId', 'title slug posterImage bannerImage description genres studio')
      .populate('studios', 'name')
      .populate('genres', 'name')
      .select('title seasonNumber seasonType releaseYear posterImage episodeCount status studios genres description')
      .sort({ createdAt: -1 })
      .limit(limit);

      console.log(`📺 getRecentSeasons: Found ${seasons.length} seasons`);
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
   * Lấy top seasons hot (100 ngày gần nhất, sort by viewCount)
   * @param {number} limit - Số lượng seasons (default: 5)
   */
  static async getTopSeasons(limit = 5) {
    try {
      // Tính ngày 100 ngày trước
      const hundredDaysAgo = new Date();
      hundredDaysAgo.setDate(hundredDaysAgo.getDate() - 100);

      const seasons = await Season.find({
        createdAt: { $gte: hundredDaysAgo }
        // Removed status filter to show all seasons
      })
        .populate('seriesId', 'title slug posterImage')
        .populate('genres', 'name')
        .populate('studios', 'name')
        .select('title seasonNumber seasonType releaseYear posterImage viewCount episodeCount status createdAt seriesId genres studios')
        .sort({ viewCount: -1 }) // Sort by views DESC
        .limit(limit)
        .lean();

      // Thêm thông tin episode mới nhất cho seasons đang airing
      const seasonsWithEpisodeInfo = await Promise.all(
        seasons.map(async (season) => {
          if (season.status === 'airing') {
            // Lấy episode mới nhất
            const latestEpisode = await Episode.findOne({
              seasonId: season._id,
              processingStatus: 'completed'
            })
              .select('episodeNumber')
              .sort({ episodeNumber: -1 })
              .lean();

            return {
              ...season,
              latestEpisode: latestEpisode ? latestEpisode.episodeNumber : 0
            };
          }
          return season;
        })
      );

      console.log(`🔥 getTopSeasons: Found ${seasonsWithEpisodeInfo.length} hot seasons`);
      return seasonsWithEpisodeInfo;

    } catch (error) {
      console.error('❌ Error getting top seasons:', error.message);
      throw error;
    }
  }

  /**
   * Lấy trending genres: Top 3 genres với tổng views cao nhất
   * Mỗi genre trả về top 5 seasons có nhiều views nhất
   * OPTIMIZED: Single aggregation query
   */
  static async getTrendingGenres() {
    try {
      // Single optimized aggregation query
      const pipeline = [
        // Step 1: Lookup episodes to get view counts
        {
          $lookup: {
            from: 'episodes',
            localField: '_id',
            foreignField: 'seasonId',
            as: 'episodes'
          }
        },
        // Step 2: Calculate total views for each season
        {
          $addFields: {
            totalViews: { $sum: '$episodes.viewCount' }
          }
        },
        // Step 3: Lookup series info
        {
          $lookup: {
            from: 'series',
            localField: 'seriesId',
            foreignField: '_id',
            as: 'series'
          }
        },
        {
          $unwind: '$series'
        },
        // Step 4: Unwind genres to process each genre separately
        {
          $unwind: '$genres'
        },
        // Step 5: Lookup genre info
        {
          $lookup: {
            from: 'genres',
            localField: 'genres',
            foreignField: '_id',
            as: 'genreInfo'
          }
        },
        {
          $unwind: '$genreInfo'
        },
        // Step 6: Sort by views (descending)
        {
          $sort: { totalViews: -1 }
        },
        // Step 7: Group by genre and collect top seasons
        {
          $group: {
            _id: '$genreInfo._id',
            genreName: { $first: '$genreInfo.name' },
            totalGenreViews: { $sum: '$totalViews' },
            seasons: {
              $push: {
                _id: '$_id',
                title: '$title',
                seasonNumber: '$seasonNumber',
                seasonType: '$seasonType',
                posterImage: '$posterImage',
                episodeCount: '$episodeCount',
                totalViews: '$totalViews',
                series: {
                  _id: '$series._id',
                  title: '$series.title',
                  slug: '$series.slug',
                  posterImage: '$series.posterImage'
                }
              }
            }
          }
        },
        // Step 8: Sort genres by total views
        {
          $sort: { totalGenreViews: -1 }
        },
        // Step 9: Limit to top 3 genres
        {
          $limit: 3
        },
        // Step 10: Limit seasons to top 5 per genre
        {
          $project: {
            _id: 1,
            genreName: 1,
            totalGenreViews: 1,
            seasons: { $slice: ['$seasons', 5] } // Take only top 5
          }
        }
      ];

      const results = await Season.aggregate(pipeline);

      // Format response
      const formatted = results.map(result => ({
        genre: {
          _id: result._id,
          name: result.genreName
        },
        totalViews: result.totalGenreViews,
        seasons: result.seasons
      }));

      console.log(`🔥 Trending genres: ${formatted.map(r => `${r.genre.name} (${r.totalViews} views)`).join(', ')}`);
      return formatted;

    } catch (error) {
      console.error('❌ Error getting trending genres:', error.message);
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

  /**
   * Advanced Search Seasons với filters
   * @param {Object} filters - { seasonTypes, genres, studios, yearStart, yearEnd, excludeYears, sortBy, page, limit }
   * @returns {Object} - { seasons, pagination }
   */
  static async advancedSearchSeasons(filters = {}) {
    try {
      const {
        seasonTypes = [], // ['tv', 'movie', 'ova', 'special']
        genres = [],      // Array of genre names
        studios = [],     // Array of studio names
        yearStart = null, // Năm bắt đầu
        yearEnd = null,   // Năm kết thúc
        excludeYears = [], // Array of years to exclude
        sortBy = 'updatedAt', // 'title' | 'year' | 'updatedAt'
        page = 1,
        limit = 24        // 4 rows x 6 columns
      } = filters;

      // Build query
      const query = {};

      // Filter by season types
      if (seasonTypes.length > 0) {
        query.seasonType = { $in: seasonTypes };
      }

      // Filter by release year range WITH EXCLUSIONS
      if (yearStart !== null || yearEnd !== null || excludeYears.length > 0) {
        query.releaseYear = {};
        
        if (yearStart !== null) {
          query.releaseYear.$gte = parseInt(yearStart);
        }
        if (yearEnd !== null) {
          query.releaseYear.$lte = parseInt(yearEnd);
        }
        
        // Loại trừ các năm cụ thể
        if (excludeYears.length > 0) {
          const excludeYearsInt = excludeYears.map(y => parseInt(y));
          query.releaseYear.$nin = excludeYearsInt;
        }
      }

      // Build aggregation pipeline
      const pipeline = [
        // Match basic filters
        { $match: query },

        // Lookup series info
        {
          $lookup: {
            from: 'series',
            localField: 'seriesId',
            foreignField: '_id',
            as: 'series'
          }
        },
        { $unwind: '$series' },

        // Lookup genres
        {
          $lookup: {
            from: 'genres',
            localField: 'genres',
            foreignField: '_id',
            as: 'genreDetails'
          }
        },

        // Lookup studios
        {
          $lookup: {
            from: 'studios',
            localField: 'studios',
            foreignField: '_id',
            as: 'studioDetails'
          }
        }
      ];

      // Filter by genres (AND logic - phải có TẤT CẢ genres được chọn)
      if (genres.length > 0) {
        pipeline.push({
          $match: {
            $expr: {
              $setIsSubset: [
                genres,
                '$genreDetails.name'
              ]
            }
          }
        });
      }

      // Filter by studios (AND logic - phải có TẤT CẢ studios được chọn)
      if (studios.length > 0) {
        pipeline.push({
          $match: {
            $expr: {
              $setIsSubset: [
                studios,
                '$studioDetails.name'
              ]
            }
          }
        });
      }

      // Project fields
      pipeline.push({
        $project: {
          _id: 1,
          title: 1,
          seasonNumber: 1,
          seasonType: 1,
          releaseYear: 1,
          posterImage: 1,
          episodeCount: 1,
          updatedAt: 1,
          'series._id': 1,
          'series.title': 1,
          'series.slug': 1
        }
      });

      // Sort based on sortBy parameter
      let sortStage = {};
      switch (sortBy) {
        case 'title':
          sortStage = { 'series.title': 1, title: 1 }; // A-Z
          break;
        case 'year':
          sortStage = { releaseYear: -1, seasonNumber: -1 }; // Mới nhất first
          break;
        case 'updatedAt':
        default:
          sortStage = { updatedAt: -1 }; // Mới cập nhật first
          break;
      }
      pipeline.push({ $sort: sortStage });

      // Count total results
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Season.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      // Pagination
      const skip = (page - 1) * limit;
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Execute query
      const seasons = await Season.aggregate(pipeline);

      console.log(`🔍 Advanced Search: Found ${total} seasons (page ${page}/${Math.ceil(total / limit)})`);

      return {
        seasons,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalResults: total,
          limit: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      };

    } catch (error) {
      console.error('❌ Error in advanced search seasons:', error);
      throw error;
    }
  }

}

module.exports = SeasonService;
