const Genre = require('../models/Genre');
const Season = require('../models/Season');

class GenreService {
  // Get all genres with optional search
  async getGenres(search = '', limit = 50, page = 1) {
    try {
      const query = { isActive: true };
      
      if (search) {
        query.$text = { $search: search };
      }
      
      const skip = (page - 1) * limit;
      
      const [genres, total] = await Promise.all([
        Genre.find(query)
          .sort(search ? { score: { $meta: 'textScore' } } : { name: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Genre.countDocuments(query)
      ]);
      
      return {
        success: true,
        data: genres,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          limit,
          count: genres.length
        }
      };
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw { success: false, error: 'Failed to fetch genres' };
    }
  }
  
  // Search genres for autocomplete
  async searchGenres(query, limit = 5) {
    try {
      if (!query.trim()) return [];
      
      const genres = await Genre.find({
        name: { $regex: query.trim(), $options: 'i' },
        isActive: true
      })
      .select('name seriesCount')
      .sort({ seriesCount: -1, name: 1 })
      .limit(limit)
      .lean();
      
      return genres.map(genre => ({
        name: genre.name,
        count: genre.seriesCount
      }));
    } catch (error) {
      console.error('Error searching genres:', error);
      return [];
    }
  }
  
  // Create new genre
  async createGenre(name, description = '') {
    try {
      // Check if genre already exists
      const existing = await Genre.findOne({ 
        name: { $regex: `^${name.trim()}$`, $options: 'i' }
      });
      
      if (existing) {
        return { success: false, error: 'Genre already exists' };
      }
      
      const genre = new Genre({
        name: name.trim(),
        description: description.trim()
      });
      
      await genre.save();
      
      return { success: true, data: genre };
    } catch (error) {
      console.error('Error creating genre:', error);
      
      if (error.code === 11000) {
        return { success: false, error: 'Genre already exists' };
      }
      
      throw { success: false, error: 'Failed to create genre' };
    }
  }
  
  // Get genre by ID
  async getGenreById(id) {
    try {
      const genre = await Genre.findById(id).lean();
      
      if (!genre) {
        return { success: false, error: 'Genre not found' };
      }
      
      return { success: true, data: genre };
    } catch (error) {
      console.error('Error fetching genre:', error);
      throw { success: false, error: 'Failed to fetch genre' };
    }
  }
  
  // Update genre usage count
  async updateUsageCount(genreId, increment = 1) {
    try {
      await Genre.findByIdAndUpdate(
        genreId,
        { $inc: { seriesCount: increment } }
      );
    } catch (error) {
      console.error('Error updating genre usage:', error);
    }
  }
  
  // Find or create genre by name
  async findOrCreateGenre(name) {
    try {
      let genre = await Genre.findOne({ 
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
        isActive: true 
      });
      
      if (!genre) {
        genre = new Genre({ name: name.trim() });
        await genre.save();
      }
      
      return { success: true, data: genre };
    } catch (error) {
      console.error('Error finding/creating genre:', error);
      throw { success: false, error: 'Failed to process genre' };
    }
  }
  
  // Batch find or create genres
  async findOrCreateGenres(names) {
    try {
      const genrePromises = names.map(name => this.findOrCreateGenre(name));
      const results = await Promise.all(genrePromises);
      
      const genres = results
        .filter(result => result.success)
        .map(result => result.data);
        
      return { success: true, data: genres };
    } catch (error) {
      console.error('Error batch processing genres:', error);
      throw { success: false, error: 'Failed to process genres' };
    }
  }

  /**
   * Lấy top genres (sort by viewCount)
   * @param {number} limit - Số lượng genres (default: 5)
   */
  async getTopGenres(limit = 5) {
    try {
      const genres = await Genre.find({ isActive: true })
        .select('name viewCount seriesCount')
        .sort({ viewCount: -1 })
        .limit(limit)
        .lean();

      console.log(`🏆 getTopGenres: Found ${genres.length} top genres`);
      return {
        success: true,
        data: genres
      };
    } catch (error) {
      console.error('Error getting top genres:', error);
      throw { success: false, error: 'Failed to fetch top genres' };
    }
  }

  /**
   * Lấy trending genres với seasons
   * @param {number} genreLimit - Số lượng genres (default: 3)
   * @param {number} seasonLimit - Số lượng seasons per genre (default: 5)
   */
  async getTrendingGenresWithSeasons(genreLimit = 3, seasonLimit = 5) {
    try {
      // 1. Lấy top genres theo viewCount
      const topGenres = await Genre.find({ isActive: true })
        .select('name viewCount')
        .sort({ viewCount: -1 })
        .limit(genreLimit)
        .lean();

      if (topGenres.length === 0) {
        return {
          success: true,
          data: []
        };
      }

      // 2. Với mỗi genre, lấy 5 seasons mới nhất có genre đó
      const genresWithSeasons = await Promise.all(
        topGenres.map(async (genre) => {
          const seasons = await Season.find({
            genres: genre._id,
            status: { $in: ['airing', 'completed'] } // Chỉ lấy seasons đang phát/hoàn thành
          })
            .populate('seriesId', 'title slug')
            .populate('studios', 'name')
            .select('title seasonNumber seasonType releaseYear posterImage viewCount episodeCount seriesId studios updatedAt')
            .sort({ updatedAt: -1 }) // Sort theo updatedAt (đã confirm)
            .limit(seasonLimit)
            .lean();

          return {
            _id: genre._id,
            name: genre.name,
            viewCount: genre.viewCount,
            seasons: seasons
          };
        })
      );

      console.log(`🔥 getTrendingGenres: Found ${genresWithSeasons.length} genres with seasons`);

      return {
        success: true,
        data: genresWithSeasons
      };

    } catch (error) {
      console.error('Error getting trending genres:', error);
      throw { success: false, error: 'Failed to fetch trending genres' };
    }
  }
}

module.exports = new GenreService();
