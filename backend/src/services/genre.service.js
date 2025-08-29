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
}

module.exports = new GenreService();
