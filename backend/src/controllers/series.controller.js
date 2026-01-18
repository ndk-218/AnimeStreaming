const seriesService = require('../services/series.service');
const ImageService = require('../services/image.service');
const Series = require('../models/Series');
const adminNotificationService = require('../services/adminNotification.service');

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

  // GET /api/series/search - Public endpoint for searching series
  async searchSeriesPublic(req, res) {
    try {
      const { q: searchTerm, limit = 10 } = req.query;

      if (!searchTerm || searchTerm.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Search term is required'
        });
      }

      const series = await seriesService.searchSeriesWithLatestSeason(
        searchTerm.trim(), 
        parseInt(limit)
      );

      res.json({
        success: true,
        data: series,
        count: series.length,
        searchTerm: searchTerm.trim()
      });

    } catch (error) {
      console.error('❌ Search series error:', error.message);
      
      res.status(500).json({
        success: false,
        error: error.message
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
        // Cleanup uploaded file if validation fails
        if (req.file?.path) {
          await ImageService.deleteImage(req.file.path);
        }
        return res.status(400).json({
          success: false,
          error: 'Title and release year are required'
        });
      }

      // Create series first
      const result = await seriesService.createSeries(seriesData);
      
      if (!result.success) {
        // Cleanup uploaded file if series creation fails
        if (req.file?.path) {
          await ImageService.deleteImage(req.file.path);
        }
        return res.status(400).json(result);
      }

      // Process banner image if uploaded
      if (req.file) {
        try {
          console.log(`📤 Processing banner for new series: ${result.data._id}`);
          console.log(`   File: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);
          
          // Validate image file
          const validation = ImageService.validateImageFile(req.file, 10);
          if (!validation.valid) {
            await ImageService.deleteImage(req.file.path);
            console.warn(`⚠️ Banner validation failed: ${validation.error}`);
          } else {
            // Process and save banner image
            const bannerPath = await ImageService.processSeriesBanner(
              req.file.path,
              result.data._id
            );
            
            // Update series with banner path
            const updatedSeries = await Series.findById(result.data._id);
            updatedSeries.bannerImage = bannerPath;
            await updatedSeries.save();
            
            result.data.bannerImage = bannerPath;
            console.log(`✅ Banner uploaded successfully: ${bannerPath}`);
          }
        } catch (bannerError) {
          console.error('❌ Banner upload error (non-fatal):', bannerError.message);
          // Continue even if banner upload fails
        }
      }

      res.status(201).json(result);
      
      // Create admin notification
      try {
        await adminNotificationService.createActivityNotification({
          adminId: req.admin._id,
          adminName: req.admin.displayName,
          action: 'updated',
          entityType: 'series',
          entityId: result.data._id,
          seriesName: result.data.title
          // NOTE: No image - populated from series.bannerImage/posterImage
        });
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }
    } catch (error) {
      console.error('Create series error:', error);
      
      // Cleanup uploaded file on error
      if (req.file?.path) {
        await ImageService.deleteImage(req.file.path);
      }
      
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
      
      // Create admin notification
      try {
        await adminNotificationService.createActivityNotification({
          adminId: req.admin._id,
          adminName: req.admin.displayName,
          action: 'updated',
          entityType: 'series',
          entityId: result.data._id,
          seriesName: result.data.title
          // NOTE: No image - populated from series.bannerImage/posterImage
        });
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }
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
      // Create admin notification (trước khi xóa để lấy thông tin)
      try {
        const series = await Series.findById(id);
        if (series) {
          await adminNotificationService.createActivityNotification({
            adminId: req.admin._id,
            adminName: req.admin.displayName,
            action: 'deleted',
            entityType: 'series',
            entityId: null, // Đã xóa rồi
            seriesName: series.title
            // NOTE: No image for deleted items
          });
        }
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }
      
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
