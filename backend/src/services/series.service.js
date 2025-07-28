// @ts-nocheck
const Series = require('../models/Series');
const Season = require('../models/Season');
const Episode = require('../models/Episode');

/**
 * ===== SERIES SERVICE - JAVASCRIPT VERSION =====
 * Quản lý anime series chính
 */
class SeriesService {

  /**
   * Tạo series mới với slug generation
   */
  static async createSeries(data) {
    try {
      // Validate dữ liệu đầu vào
      if (!data.title) {
        throw new Error('Title is required');
      }

      // Generate unique slug
      const baseSlug = this.generateSlug(data.title);
      const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

      // Tạo series mới
      const series = await Series.create({
        title: data.title,
        originalTitle: data.originalTitle || '',
        slug: uniqueSlug,
        description: data.description || '',
        releaseYear: data.releaseYear,
        status: data.status || 'upcoming',
        genres: data.genres || [],
        studio: data.studio || '',
        posterImage: data.posterImage || '',
        bannerImage: data.bannerImage || ''
      });

      console.log(`✅ Series created: ${series.title} (Slug: ${series.slug})`);
      return series;

    } catch (error) {
      console.error('❌ Error creating series:', error.message);
      throw error;
    }
  }

  /**
   * Lấy series với full details (seasons + episodes)
   */
  static async getSeriesWithDetails(seriesId) {
    try {
      const series = await Series.findById(seriesId);
      if (!series) {
        return null;
      }

      // Lấy seasons thuộc series này
      const seasons = await Season.find({ seriesId: seriesId })
        .select('title seasonNumber seasonType releaseYear description posterImage episodeCount status')
        .sort({ seasonNumber: 1 });

      // Lấy episodes cho từng season
      const seasonsWithEpisodes = await Promise.all(
        seasons.map(async (season) => {
          const episodes = await Episode.find({
            seasonId: season._id,
            processingStatus: 'completed'
          })
          .select('episodeNumber title duration thumbnail hlsPath')
          .sort({ episodeNumber: 1 });

          const seasonObj = season.toObject();
          seasonObj.episodes = episodes;
          seasonObj.availableEpisodes = episodes.length;
          
          return seasonObj;
        })
      );

      // Combine tất cả thông tin
      const seriesWithDetails = series.toObject();
      seriesWithDetails.seasons = seasonsWithEpisodes;
      seriesWithDetails.totalSeasons = seasons.length;
      seriesWithDetails.totalEpisodes = seasonsWithEpisodes.reduce(
        (sum, season) => sum + season.availableEpisodes, 0
      );

      return seriesWithDetails;

    } catch (error) {
      console.error('❌ Error getting series with details:', error.message);
      throw error;
    }
  }

  /**
   * Lấy series by slug
   */
  static async getSeriesBySlug(slug) {
    try {
      const series = await this.getSeriesWithDetails(
        await Series.findOne({ slug }).select('_id')
      );

      return series;

    } catch (error) {
      console.error('❌ Error getting series by slug:', error.message);
      throw error;
    }
  }

