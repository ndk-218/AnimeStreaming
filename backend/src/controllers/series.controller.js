// @ts-nocheck
const SeriesService = require('../services/series.service');

/**
 * ===== SERIES CONTROLLER - JAVASCRIPT VERSION =====
 * Quản lý anime series (bước đầu tiên trong workflow)
 */

/**
 * Tạo series mới (chỉ admin)
 * POST /admin/series
 */
const createSeries = async (req, res) => {
  try {
    const { 
      title, 
      originalTitle, 
      description, 
      releaseYear, 
      status, 
      genres, 
      studio, 
      posterImage, 
      bannerImage 
    } = req.body;

    // Validate dữ liệu đầu vào
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    const seriesData = {
      title: title.trim(),
      originalTitle: originalTitle ? originalTitle.trim() : '',
      description: description || '',
      releaseYear: releaseYear ? parseInt(releaseYear) : null,
      status: status || 'upcoming',
      genres: Array.isArray(genres) ? genres : [],
      studio: studio ? studio.trim() : '',
      posterImage: posterImage || '',
      bannerImage: bannerImage || ''
    };

    const series = await SeriesService.createSeries(seriesData);

    res.status(201).json({
      success: true,
      data: series,
      message: 'Series created successfully'
    });

  } catch (error) {
    console.error('❌ Create series error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy series theo ID với full details
 * GET /series/:id
 */
const getSeriesById = async (req, res) => {
  try {
    const series = await SeriesService.getSeriesWithDetails(req.params.id);

    if (!series) {
      return res.status(404).json({
        success: false,
        error: 'Series not found'
      });
    }

    // Tăng view count
    await SeriesService.incrementViewCount(req.params.id);

    res.json({
      success: true,
      data: series
    });

  } catch (error) {
    console.error('❌ Get series error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy series theo slug
 * GET /series/slug/:slug
 */
const getSeriesBySlug = async (req, res) => {
  try {
    const series = await SeriesService.getSeriesBySlug(req.params.slug);

    if (!series) {
      return res.status(404).json({
        success: false,
        error: 'Series not found'
      });
    }

    // Tăng view count
    await SeriesService.incrementViewCount(series._id);

    res.json({
      success: true,
      data: series
    });

  } catch (error) {
    console.error('❌ Get series by slug error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy danh sách series với filtering và pagination
 * GET /series
 */
const getSeriesList = async (req, res) => {
  try {
    const {
      search = '',
      genres = '',
      status = '',
      studio = '',
      year = '',
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      search: search.trim(),
      genres: genres ? genres.split(',').map(g => g.trim()) : [],
      status: status.trim(),
      studio: studio.trim(),
      year: year ? parseInt(year) : null,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: sortBy.trim() || 'createdAt',
      sortOrder: sortOrder.trim() || 'desc'
    };

    const result = await SeriesService.getSeriesList(options);

    res.json({
      success: true,
      data: result.series,
      pagination: result.pagination,
      filters: {
        search: options.search,
        genres: options.genres,
        status: options.status,
        studio: options.studio,
        year: options.year
      }
    });

  } catch (error) {
    console.error('❌ Get series list error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Cập nhật series (chỉ admin)
 * PUT /admin/series/:id
 */
const updateSeries = async (req, res) => {
  try {
    const updateData = req.body;

    const series = await SeriesService.updateSeries(req.params.id, updateData);

    if (!series) {
      return res.status(404).json({
        success: false,
        error: 'Series not found'
      });
    }

    res.json({
      success: true,
      data: series,
      message: 'Series updated successfully'
    });

  } catch (error) {
    console.error('❌ Update series error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Xóa series (chỉ admin)
 * DELETE /admin/series/:id
 */
const deleteSeries = async (req, res) => {
  try {
    const success = await SeriesService.deleteSeries(req.params.id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Series not found or could not be deleted'
      });
    }

    res.json({
      success: true,
      message: 'Series deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete series error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy series trending
 * GET /series/trending
 */
const getTrendingSeries = async (req, res) => {
  try {
    const { limit = '10' } = req.query;

    const series = await SeriesService.getTrendingSeries(parseInt(limit));

    res.json({
      success: true,
      data: series,
      count: series.length
    });

  } catch (error) {
    console.error('❌ Get trending series error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy series mới nhất
 * GET /series/latest
 */
const getLatestSeries = async (req, res) => {
  try {
    const { limit = '10' } = req.query;

    const series = await SeriesService.getLatestSeries(parseInt(limit));

    res.json({
      success: true,
      data: series,
      count: series.length
    });

  } catch (error) {
    console.error('❌ Get latest series error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy series theo genre
 * GET /series/genre/:genre
 */
const getSeriesByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    const { limit = '20' } = req.query;

    const series = await SeriesService.getSeriesByGenre(genre, parseInt(limit));

    res.json({
      success: true,
      data: series,
      count: series.length,
      genre: genre
    });

  } catch (error) {
    console.error('❌ Get series by genre error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy tất cả genres có sẵn
 * GET /genres
 */
const getAllGenres = async (req, res) => {
  try {
    const genres = await SeriesService.getAllGenres();

    res.json({
      success: true,
      data: genres,
      count: genres.length
    });

  } catch (error) {
    console.error('❌ Get all genres error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy tất cả studios có sẵn
 * GET /studios
 */
const getAllStudios = async (req, res) => {
  try {
    const studios = await SeriesService.getAllStudios();

    res.json({
      success: true,
      data: studios,
      count: studios.length
    });

  } catch (error) {
    console.error('❌ Get all studios error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Tìm kiếm series
 * GET /series/search?q=term
 */
const searchSeries = async (req, res) => {
  try {
    const { q: searchTerm, limit = '20' } = req.query;

    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search term is required'
      });
    }

    // Sử dụng getSeriesList với search parameter
    const options = {
      search: searchTerm.trim(),
      limit: parseInt(limit),
      page: 1
    };

    const result = await SeriesService.getSeriesList(options);

    res.json({
      success: true,
      data: result.series,
      count: result.series.length,
      searchTerm: searchTerm.trim()
    });

  } catch (error) {
    console.error('❌ Search series error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy search suggestions cho autocomplete
 * GET /series/suggestions?q=term
 */
const getSearchSuggestions = async (req, res) => {
  try {
    const { q: searchTerm, limit = '5' } = req.query;

    if (!searchTerm || searchTerm.trim() === '') {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }

    const suggestions = await SeriesService.getSearchSuggestions(
      searchTerm.trim(), 
      parseInt(limit)
    );

    res.json({
      success: true,
      data: suggestions,
      count: suggestions.length
    });

  } catch (error) {
    console.error('❌ Get search suggestions error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy thống kê series (chỉ admin)
 * GET /admin/series/stats
 */
const getSeriesStats = async (req, res) => {
  try {
    const stats = await SeriesService.getSeriesStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Get series stats error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createSeries,
  getSeriesById,
  getSeriesBySlug,
  getSeriesList,
  updateSeries,
  deleteSeries,
  getTrendingSeries,
  getLatestSeries,
  getSeriesByGenre,
  getAllGenres,
  getAllStudios,
  searchSeries,
  getSearchSuggestions,
  getSeriesStats
};