const seriesService = require('../services/series.service');
const ImageService = require('../services/image.service');
const Series = require('../models/Series');
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

// POST /api/admin/series/:id/banner - Upload series banner image
async uploadBanner(req, res) {
  try {
    const { id } = req.params;
    
    // Validate file uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No banner image provided'
      });
    }

    console.log(`📤 Uploading banner for series: ${id}`);
    console.log(`   File: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // Validate image file
    const validation = ImageService.validateImageFile(req.file, 10);
    if (!validation.valid) {
      await ImageService.deleteImage(req.file.path); // Cleanup
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }
    
    // Get existing series
    const series = await Series.findById(id);
    if (!series) {
      await ImageService.deleteImage(req.file.path); // Cleanup
      return res.status(404).json({
        success: false,
        error: 'Series not found'
      });
    }
    
    // Delete old banner if exists (BEFORE processing new one)
    if (series.bannerImage) {
      await ImageService.deleteImage(series.bannerImage);
    }
    
    // Process and save NEW banner image
    const bannerPath = await ImageService.processSeriesBanner(
      req.file.path,
      id
    );
    
    // Update database
    series.bannerImage = bannerPath;
    await series.save();
    
    console.log(`✅ Banner uploaded successfully: ${bannerPath}`);
    
    res.json({
      success: true,
      data: {
        bannerImage: bannerPath,
        bannerUrl: `/${bannerPath}` // For frontend display
      },
      message: 'Banner uploaded successfully'
    });
    
  } catch (error) {
    console.error('❌ Banner upload error:', error.message);
    
    // Cleanup temp file if exists
    if (req.file?.path) {
      await ImageService.deleteImage(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload banner image'
    });
  }
  }
}

module.exports = new SeriesController();
