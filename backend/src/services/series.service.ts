import Series from '../models/Series';
import Season from '../models/Season';
import Episode from '../models/Episode';
import { ISeriesDocument, ISeriesInput, ISeriesFilters } from '../types/series.types';
import slugify from 'slugify';
import { FilterQuery } from 'mongoose';

interface SeriesFilters {
  search?: string;
  genres?: string[];
  status?: 'ongoing' | 'completed' | 'upcoming';
  year?: number;
  studio?: string;
}

interface PaginationOptions {
  page: number;
  limit: number;
  sort?: string;
}

export class SeriesService {
  /**
   * Tạo series mới với unique slug generation
   */
  static async createSeries(data: Partial<ISeries>): Promise<ISeries> {
    if (!data.title) {
      throw new Error('Title is required');
    }

    // Generate unique slug
    const baseSlug = slugify(data.title, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g 
    });
    
    let slug = baseSlug;
    let counter = 0;
    
    // Ensure slug uniqueness
    while (await Series.findOne({ slug })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
    
    return Series.create({
      ...data,
      slug
    });
  }

  /**
   * Get series với full details
   */
  static async getSeriesWithDetails(seriesId: string): Promise<ISeries | null> {
    const series = await Series.findById(seriesId)
      .populate({
        path: 'seasons',
        options: { sort: { seasonNumber: 1 } },
        populate: {
          path: 'episodes',
          select: 'episodeNumber title duration thumbnail processingStatus',
          options: { sort: { episodeNumber: 1 } }
        }
      });
      
    return series;
  }

  /**
   * Get series by slug với details
   */
  static async getSeriesBySlug(slug: string): Promise<ISeries | null> {
    const series = await Series.findOne({ slug })
      .populate({
        path: 'seasons',
        options: { sort: { seasonNumber: 1 } },
        populate: {
          path: 'episodes',
          match: { processingStatus: 'completed' }, // Only show processed episodes
          select: 'episodeNumber title duration thumbnail',
          options: { sort: { episodeNumber: 1 } }
        }
      });
      
    return series;
  }

  /**
   * Update series và recalculate stats
   */
  static async updateSeries(
    seriesId: string, 
    updateData: Partial<ISeries>
  ): Promise<ISeries | null> {
    // If title changes, update slug
    if (updateData.title) {
      const series = await Series.findById(seriesId);
      if (series && series.title !== updateData.title) {
        updateData.slug = await this.generateUniqueSlug(updateData.title, seriesId);
      }
    }
    
    const updatedSeries = await Series.findByIdAndUpdate(
      seriesId,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Update stats after changes
    if (updatedSeries) {
      await this.updateSeriesStats(seriesId);
    }
    
    return updatedSeries;
  }

  /**
   * Update series statistics
   */
  static async updateSeriesStats(seriesId: string): Promise<void> {
    const [seasonCount, episodeCount] = await Promise.all([
      Season.countDocuments({ seriesId }),
      Episode.countDocuments({ seriesId, processingStatus: 'completed' })
    ]);
    
    await Series.findByIdAndUpdate(seriesId, {
      'stats.totalSeasons': seasonCount,
      'stats.totalEpisodes': episodeCount
    });
  }

  /**
   * Search và filter series với pagination
   */
  static async searchSeries(
    filters: SeriesFilters, 
    pagination: PaginationOptions
  ) {
    const query: FilterQuery<ISeries> = {};
    
    // Text search
    if (filters.search) {
      query.$text = { $search: filters.search };
    }
    
    // Genre filter
    if (filters.genres && filters.genres.length > 0) {
      query.genres = { $in: filters.genres };
    }
    
    // Status filter
    if (filters.status) {
      query.status = filters.status;
    }
    
    // Year filter
    if (filters.year) {
      query.releaseYear = filters.year;
    }
    
    // Studio filter
    if (filters.studio) {
      query.studio = new RegExp(filters.studio, 'i');
    }
    
    // Calculate skip
    const skip = (pagination.page - 1) * pagination.limit;
    
    // Default sort
    const sortOptions = this.parseSortString(pagination.sort || '-createdAt');
    
    // Execute queries
    const [series, total] = await Promise.all([
      Series.find(query)
        .sort(sortOptions)
        .limit(pagination.limit)
        .skip(skip)
        .select('-__v'),
      Series.countDocuments(query)
    ]);
    
    return {
      series,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(total / pagination.limit)
      }
    };
  }

  /**
   * Get popular series
   */
  static async getPopularSeries(limit: number = 10): Promise<ISeries[]> {
    return Series.find({ status: { $ne: 'upcoming' } })
      .sort('-stats.viewCount -stats.averageRating')
      .limit(limit)
      .select('-__v');
  }

  /**
   * Get recently updated series
   */
  static async getRecentlyUpdated(limit: number = 10): Promise<ISeries[]> {
    return Series.find()
      .sort('-updatedAt')
      .limit(limit)
      .select('-__v');
  }

  /**
   * Get series by genre
   */
  static async getSeriesByGenre(
    genre: string, 
    limit: number = 20
  ): Promise<ISeries[]> {
    return Series.find({ genres: genre })
      .sort('-stats.averageRating -stats.viewCount')
      .limit(limit)
      .select('-__v');
  }

  /**
   * Delete series và cleanup related data
   */
  static async deleteSeries(seriesId: string): Promise<boolean> {
    // Delete trong transaction để đảm bảo consistency
    const session = await Series.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Delete all episodes
        await Episode.deleteMany({ seriesId }).session(session);
        
        // Delete all seasons
        await Season.deleteMany({ seriesId }).session(session);
        
        // Delete series
        await Series.findByIdAndDelete(seriesId).session(session);
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting series:', error);
      return false;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Helper: Generate unique slug
   */
  private static async generateUniqueSlug(
    title: string, 
    excludeId?: string
  ): Promise<string> {
    const baseSlug = slugify(title, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g 
    });
    
    let slug = baseSlug;
    let counter = 0;
    
    while (true) {
      const existing = await Series.findOne({ 
        slug,
        ...(excludeId && { _id: { $ne: excludeId } })
      });
      
      if (!existing) break;
      
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
    
    return slug;
  }

  /**
   * Helper: Parse sort string to MongoDB sort object
   */
  private static parseSortString(sortString: string): any {
    const sortObject: any = {};
    const parts = sortString.split(',');
    
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.startsWith('-')) {
        sortObject[trimmed.substring(1)] = -1;
      } else {
        sortObject[trimmed] = 1;
      }
    });
    
    return sortObject;
  }
}