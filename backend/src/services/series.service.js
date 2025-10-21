const Series = require('../models/Series');
const Season = require('../models/Season');

class SeriesService {
  // Get series with filtering and pagination
  async getSeries(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        genres = [],
        status = '',
        studio = '',
        year = null,
        sort = 'recent'
      } = options;

      // Build query
      const query = {};
      
      if (search) {
        query.$text = { $search: search };
      }
      
      if (status) {
        query.status = status;
      }
      
      if (year) {
        query.releaseYear = year;
      }

      // Build sort
      let sortQuery = {};
      switch (sort) {
        case 'popular':
          sortQuery = { viewCount: -1 };
          break;
        case 'title':
          sortQuery = { title: 1 };
          break;
        case 'year':
          sortQuery = { releaseYear: -1 };
          break;
        case 'recent':
        default:
          sortQuery = { createdAt: -1 };
          break;
      }

      if (search) {
        sortQuery = { score: { $meta: 'textScore' } };
      }

      const skip = (page - 1) * limit;

      const [series, total] = await Promise.all([
        Series.find(query)
          .sort(sortQuery)
          .skip(skip)
          .limit(limit)
          .lean(),
        Series.countDocuments(query)
      ]);

      return {
        success: true,
        data: series,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          limit,
          count: series.length
        },
        filters: { search, genres, status, studio, year }
      };
    } catch (error) {
      console.error('Get series error:', error);
      throw { success: false, error: 'Failed to fetch series' };
    }
  }

  // Get series by slug with seasons and latest episodes
  async getSeriesBySlug(slug) {
    try {
      const series = await Series.findOne({ slug }).lean();

      if (!series) {
        return { success: false, error: 'Series not found' };
      }

      // Get all seasons for this series with studios and genres
      const Season = require('../models/Season');
      const Episode = require('../models/Episode');
      
      const seasons = await Season.find({ seriesId: series._id })
        .populate('studios', 'name')
        .populate('genres', 'name')
        .select('title seasonNumber seasonType releaseYear description posterImage episodeCount status studios genres')
        .lean();

      // Sort seasons: TV seasons first, then Movies (newest first), then OVA/Special
      const tvSeasons = seasons.filter(s => s.seasonType === 'tv').sort((a, b) => a.seasonNumber - b.seasonNumber);
      const movies = seasons.filter(s => s.seasonType === 'movie').sort((a, b) => b.seasonNumber - a.seasonNumber);
      const ovas = seasons.filter(s => s.seasonType === 'ova');
      const specials = seasons.filter(s => s.seasonType === 'special');
      const sortedSeasons = [...tvSeasons, ...movies, ...ovas, ...specials];

      // Get latest episode for each season (by updatedAt)
      const seasonsWithLatestEpisode = await Promise.all(
        sortedSeasons.map(async (season) => {
          const latestEpisode = await Episode.findOne({
            seasonId: season._id,
            processingStatus: 'completed'
          })
          .select('_id episodeNumber updatedAt')
          .sort({ updatedAt: -1 })
          .lean();

          return {
            ...season,
            latestEpisode
          };
        })
      );

      // Find default season: Season with most recent episode upload
      let defaultSeason = null;
      let latestUploadTime = null;

      for (const season of seasonsWithLatestEpisode) {
        if (season.latestEpisode) {
          const uploadTime = new Date(season.latestEpisode.updatedAt).getTime();
          if (!latestUploadTime || uploadTime > latestUploadTime) {
            latestUploadTime = uploadTime;
            defaultSeason = season;
          }
        }
      }

      // If no episodes found, default to first season
      if (!defaultSeason && seasonsWithLatestEpisode.length > 0) {
        defaultSeason = seasonsWithLatestEpisode[0];
      }

      // Increment view count
      await Series.findByIdAndUpdate(series._id, { $inc: { viewCount: 1 } });

      return { 
        success: true, 
        data: {
          series,
          seasons: seasonsWithLatestEpisode,
          defaultSeason
        }
      };
    } catch (error) {
      console.error('Get series by slug error:', error);
      throw { success: false, error: 'Failed to fetch series' };
    }
  }

  // Create new series
  async createSeries(seriesData) {
    try {
      // Validate required fields
      if (!seriesData.title?.trim()) {
        return { success: false, error: 'Series title is required' };
      }

      if (!seriesData.releaseYear) {
        return { success: false, error: 'Release year is required' };
      }

      // Check for duplicate title
      const existing = await Series.findOne({ 
        title: { $regex: `^${seriesData.title.trim()}$`, $options: 'i' }
      });

      if (existing) {
        return { success: false, error: 'Series with this title already exists' };
      }

      const series = new Series(seriesData);
      await series.save();

      return { success: true, data: series };
    } catch (error) {
      console.error('Create series error:', error);
      
      if (error.code === 11000) {
        return { success: false, error: 'Series already exists' };
      }
      
      throw { success: false, error: 'Failed to create series' };
    }
  }

  // Update series
  async updateSeries(id, updates) {
    try {
      const series = await Series.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!series) {
        return { success: false, error: 'Series not found' };
      }

      return { success: true, data: series };
    } catch (error) {
      console.error('Update series error:', error);
      throw { success: false, error: 'Failed to update series' };
    }
  }

  // Delete series (protective - only if no seasons exist)
  async deleteSeries(id) {
    try {
      const series = await Series.findById(id);
      
      if (!series) {
        return { success: false, error: 'Series not found' };
      }

      // PROTECTIVE CHECK: Kiểm tra có seasons không
      const seasonCount = await Season.countDocuments({ seriesId: id });
      
      if (seasonCount > 0) {
        return { 
          success: false, 
          error: `Cannot delete series that contains ${seasonCount} season(s). Please delete all seasons first.` 
        };
      }

      // Xóa banner image nếu có
      if (series.bannerImage) {
        const ImageService = require('./image.service');
        await ImageService.deleteImage(series.bannerImage);
      }

      // Xóa series
      await Series.findByIdAndDelete(id);

      console.log(`✅ Series deleted: ${series.title}`);
      return { success: true, message: 'Series deleted successfully' };
      
    } catch (error) {
      console.error('Delete series error:', error);
      throw { success: false, error: 'Failed to delete series' };
    }
  }

    // Get recent series for upload interface
    async getRecentSeries(limit = 10) {
      try {
        const series = await Series.find()
          .sort({ updatedAt: -1 })
          .limit(limit)
          .select('title originalTitle releaseYear status createdAt updatedAt')
          .lean();

        return { success: true, data: series };
      } catch (error) {
        console.error('Get recent series error:', error);
        throw { success: false, error: 'Failed to fetch recent series' };
      }
   }

  // Search series for admin interface
  async searchSeries(query, limit = 10) {
    try {
      if (!query.trim()) return [];

      const series = await Series.find({
        $or: [
          { title: { $regex: query.trim(), $options: 'i' } },
          { originalTitle: { $regex: query.trim(), $options: 'i' } }
        ]
      })
      .select('title originalTitle releaseYear status')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

      return series;
    } catch (error) {
      console.error('Search series error:', error);
      return [];
    }
  }

  /**
   * Search series với season mới nhất và episode count (PUBLIC)
   * Response format:
   * {
   *   _id, title, originalTitle, slug,
   *   latestSeason: { seasonNumber, seasonType, posterImage, maxEpisode }
   * }
   */
  async searchSeriesWithLatestSeason(query, limit = 10) {
    try {
      if (!query.trim()) return [];

      const Episode = require('../models/Episode');

      // Step 1: Tìm series khớp với query
      const series = await Series.find({
        $or: [
          { title: { $regex: query.trim(), $options: 'i' } },
          { originalTitle: { $regex: query.trim(), $options: 'i' } }
        ]
      })
      .select('_id title originalTitle slug')
      .limit(limit)
      .lean();

      if (series.length === 0) {
        return [];
      }

      // Step 2: Với mỗi series, lấy season mới nhất (theo updatedAt)
      const seriesWithLatestSeason = await Promise.all(
        series.map(async (s) => {
          // Lấy season có episode mới nhất (theo updatedAt của episode)
          const latestSeasonWithEpisode = await Season.aggregate([
            // Match seasons của series này
            { $match: { seriesId: s._id } },
            
            // Lookup episodes
            {
              $lookup: {
                from: 'episodes',
                localField: '_id',
                foreignField: 'seasonId',
                as: 'episodes'
              }
            },
            
            // Chỉ lấy seasons có episodes completed
            {
              $match: {
                'episodes.processingStatus': 'completed'
              }
            },
            
            // Tính episode lớn nhất và updatedAt mới nhất
            {
              $addFields: {
                maxEpisode: {
                  $max: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$episodes',
                          as: 'ep',
                          cond: { $eq: ['$$ep.processingStatus', 'completed'] }
                        }
                      },
                      as: 'ep',
                      in: '$$ep.episodeNumber'
                    }
                  }
                },
                latestEpisodeUpdate: {
                  $max: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$episodes',
                          as: 'ep',
                          cond: { $eq: ['$$ep.processingStatus', 'completed'] }
                        }
                      },
                      as: 'ep',
                      in: '$$ep.updatedAt'
                    }
                  }
                }
              }
            },
            
            // Sort by episode update time
            { $sort: { latestEpisodeUpdate: -1 } },
            
            // Lấy season mới nhất
            { $limit: 1 },
            
            // Project fields cần thiết
            {
              $project: {
                seasonNumber: 1,
                seasonType: 1,
                posterImage: 1,
                releaseYear: 1,
                maxEpisode: 1
              }
            }
          ]);

          // Nếu không có season nào có episodes
          if (latestSeasonWithEpisode.length === 0) {
            return null;
          }

          return {
            ...s,
            latestSeason: latestSeasonWithEpisode[0]
          };
        })
      );

      // Filter out series không có seasons/episodes
      const validSeries = seriesWithLatestSeason.filter(s => s !== null);

      console.log(`🔍 Found ${validSeries.length} series matching "${query}"`);
      return validSeries;

    } catch (error) {
      console.error('❌ Search series with latest season error:', error);
      throw error;
    }
  }
}

module.exports = new SeriesService();
