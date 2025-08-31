// @ts-nocheck
const SeasonService = require('../services/season.service');

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
      genres    // Array of genre names
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
      genres: genres     // Pass genres array
    };

    const season = await SeasonService.createSeason(seasonData);

    res.status(201).json({
      success: true,
      data: season,
      message: `${seasonType.toUpperCase()} created successfully`
    });

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

    res.json({
      success: true,
      data: season,
      message: 'Season updated successfully'
    });

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
  getMoviesBySeries,        // NEW
  getNextSeasonNumber       // NEW
};