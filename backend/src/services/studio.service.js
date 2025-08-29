const Studio = require('../models/Studio');
const Season = require('../models/Season');

class StudioService {
  // Get all studios with optional search
  async getStudios(search = '', limit = 50, page = 1) {
    try {
      const query = { isActive: true };
      
      if (search) {
        query.$text = { $search: search };
      }
      
      const skip = (page - 1) * limit;
      
      const [studios, total] = await Promise.all([
        Studio.find(query)
          .sort(search ? { score: { $meta: 'textScore' } } : { name: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Studio.countDocuments(query)
      ]);
      
      return {
        success: true,
        data: studios,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          limit,
          count: studios.length
        }
      };
    } catch (error) {
      console.error('Error fetching studios:', error);
      throw { success: false, error: 'Failed to fetch studios' };
    }
  }
  
  // Search studios for autocomplete
  async searchStudios(query, limit = 5) {
    try {
      if (!query.trim()) return [];
      
      const studios = await Studio.find({
        name: { $regex: query.trim(), $options: 'i' },
        isActive: true
      })
      .select('name seriesCount')
      .sort({ seriesCount: -1, name: 1 })
      .limit(limit)
      .lean();
      
      return studios.map(studio => ({
        name: studio.name,
        count: studio.seriesCount
      }));
    } catch (error) {
      console.error('Error searching studios:', error);
      return [];
    }
  }
  
  // Create new studio
  async createStudio(name, description = '') {
    try {
      // Check if studio already exists
      const existing = await Studio.findOne({ 
        name: { $regex: `^${name.trim()}$`, $options: 'i' }
      });
      
      if (existing) {
        return { success: false, error: 'Studio already exists' };
      }
      
      const studio = new Studio({
        name: name.trim(),
        description: description.trim()
      });
      
      await studio.save();
      
      return { success: true, data: studio };
    } catch (error) {
      console.error('Error creating studio:', error);
      
      if (error.code === 11000) {
        return { success: false, error: 'Studio already exists' };
      }
      
      throw { success: false, error: 'Failed to create studio' };
    }
  }
  
  // Get studio by ID with populated data
  async getStudioById(id) {
    try {
      const studio = await Studio.findById(id).lean();
      
      if (!studio) {
        return { success: false, error: 'Studio not found' };
      }
      
      return { success: true, data: studio };
    } catch (error) {
      console.error('Error fetching studio:', error);
      throw { success: false, error: 'Failed to fetch studio' };
    }
  }
  
  // Update studio usage count (called when studio is used in season)
  async updateUsageCount(studioId, increment = 1) {
    try {
      await Studio.findByIdAndUpdate(
        studioId,
        { $inc: { seriesCount: increment } }
      );
    } catch (error) {
      console.error('Error updating studio usage:', error);
    }
  }
  
  // Find or create studio by name (for autocomplete workflow)
  async findOrCreateStudio(name) {
    try {
      let studio = await Studio.findOne({ 
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
        isActive: true 
      });
      
      if (!studio) {
        studio = new Studio({ name: name.trim() });
        await studio.save();
      }
      
      return { success: true, data: studio };
    } catch (error) {
      console.error('Error finding/creating studio:', error);
      throw { success: false, error: 'Failed to process studio' };
    }
  }
}

module.exports = new StudioService();
