const studioService = require('../services/studio.service');
const genreService = require('../services/genre.service');

class ContentController {
  // ========== STUDIO ENDPOINTS ==========
  
  // GET /api/admin/studios/search?q=keyword&limit=5
  async searchStudios(req, res) {
    try {
      const { q: query, limit = 5 } = req.query;
      
      if (!query || query.trim().length < 1) {
        return res.json({ success: true, data: [] });
      }
      
      const studios = await studioService.searchStudios(query.trim(), parseInt(limit));
      
      res.json({ success: true, data: studios });
    } catch (error) {
      console.error('Search studios error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to search studios' 
      });
    }
  }
  
  // GET /api/admin/studios
  async getStudios(req, res) {
    try {
      const { search = '', limit = 50, page = 1 } = req.query;
      
      const result = await studioService.getStudios(search, parseInt(limit), parseInt(page));
      
      res.json(result);
    } catch (error) {
      console.error('Get studios error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.error || 'Failed to fetch studios' 
      });
    }
  }
  
  // POST /api/admin/studios
  async createStudio(req, res) {
    try {
      const { name, description } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Studio name is required' 
        });
      }
      
      const result = await studioService.createStudio(name.trim(), description?.trim());
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Create studio error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.error || 'Failed to create studio' 
      });
    }
  }
  
  // GET /api/admin/studios/:id
  async getStudioById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await studioService.getStudioById(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Get studio error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch studio' 
      });
    }
  }
  
  // ========== GENRE ENDPOINTS ==========
  
  // GET /api/admin/genres/search?q=keyword&limit=5
  async searchGenres(req, res) {
    try {
      const { q: query, limit = 5 } = req.query;
      
      if (!query || query.trim().length < 1) {
        return res.json({ success: true, data: [] });
      }
      
      const genres = await genreService.searchGenres(query.trim(), parseInt(limit));
      
      res.json({ success: true, data: genres });
    } catch (error) {
      console.error('Search genres error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to search genres' 
      });
    }
  }
  
  // GET /api/admin/genres
  async getGenres(req, res) {
    try {
      const { search = '', limit = 50, page = 1 } = req.query;
      
      const result = await genreService.getGenres(search, parseInt(limit), parseInt(page));
      
      res.json(result);
    } catch (error) {
      console.error('Get genres error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.error || 'Failed to fetch genres' 
      });
    }
  }
  
  // POST /api/admin/genres
  async createGenre(req, res) {
    try {
      const { name, description } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Genre name is required' 
        });
      }
      
      const result = await genreService.createGenre(name.trim(), description?.trim());
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Create genre error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.error || 'Failed to create genre' 
      });
    }
  }
  
  // GET /api/admin/genres/:id
  async getGenreById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await genreService.getGenreById(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Get genre error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch genre' 
      });
    }
  }

  // ========== TRENDING & TOP CONTENT ENDPOINTS (PUBLIC) ==========
  
  // GET /api/content/trending-genres?genreLimit=3&seasonLimit=5
  async getTrendingGenres(req, res) {
    try {
      const { genreLimit = 3, seasonLimit = 5 } = req.query;
      
      const result = await genreService.getTrendingGenresWithSeasons(
        parseInt(genreLimit),
        parseInt(seasonLimit)
      );
      
      res.json(result);
    } catch (error) {
      console.error('Get trending genres error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.error || 'Failed to fetch trending genres' 
      });
    }
  }

  // GET /api/content/top-genres?limit=5
  async getTopGenres(req, res) {
    try {
      const { limit = 5 } = req.query;
      
      const result = await genreService.getTopGenres(parseInt(limit));
      
      res.json(result);
    } catch (error) {
      console.error('Get top genres error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.error || 'Failed to fetch top genres' 
      });
    }
  }
}

module.exports = new ContentController();
