// @ts-nocheck
const SeasonService = require('../services/season.service');
const ImageService = require('../services/image.service');
const Season = require('../models/Season');
const adminNotificationService = require('../services/adminNotification.service');

/**
 * ===== SEASONS CONTROLLER - JAVASCRIPT VERSION =====
 * Workflow: Series → Season → Episode upload
 */

/**
 * Tạo season mới trong series
 * POST /admin/seasons
 */
const createSeason = async (req, res) => {
  try {
    const { 
      seriesId, 
      title, 
      seasonNumber, 
      seasonType, 
      releaseYear, 
      description, 
      status,
      studios,  // Array of studio names
      genres,   // Array of genre names
      isUpscaled  // Boolean - episodes sẽ được upscale
    } = req.body;

    // Validate dữ liệu đầu vào
    if (!seriesId || !seasonType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: seriesId, seasonType'
      });
    }

    // Validate studios và genres
    if (!studios || !Array.isArray(studios) || studios.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one studio is required'
      });
    }

    if (!genres || !Array.isArray(genres) || genres.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one genre is required'
      });
    }

    // Validate season data
    const validation = SeasonService.validateSeasonData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    let finalSeasonNumber = seasonNumber;
    let finalTitle = title;

    // Auto-generate season number nếu không có
    if (!seasonNumber) {
      finalSeasonNumber = await SeasonService.getNextSeasonNumber(seriesId, seasonType);
    }

    // Auto-generate title nếu không có
    if (!title) {
      finalTitle = SeasonService.generateSeasonTitle(seasonType, finalSeasonNumber);
    }

    const seasonData = {
      seriesId,
      title: finalTitle,
      seasonNumber: parseInt(finalSeasonNumber),
      seasonType: seasonType,
      releaseYear: releaseYear ? parseInt(releaseYear) : (seasonType === 'movie' ? finalSeasonNumber : null),
      description: description || '',
      status: status || 'upcoming',
      studios: studios,  // Pass studios array
      genres: genres,    // Pass genres array
      isUpscaled: isUpscaled === true || isUpscaled === 'true'  // Convert to boolean
    };

    const season = await SeasonService.createSeason(seasonData);

    // Populate seriesId to get series title for notification
    await season.populate('seriesId', 'title');

    res.status(201).json({
      success: true,
      data: season,
      message: `${seasonType.toUpperCase()} created successfully`
    });
    
    // Create admin notification
    try {
      await adminNotificationService.createActivityNotification({
        adminId: req.admin._id,
        adminName: req.admin.displayName,
        action: 'updated',
        entityType: 'season',
        entityId: season._id,
        seriesName: season.seriesId?.title || 'Unknown Series',
        seasonTitle: season.title
        // NOTE: No image - populated from season.posterImage
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

  } catch (error) {
    console.error('❌ Create season error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy season theo ID với episodes
 * GET /seasons/:id
 */
const getSeasonById = async (req, res) => {
  try {
    const { includeProcessing = 'false' } = req.query;
    const onlyCompleted = includeProcessing !== 'true';

    const season = await SeasonService.getSeasonWithEpisodes(req.params.id, onlyCompleted);

    if (!season) {
      return res.status(404).json({
        success: false,
        error: 'Season not found'
      });
    }

    res.json({
      success: true,
      data: season
    });

  } catch (error) {
    console.error('❌ Get season error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy tất cả seasons trong một series
 * GET /series/:seriesId/seasons
 */
const getSeasonsBySeries = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { includeEpisodes = 'false' } = req.query;

    const seasons = await SeasonService.getSeasonsBySeries(
      seriesId, 
      includeEpisodes === 'true'
    );

    res.json({
      success: true,
      data: seasons,
      count: seasons.length
    });

  } catch (error) {
    console.error('❌ Get seasons by series error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Cập nhật thông tin season (chỉ admin)
 * PUT /admin/seasons/:id
 */
const updateSeason = async (req, res) => {
  try {
    const updateData = req.body;

    const season = await SeasonService.updateSeason(req.params.id, updateData);

    if (!season) {
      return res.status(404).json({
        success: false,
        error: 'Season not found'
      });
    }

    // Populate seriesId to get series title for notification
    await season.populate('seriesId', 'title');

    res.json({
      success: true,
      data: season,
      message: 'Season updated successfully'
    });
    
    // Create admin notification
    try {
      await adminNotificationService.createActivityNotification({
        adminId: req.admin._id,
        adminName: req.admin.displayName,
        action: 'updated',
        entityType: 'season',
        entityId: season._id,
        seriesName: season.seriesId?.title || 'Unknown Series',
        seasonTitle: season.title
        // NOTE: No image - populated from season.posterImage
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

  } catch (error) {
    console.error('❌ Update season error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Xóa season (chỉ admin)
 * DELETE /admin/seasons/:id
 */
const deleteSeason = async (req, res) => {
  try {
    // Get season info before deleting
    const season = await Season.findById(req.params.id).populate('seriesId');
    
    if (!season) {
      return res.status(404).json({
        success: false,
        error: 'Season not found'
      });
    }
    
    const success = await SeasonService.deleteSeason(req.params.id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Season not found or could not be deleted'
      });
    }

    res.json({
      success: true,
      message: 'Season deleted successfully'
    });
    
    // Create admin notification (after successful delete)
    try {
      await adminNotificationService.createActivityNotification({
        adminId: req.admin._id,
        adminName: req.admin.displayName,
        action: 'deleted',
        entityType: 'season',
        entityId: null, // Already deleted
        seriesName: season.seriesId?.title || 'Unknown Series',
        seasonTitle: season.title
        // NOTE: No image for deleted items
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

  } catch (error) {
    console.error('❌ Delete season error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy seasons theo type (tv, movie, ova, special)
 * GET /series/:seriesId/seasons/type/:seasonType
 */
const getSeasonsByType = async (req, res) => {
  try {
    const { seriesId, seasonType } = req.params;

    const seasons = await SeasonService.getSeasonsByType(seriesId, seasonType);

    res.json({
      success: true,
      data: seasons,
      count: seasons.length,
      seasonType: seasonType
    });

  } catch (error) {
    console.error('❌ Get seasons by type error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Tìm kiếm seasons
 * GET /seasons/search?q=term
 */
const searchSeasons = async (req, res) => {
  try {
    const { q: searchTerm, limit = 20 } = req.query;

    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search term is required'
      });
    }

    const seasons = await SeasonService.searchSeasons(searchTerm.trim(), parseInt(limit));

    res.json({
      success: true,
      data: seasons,
      count: seasons.length,
      searchTerm: searchTerm.trim()
    });

  } catch (error) {
    console.error('❌ Search seasons error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy seasons gần đây
 * GET /seasons/recent
 */
const getRecentSeasons = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const seasons = await SeasonService.getRecentSeasons(parseInt(limit));

    res.json({
      success: true,
      data: seasons,
      count: seasons.length
    });

  } catch (error) {
    console.error('❌ Get recent seasons error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy thống kê seasons (chỉ admin)
 * GET /admin/seasons/stats
 */
const getSeasonStats = async (req, res) => {
  try {
    const stats = await SeasonService.getSeasonStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Get season stats error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy season theo series và season number
 * GET /series/:seriesId/seasons/number/:seasonNumber
 */
const getSeasonByNumber = async (req, res) => {
  try {
    const { seriesId, seasonNumber } = req.params;

    const season = await SeasonService.getSeasonByNumber(seriesId, parseInt(seasonNumber));

    if (!season) {
      return res.status(404).json({
        success: false,
        error: 'Season not found'
      });
    }

    res.json({
      success: true,
      data: season
    });

  } catch (error) {
    console.error('❌ Get season by number error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Cập nhật episode count cho season (internal use)
 * PUT /admin/seasons/:id/episode-count
 */
const updateEpisodeCount = async (req, res) => {
  try {
    const season = await SeasonService.updateEpisodeCount(req.params.id);

    if (!season) {
      return res.status(404).json({
        success: false,
        error: 'Season not found'
      });
    }

    res.json({
      success: true,
      data: season,
      message: 'Episode count updated successfully'
    });

  } catch (error) {
    console.error('❌ Update episode count error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getMoviesBySeries = async (req, res) => {
  try {
    const { seriesId } = req.params;

    const movies = await SeasonService.getMoviesBySeries(seriesId);

    res.json({
      success: true,
      data: movies,
      count: movies.length
    });

  } catch (error) {
    console.error('❌ Get movies by series error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Suggest next season number cho type cụ thể
 * GET /admin/series/:seriesId/seasons/next-number?type=tv|movie|ova|special
 */
const getNextSeasonNumber = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { type = 'tv' } = req.query;

    const nextNumber = await SeasonService.getNextSeasonNumber(seriesId, type);
    const suggestedTitle = SeasonService.generateSeasonTitle(type, nextNumber);

    res.json({
      success: true,
      data: {
        nextSeasonNumber: nextNumber,
        suggestedTitle: suggestedTitle,
        seasonType: type
      }
    });

  } catch (error) {
    console.error('❌ Get next season number error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Upload season poster image
 * PUT /admin/seasons/:id/poster
 */
const uploadPoster = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate file uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No poster image provided'
      });
    }

    console.log(`📤 Uploading poster for season: ${id}`);
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
    
    // Get existing season
    const season = await Season.findById(id);
    if (!season) {
      await ImageService.deleteImage(req.file.path); // Cleanup
      return res.status(404).json({
        success: false,
        error: 'Season not found'
      });
    }
    
    // ✅ FIXED: Delete old poster BEFORE processing new one
    if (season.posterImage) {
      await ImageService.deleteImage(season.posterImage);
    }
    
    // Process and save NEW poster image
    const posterPath = await ImageService.processSeasonPoster(
      req.file.path,
      id
    );
    
    // Update database
    season.posterImage = posterPath;
    await season.save();
    
    console.log(`✅ Poster uploaded successfully: ${posterPath}`);
    
    res.json({
      success: true,
      data: {
        posterImage: posterPath,
        posterUrl: `/${posterPath}` // For frontend display
      },
      message: 'Poster uploaded successfully'
    });
    
  } catch (error) {
    console.error('❌ Poster upload error:', error.message);
    
    // Cleanup temp file if exists
    if (req.file?.path) {
      await ImageService.deleteImage(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload poster image'
    });
  }
};

/**
 * Lấy top seasons hot (100 ngày gần nhất)
 * GET /api/content/top-seasons?limit=5
 */
const getTopSeasons = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const seasons = await SeasonService.getTopSeasons(parseInt(limit));

    res.json({
      success: true,
      data: seasons,
      count: seasons.length
    });

  } catch (error) {
    console.error('❌ Get top seasons error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy trending genres: Top 3 genres với tổng views cao nhất
 * Mỗi genre trả về top 5 seasons có nhiều views nhất
 * GET /api/seasons/trending-genres
 */
const getTrendingGenres = async (req, res) => {
  try {
    const trendingGenres = await SeasonService.getTrendingGenres();

    res.json({
      success: true,
      data: trendingGenres,
      count: trendingGenres.length
    });

  } catch (error) {
    console.error('❌ Get trending genres error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Advanced Search Seasons với filters
 * GET /api/seasons/advanced-search?seasonTypes=tv,movie&genres=Action&studios=Mappa&yearStart=2020&yearEnd=2025&excludeYears=2022,2024&sortBy=title&page=1&limit=24
 */
const advancedSearchSeasons = async (req, res) => {
  try {
    const {
      seasonTypes,  // "tv,movie,ova" -> ['tv', 'movie', 'ova']
      genres,       // "Action,Adventure" -> ['Action', 'Adventure']
      studios,      // "Mappa,Toei" -> ['Mappa', 'Toei']
      yearStart,
      yearEnd,
      excludeYears, // "2022,2024" -> ['2022', '2024']
      sortBy = 'updatedAt', // 'title' | 'year' | 'updatedAt'
      page = 1,
      limit = 24
    } = req.query;

    // Parse comma-separated values
    const filters = {
      seasonTypes: seasonTypes ? seasonTypes.split(',').map(s => s.trim()) : [],
      genres: genres ? genres.split(',').map(g => g.trim()) : [],
      studios: studios ? studios.split(',').map(s => s.trim()) : [],
      yearStart: yearStart ? parseInt(yearStart) : null,
      yearEnd: yearEnd ? parseInt(yearEnd) : null,
      excludeYears: excludeYears ? excludeYears.split(',').map(y => y.trim()) : [],
      sortBy: sortBy, // Pass sortBy to service
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await SeasonService.advancedSearchSeasons(filters);

    res.json({
      success: true,
      data: result.seasons,
      pagination: result.pagination,
      filters: filters
    });

  } catch (error) {
    console.error('❌ Advanced search error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createSeason,
  getSeasonById,
  getSeasonsBySeries,
  updateSeason,
  deleteSeason,
  getSeasonsByType,
  searchSeasons,
  getRecentSeasons,
  getSeasonStats,
  getSeasonByNumber,
  updateEpisodeCount,
  getMoviesBySeries,        
  getNextSeasonNumber,
  uploadPoster,
  getTopSeasons,
  getTrendingGenres,
  advancedSearchSeasons
};