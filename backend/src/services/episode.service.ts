import Episode from '../models/Episode';
import { IEpisodeDocument, IEpisodeInput, ISubtitle, IProcessingUpdate } from '../types/episode.types';
import { SeasonService } from './season.service';
import { SeriesService } from './series.service';
import path from 'path';
import fs from 'fs/promises';

interface EpisodeCreateData {
  seriesId: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  description?: string;
  originalFile: string;
}

interface ProcessingUpdate {
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  hlsPath?: string;
  qualities?: Array<{ quality: string; file: string }>;
  duration?: number;
  thumbnail?: string;
}

export class EpisodeService {
  /**
   * Create new episode
   */
  static async createEpisode(data: EpisodeCreateData): Promise<IEpisode> {
    // Validate season exists
    const season = await SeasonService.getSeasonWithEpisodes(data.seasonId);
    if (!season) {
      throw new Error('Season not found');
    }
    
    // Validate series matches
    if (season.seriesId.toString() !== data.seriesId) {
      throw new Error('Season does not belong to the specified series');
    }
    
    // Create episode
    const episode = await Episode.create(data);
    
    // Update counts
    await Promise.all([
      SeasonService.updateEpisodeCount(data.seasonId),
      SeriesService.updateSeriesStats(data.seriesId)
    ]);
    
    return episode;
  }

  /**
   * Get episode with full details
   */
  static async getEpisodeWithDetails(episodeId: string): Promise<IEpisode | null> {
    const episode = await Episode.findById(episodeId)
      .populate('series', 'title slug')
      .populate('season', 'title seasonNumber');
      
    return episode;
  }

  /**
   * Get episodes by season
   */
  static async getEpisodesBySeason(
    seasonId: string,
    onlyPlayable: boolean = false
  ): Promise<IEpisode[]> {
    const query: any = { seasonId };
    
    if (onlyPlayable) {
      query.processingStatus = 'completed';
    }
    
    return Episode.find(query)
      .sort('episodeNumber')
      .select('-originalFile');
  }

  /**
   * Update episode processing status
   */
  static async updateProcessingStatus(
    episodeId: string,
    update: ProcessingUpdate
  ): Promise<IEpisode | null> {
    const episode = await Episode.findByIdAndUpdate(
      episodeId,
      update,
      { new: true }
    );
    
    if (episode && update.processingStatus === 'completed') {
      // Update season status
      await SeasonService.updateSeasonStatus(episode.seasonId.toString());
    }
    
    return episode;
  }

  /**
   * Add subtitle to episode
   */
  static async addSubtitle(
    episodeId: string,
    subtitle: ISubtitle
  ): Promise<IEpisode | null> {
    const episode = await Episode.findById(episodeId);
    if (!episode) return null;
    
    // Check if subtitle language already exists
    const existingIndex = episode.subtitles.findIndex(
      sub => sub.language === subtitle.language && sub.type === subtitle.type
    );
    
    if (existingIndex >= 0) {
      // Replace existing subtitle
      episode.subtitles[existingIndex] = subtitle;
    } else {
      // Add new subtitle
      episode.subtitles.push(subtitle);
    }
    
    await episode.save();
    return episode;
  }

  /**
   * Remove subtitle from episode
   */
  static async removeSubtitle(
    episodeId: string,
    language: string,
    type: 'embedded' | 'uploaded'
  ): Promise<IEpisode | null> {
    const episode = await Episode.findById(episodeId);
    if (!episode) return null;
    
    episode.subtitles = episode.subtitles.filter(
      sub => !(sub.language === language && sub.type === type)
    );
    
    await episode.save();
    return episode;
  }

  /**
   * Get episode file paths
   */
  static async getEpisodeFilePaths(episodeId: string): Promise<{
    hlsDir: string;
    masterPlaylist: string;
    subtitlesDir: string;
    thumbnailPath: string;
  }> {
    const baseDir = path.join(process.cwd(), 'uploads', 'videos', episodeId);
    
    return {
      hlsDir: path.join(baseDir, 'hls'),
      masterPlaylist: path.join(baseDir, 'hls', 'master.m3u8'),
      subtitlesDir: path.join(baseDir, 'subtitles'),
      thumbnailPath: path.join(baseDir, 'thumbnail.jpg')
    };
  }

