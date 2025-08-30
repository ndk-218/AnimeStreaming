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

  // Get series by slug with seasons populated
  async getSeriesBySlug(slug) {
    try {
      const series = await Series.findOne({ slug })
        .populate({
          path: 'seasons',
          populate: {
            path: 'studios genres',
            select: 'name'
          },
          options: { sort: { seasonNumber: 1, seasonType: 1 } }
        })
        .lean();

      if (!series) {
        return { success: false, error: 'Series not found' };
      }

      // Increment view count
      await Series.findByIdAndUpdate(series._id, { $inc: { viewCount: 1 } });

      return { success: true, data: series };
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

  // Delete series and all related data
  async deleteSeries(id) {
    try {
      const series = await Series.findById(id);
      
      if (!series) {
        return { success: false, error: 'Series not found' };
      }

      // TODO: Delete all seasons and episodes (implement when needed)
      await Series.findByIdAndDelete(id);

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
}

module.exports = new SeriesService();
