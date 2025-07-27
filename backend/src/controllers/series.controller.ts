import { Request, Response } from 'express';
import { SeriesService } from '../services/series.service';

/**
 * Create new series
 */
export const createSeries = async (req: Request, res: Response) => {
  try {
    const series = await SeriesService.createSeries(req.body);
    
    res.status(201).json({
      success: true,
      data: series
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all series with pagination and filters
 */
export const getAllSeries = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      search,
      genres,
      status,
      year,
      studio
    } = req.query;
    
    const filters = {
      search: search as string,
      genres: genres ? (genres as string).split(',') : undefined,
      status: status as 'ongoing' | 'completed' | 'upcoming',
      year: year ? parseInt(year as string) : undefined,
      studio: studio as string
    };
    
    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: sort as string
    };
    
    const result = await SeriesService.searchSeries(filters, pagination);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get series by ID
 */
export const getSeriesById = async (req: Request, res: Response) => {
  try {
    const series = await SeriesService.getSeriesWithDetails(req.params.id);
    
    if (!series) {
      return res.status(404).json({
        success: false,
        error: 'Series not found'
      });
    }
    
    res.json({
      success: true,
      data: series
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get series by slug
 */
export const getSeriesBySlug = async (req: Request, res: Response) => {
  try {
    const series = await SeriesService.getSeriesBySlug(req.params.slug);
    
    if (!series) {
      return res.status(404).json({
        success: false,
        error: 'Series not found'
      });
    }
    
    // Increment view count
    await series.incrementViewCount();
    
    res.json({
      success: true,
      data: series
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update series
 */
export const updateSeries = async (req: Request, res: Response) => {
  try {
    const series = await SeriesService.updateSeries(req.params.id, req.body);
    
    if (!series) {
      return res.status(404).json({
        success: false,
        error: 'Series not found'
      });
    }
    
    res.json({
      success: true,
      data: series
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete series
 */
export const deleteSeries = async (req: Request, res: Response) => {
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
      message: 'Series and all related content deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get popular series
 */
export const getPopularSeries = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const series = await SeriesService.getPopularSeries(limit);
    
    res.json({
      success: true,
      data: series
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get recently updated series
 */
export const getRecentlyUpdated = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const series = await SeriesService.getRecentlyUpdated(limit);
    
    res.json({
      success: true,
      data: series
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get series by genre
 */
export const getSeriesByGenre = async (req: Request, res: Response) => {
  try {
    const { genre } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const series = await SeriesService.getSeriesByGenre(genre, limit);
    
    res.json({
      success: true,
      data: series,
      genre
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};