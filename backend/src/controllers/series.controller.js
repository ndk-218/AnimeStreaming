const seriesService = require('../services/series.service');

class SeriesController {
  // GET /api/series - Public endpoint for browsing series
  async getSeries(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search || '',
        genres: req.query.genres ? req.query.genres.split(',') : [],
        status: req.query.status || '',
        studio: req.query.studio || '',
        year: req.query.year ? parseInt(req.query.year) : null,
        sort: req.query.sort || 'recent' // recent, popular, title, year
      };

      const result = await seriesService.getSeries(options);
      res.json(result);
    } catch (error) {
      console.error('Get series error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch series'
      });
    }
  }

  // GET /api/series/:slug - Public endpoint for single series
  async getSeriesBySlug(req, res) {
    try {
      const { slug } = req.params;
      const result = await seriesService.getSeriesBySlug(slug);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Get series by slug error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch series'
      });
    }
  }

  // POST /api/admin/series - Admin endpoint for creating series
  async createSeries(req, res) {
    try {
      const seriesData = {
        title: req.body.title?.trim(),
        originalTitle: req.body.originalTitle?.trim(),
        description: req.body.description?.trim(),
        releaseYear: parseInt(req.body.releaseYear),
        status: req.body.status || 'ongoing'
      };

      // Validate required fields
      if (!seriesData.title || !seriesData.releaseYear) {
        return res.status(400).json({
          success: false,
          error: 'Title and release year are required'
        });
      }

      const result = await seriesService.createSeries(seriesData);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Create series error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create series'
      });
    }
  }

  // PUT /api/admin/series/:id - Admin endpoint for updating series
  async updateSeries(req, res) {
    try {
      const { id } = req.params;
      const updates = {
        title: req.body.title?.trim(),
        originalTitle: req.body.originalTitle?.trim(),
        description: req.body.description?.trim(),
        releaseYear: req.body.releaseYear ? parseInt(req.body.releaseYear) : undefined,
        status: req.body.status
      };

      // Remove undefined values
      Object.keys(updates).forEach(key => 
        updates[key] === undefined && delete updates[key]
      );

      const result = await seriesService.updateSeries(id, updates);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Update series error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update series'
      });
    }
  }

  // DELETE /api/admin/series/:id - Admin endpoint for deleting series
  async deleteSeries(req, res) {
    try {
      const { id } = req.params;
      const result = await seriesService.deleteSeries(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Delete series error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete series'
      });
    }
  }

  // GET /api/admin/series/recent - Admin endpoint for recent series
  async getRecentSeries(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const result = await seriesService.getRecentSeries(limit);
      
      res.json(result);
    } catch (error) {
      console.error('Get recent series error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recent series'
      });
    }
  }
}

module.exports = new SeriesController();