  /**
   * Delete episode and cleanup files
   */
  static async deleteEpisode(episodeId: string): Promise<boolean> {
    try {
      const episode = await Episode.findById(episodeId);
      if (!episode) return false;
      
      // Delete physical files
      const paths = await this.getEpisodeFilePaths(episodeId);
      try {
        await fs.rmdir(path.dirname(paths.hlsDir), { recursive: true });
      } catch (error) {
        console.error('Error deleting episode files:', error);
      }
      
      // Delete from database
      await Episode.findByIdAndDelete(episodeId);
      
      // Update counts
      await Promise.all([
        SeasonService.updateEpisodeCount(episode.seasonId.toString()),
        SeriesService.updateSeriesStats(episode.seriesId.toString())
      ]);
      
      return true;
    } catch (error) {
      console.error('Error deleting episode:', error);
      return false;
    }
  }

  /**
   * Get next episode
   */
  static async getNextEpisode(
    currentEpisodeId: string
  ): Promise<IEpisode | null> {
    const currentEpisode = await Episode.findById(currentEpisodeId);
    if (!currentEpisode) return null;
    
    // Try next episode in same season
    let nextEpisode = await Episode.findOne({
      seasonId: currentEpisode.seasonId,
      episodeNumber: { $gt: currentEpisode.episodeNumber },
      processingStatus: 'completed'
    }).sort('episodeNumber');
    
    // If no next episode in season, try next season
    if (!nextEpisode) {
      const season = await SeasonService.getSeasonWithEpisodes(
        currentEpisode.seasonId.toString()
      );
      
      if (season) {
        const nextSeason = await SeasonService.getSeasonsBySeries(
          currentEpisode.seriesId.toString()
        ).then(seasons => 
          seasons.find(s => s.seasonNumber > season.seasonNumber)
        );
        
        if (nextSeason) {
          nextEpisode = await Episode.findOne({
            seasonId: nextSeason._id,
            processingStatus: 'completed'
          }).sort('episodeNumber');
        }
      }
    }
    
    return nextEpisode;
  }

  /**
   * Get previous episode
   */
  static async getPreviousEpisode(
    currentEpisodeId: string
  ): Promise<IEpisode | null> {
    const currentEpisode = await Episode.findById(currentEpisodeId);
    if (!currentEpisode) return null;
    
    // Try previous episode in same season
    let prevEpisode = await Episode.findOne({
      seasonId: currentEpisode.seasonId,
      episodeNumber: { $lt: currentEpisode.episodeNumber },
      processingStatus: 'completed'
    }).sort('-episodeNumber');
    
    // If no previous episode in season, try previous season
    if (!prevEpisode) {
      const season = await SeasonService.getSeasonWithEpisodes(
        currentEpisode.seasonId.toString()
      );
      
      if (season && season.seasonNumber > 1) {
        const prevSeason = await SeasonService.getSeasonsBySeries(
          currentEpisode.seriesId.toString()
        ).then(seasons => 
          seasons
            .filter(s => s.seasonNumber < season.seasonNumber)
            .sort((a, b) => b.seasonNumber - a.seasonNumber)[0]
        );
        
        if (prevSeason) {
          prevEpisode = await Episode.findOne({
            seasonId: prevSeason._id,
            processingStatus: 'completed'
          }).sort('-episodeNumber');
        }
      }
    }
    
    return prevEpisode;
  }

  /**
   * Batch update episode order
   */
  static async reorderEpisodes(
    seasonId: string,
    episodeOrder: { episodeId: string; newNumber: number }[]
  ): Promise<void> {
    const session = await Episode.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Temporarily set all to negative numbers
        const episodes = await Episode.find({ seasonId }).session(session);
        
        for (const episode of episodes) {
          episode.episodeNumber = -episode.episodeNumber;
          await episode.save({ session });
        }
        
        // Update to new numbers
        for (const { episodeId, newNumber } of episodeOrder) {
          await Episode.findByIdAndUpdate(
            episodeId,
            { episodeNumber: newNumber },
            { session }
          );
        }
      });
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get episode statistics
   */
  static async getEpisodeStats(episodeId: string): Promise<{
    totalViews: number;
    subtitleCount: number;
    qualityCount: number;
    fileSize?: number;
  } | null> {
    const episode = await Episode.findById(episodeId);
    if (!episode) return null;
    
    // Calculate file size if possible
    let fileSize: number | undefined;
    try {
      const paths = await this.getEpisodeFilePaths(episodeId);
      const stats = await fs.stat(paths.hlsDir);
      if (stats.isDirectory()) {
        // This is simplified - in production you'd calculate total size of all files
        fileSize = 0;
      }
    } catch (error) {
      // File doesn't exist
    }
    
    return {
      totalViews: episode.viewCount,
      subtitleCount: episode.subtitles.length,
      qualityCount: episode.qualities.length,
      fileSize
    };
  }
}