  /**
   * Lấy danh sách series với filtering và pagination
   */
  static async getSeriesList(options = {}) {
    try {
      const {
        search = '',
        genres = [],
        status = '',
        studio = '',
        year = null,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // Build query
      const query = {};

      // Search by title
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { originalTitle: { $regex: search, $options: 'i' } }
        ];
      }

      // Filter by genres
      if (genres.length > 0) {
        query.genres = { $in: genres };
      }

      // Filter by status
      if (status) {
        query.status = status;
      }

      // Filter by studio
      if (studio) {
        query.studio = { $regex: studio, $options: 'i' };
      }

      // Filter by year
      if (year) {
        query.releaseYear = year;
      }

      // Pagination
      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const [seriesList, total] = await Promise.all([
        Series.find(query)
          .select('title originalTitle slug description releaseYear status genres studio posterImage bannerImage viewCount')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        Series.countDocuments(query)
      ]);

      return {
        series: seriesList,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          limit: limit,
          count: total
        }
      };

    } catch (error) {
      console.error('❌ Error getting series list:', error.message);
      throw error;
    }
  }

  /**
   * Cập nhật series
   */
  static async updateSeries(seriesId, updateData) {
    try {
      const series = await Series.findById(seriesId);
      if (!series) {
        throw new Error('Series not found');
      }

      // Nếu title thay đổi, cập nhật slug
      if (updateData.title && updateData.title !== series.title) {
        const baseSlug = this.generateSlug(updateData.title);
        updateData.slug = await this.ensureUniqueSlug(baseSlug, seriesId);
      }

      // Cập nhật các trường được phép
      const allowedFields = [
        'title', 'originalTitle', 'slug', 'description', 
        'releaseYear', 'status', 'genres', 'studio', 
        'posterImage', 'bannerImage'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          series[field] = updateData[field];
        }
      });

      await series.save();
      
      console.log(`📺 Series updated: ${series.title}`);
      return series;

    } catch (error) {
      console.error('❌ Error updating series:', error.message);
      throw error;
    }
  }

  /**
   * Xóa series (chỉ khi không có seasons/episodes)
   */
  static async deleteSeries(seriesId) {
    try {
      const series = await Series.findById(seriesId);
      if (!series) {
        return false;
      }

      // Kiểm tra có seasons không
      const seasonCount = await Season.countDocuments({ seriesId: seriesId });
      if (seasonCount > 0) {
        throw new Error('Cannot delete series that contains seasons. Delete seasons first.');
      }

      await Series.findByIdAndDelete(seriesId);
      
      console.log(`✅ Series deleted: ${series.title}`);
      return true;

    } catch (error) {
      console.error('❌ Error deleting series:', error.message);
      throw error;
    }
  }

  /**
   * Tăng view count cho series
   */
  static async incrementViewCount(seriesId) {
    try {
      const series = await Series.findByIdAndUpdate(
        seriesId,
        { $inc: { viewCount: 1 } },
        { new: true }
      );

      return series;

    } catch (error) {
      console.error('❌ Error incrementing view count:', error.message);
      throw error;
    }
  }

  /**
   * Lấy series trending (nhiều views nhất)
   */
  static async getTrendingSeries(limit = 10) {
    try {
      const series = await Series.find({
        status: { $in: ['ongoing', 'completed'] }
      })
      .select('title slug description releaseYear genres studio posterImage viewCount')
      .sort({ viewCount: -1 })
      .limit(limit);

      return series;

    } catch (error) {
      console.error('❌ Error getting trending series:', error.message);
      throw error;
    }
  }

  /**
   * Lấy series mới nhất
   */
  static async getLatestSeries(limit = 10) {
    try {
      const series = await Series.find()
        .select('title slug description releaseYear genres studio posterImage status')
        .sort({ createdAt: -1 })
        .limit(limit);

      return series;

    } catch (error) {
      console.error('❌ Error getting latest series:', error.message);
      throw error;
    }
  }

  /**
   * Lấy series theo genre
   */
  static async getSeriesByGenre(genre, limit = 20) {
    try {
      const series = await Series.find({
        genres: { $in: [genre] }
      })
      .select('title slug description releaseYear genres studio posterImage viewCount')
      .sort({ viewCount: -1 })
      .limit(limit);

      return series;

    } catch (error) {
      console.error('❌ Error getting series by genre:', error.message);
      throw error;
    }
  }

  /**
   * Lấy tất cả genres có sẵn
   */
  static async getAllGenres() {
    try {
      const genres = await Series.distinct('genres');
      
      // Đếm số series cho mỗi genre
      const genreStats = await Promise.all(
        genres.map(async (genre) => {
          const count = await Series.countDocuments({
            genres: { $in: [genre] }
          });
          
          return {
            name: genre,
            count: count
          };
        })
      );

      // Sort theo số lượng series
      genreStats.sort((a, b) => b.count - a.count);

      return genreStats;

    } catch (error) {
      console.error('❌ Error getting all genres:', error.message);
      throw error;
    }
  }

  /**
   * Lấy tất cả studios có sẵn
   */
  static async getAllStudios() {
    try {
      const studios = await Series.distinct('studio');
      
      // Lọc bỏ empty strings
      const validStudios = studios.filter(studio => studio && studio.trim());

      // Đếm số series cho mỗi studio
      const studioStats = await Promise.all(
        validStudios.map(async (studio) => {
          const count = await Series.countDocuments({ studio: studio });
          
          return {
            name: studio,
            count: count
          };
        })
      );

      // Sort theo số lượng series
      studioStats.sort((a, b) => b.count - a.count);

      return studioStats;

    } catch (error) {
      console.error('❌ Error getting all studios:', error.message);
      throw error;
    }
  }

  /**
   * Lấy thống kê series
   */
  static async getSeriesStats() {
    try {
      const stats = await Series.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalSeries = await Series.countDocuments();
      const totalViews = await Series.aggregate([
        { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
      ]);

      return {
        total: totalSeries,
        byStatus: stats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        totalViews: totalViews[0]?.totalViews || 0
      };

    } catch (error) {
      console.error('❌ Error getting series stats:', error.message);
      throw error;
    }
  }

  /**
   * Helper: Generate slug từ title
   */
  static generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim('-'); // Remove leading/trailing hyphens
  }

  /**
   * Helper: Ensure unique slug
   */
  static async ensureUniqueSlug(baseSlug, excludeId = null) {
    let slug = baseSlug;
    let counter = 0;

    while (true) {
      const query = { slug: slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existingSeries = await Series.findOne(query);
      
      if (!existingSeries) {
        return slug;
      }

      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }

  /**
   * Search suggestions cho autocomplete
   */
  static async getSearchSuggestions(term, limit = 5) {
    try {
      const suggestions = await Series.find({
        $or: [
          { title: { $regex: term, $options: 'i' } },
          { originalTitle: { $regex: term, $options: 'i' } }
        ]
      })
      .select('title originalTitle slug')
      .limit(limit);

      return suggestions;

    } catch (error) {
      console.error('❌ Error getting search suggestions:', error.message);
      throw error;
    }
  }
}

module.exports = SeriesService;