import Season from '../models/Season';
import Episode from '../models/Episode';
import { ISeasonDocument, ISeasonInput } from '../types/season.types';
import { SeriesService } from './series.service';
import { Types } from 'mongoose';

interface SeasonCreateData {
  seriesId: string;
  title: string;
  seasonNumber: number;
  seasonType: 'tv' | 'movie' | 'ova' | 'special';
  releaseYear?: number;
  description?: string;
  posterImage?: string;
}

export class SeasonService {
  /**
   * Create new season
   */
  static async createSeason(data: SeasonCreateData): Promise<ISeason> {
    // Validate series exists
    const series = await SeriesService.getSeriesWithDetails(data.seriesId);
    if (!series) {
      throw new Error('Series not found');
    }
    
    // For movies, ensure only one season
    if (data.seasonType === 'movie') {
      const existingMovie = await Season.findOne({
        seriesId: data.seriesId,
        seasonType: 'movie'
      });
      
      if (existingMovie) {
        throw new Error('A movie season already exists for this series');
      }
    }
    
    // Create season
    const season = await Season.create(data);
    
    // Update series stats
    await SeriesService.updateSeriesStats(data.seriesId);
    
    return season;
  }

  /**
   * Get season with episodes
   */
  static async getSeasonWithEpisodes(seasonId: string): Promise<ISeason | null> {
    const season = await Season.findById(seasonId)
      .populate('series', 'title slug')
      .populate({
        path: 'episodes',
        match: { processingStatus: 'completed' },
        select: 'episodeNumber title duration thumbnail hlsPath subtitles',
        options: { sort: { episodeNumber: 1 } }
      });
      
    return season;
  }

  /**
   * Get all seasons for a series
   */
  static async getSeasonsBySeries(
    seriesId: string,
    includeEpisodes: boolean = false
  ): Promise<ISeason[]> {
    const query = Season.find({ seriesId }).sort('seasonNumber');
    
    if (includeEpisodes) {
      query.populate({
        path: 'episodes',
        match: { processingStatus: 'completed' },
        select: 'episodeNumber title duration thumbnail',
        options: { sort: { episodeNumber: 1 } }
      });
    }
    
    return query.exec();
  }

  /**
   * Update season
   */
  static async updateSeason(
    seasonId: string,
    updateData: Partial<ISeason>
  ): Promise<ISeason | null> {
    // Don't allow changing seriesId
    delete updateData.seriesId;
    
    const season = await Season.findByIdAndUpdate(
      seasonId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (season) {
      // Update episode count
      await this.updateEpisodeCount(seasonId);
      
      // Update series stats
      await SeriesService.updateSeriesStats(season.seriesId.toString());
    }
    
    return season;
  }

  /**
   * Update episode count for season
   */
  static async updateEpisodeCount(seasonId: string): Promise<void> {
    const count = await Episode.countDocuments({ 
      seasonId,
      processingStatus: 'completed'
    });
    
    await Season.findByIdAndUpdate(seasonId, { episodeCount: count });
  }

  /**
   * Update season status based on episodes
   */
  static async updateSeasonStatus(seasonId: string): Promise<void> {
    const season = await Season.findById(seasonId);
    if (!season) return;
    
    const episodes = await Episode.find({ seasonId });
    
    if (episodes.length === 0) {
      season.status = 'upcoming';
    } else {
      const allCompleted = episodes.every(ep => 
        ep.processingStatus === 'completed' || ep.processingStatus === 'failed'
      );
      
      if (allCompleted) {
        season.status = 'completed';
      } else {
        season.status = 'airing';
      }
    }
    
    await season.save();
  }

  /**
   * Delete season and all episodes
   */
  static async deleteSeason(seasonId: string): Promise<boolean> {
    const session = await Season.startSession();
    
    try {
      const deletedSeason = await session.withTransaction(async () => {
        // Get season info before deletion
        const season = await Season.findById(seasonId).session(session);
        if (!season) return null;
        
        // Delete all episodes
        await Episode.deleteMany({ seasonId }).session(session);
        
        // Delete season
        await Season.findByIdAndDelete(seasonId).session(session);
        
        return season;
      });
      
      // Update series stats after deletion
      if (deletedSeason) {
        await SeriesService.updateSeriesStats(deletedSeason.seriesId.toString());
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting season:', error);
      return false;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get next season number for series
   */
  static async getNextSeasonNumber(seriesId: string): Promise<number> {
    const lastSeason = await Season.findOne({ seriesId })
      .sort('-seasonNumber')
      .select('seasonNumber');
      
    return lastSeason ? lastSeason.seasonNumber + 1 : 1;
  }

  /**
   * Reorder seasons
   */
  static async reorderSeasons(
    seriesId: string,
    seasonOrder: { seasonId: string; newNumber: number }[]
  ): Promise<void> {
    const session = await Season.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Temporarily set all to negative numbers to avoid conflicts
        const seasons = await Season.find({ seriesId }).session(session);
        
        for (const season of seasons) {
          season.seasonNumber = -season.seasonNumber;
          await season.save({ session });
        }
        
        // Update to new numbers
        for (const { seasonId, newNumber } of seasonOrder) {
          await Season.findByIdAndUpdate(
            seasonId,
            { seasonNumber: newNumber },
            { session }
          );
        }
      });
    } finally {
      await session.endSession();
    }
  }
}