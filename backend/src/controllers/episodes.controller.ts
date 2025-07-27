import { Request, Response } from 'express';
import { EpisodeService } from '../services/episode.service';
import { videoQueue } from '../queues/video.queue';

/**
 * Create new episode and start processing
 */
export const createEpisode = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Video file is required'
      });
    }
    
    const episodeData = {
      ...req.body,
      originalFile: req.file.path
    };
    
    // Create episode in database
    const episode = await EpisodeService.createEpisode(episodeData);
    
    // Add to processing queue
    await videoQueue.add('process-video', {
      episodeId: episode._id.toString(),
      filePath: req.file.path
    });
    
    res.status(201).json({
      success: true,
      data: episode,
      message: 'Episode created and queued for processing'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get episode by ID
 */
export const getEpisodeById = async (req: Request, res: Response) => {
  try {
    const episode = await EpisodeService.getEpisodeWithDetails(req.params.id);
    
    if (!episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }
    
    res.json({
      success: true,
      data: episode
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get episodes by season
 */
export const getEpisodesBySeason = async (req: Request, res: Response) => {
  try {
    const { seasonId } = req.params;
    const onlyPlayable = req.query.playable === 'true';
    
    const episodes = await EpisodeService.getEpisodesBySeason(
      seasonId,
      onlyPlayable
    );
    
    res.json({
      success: true,
      data: episodes,
      count: episodes.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Stream episode (increment view count)
 */
export const streamEpisode = async (req: Request, res: Response) => {
  try {
    const episode = await EpisodeService.getEpisodeWithDetails(req.params.id);
    
    if (!episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }
    
    if (!episode.isPlayable()) {
      return res.status(400).json({
        success: false,
        error: 'Episode is not available for streaming'
      });
    }
    
    // Increment view count
    await episode.incrementViewCount();
    
    // Get next and previous episodes
    const [nextEpisode, previousEpisode] = await Promise.all([
      EpisodeService.getNextEpisode(episode._id.toString()),
      EpisodeService.getPreviousEpisode(episode._id.toString())
    ]);
    
    res.json({
      success: true,
      data: {
        episode,
        nextEpisode: nextEpisode ? {
          id: nextEpisode._id,
          title: nextEpisode.title,
          episodeNumber: nextEpisode.episodeNumber
        } : null,
        previousEpisode: previousEpisode ? {
          id: previousEpisode._id,
          title: previousEpisode.title,
          episodeNumber: previousEpisode.episodeNumber
        } : null
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update episode
 */
export const updateEpisode = async (req: Request, res: Response) => {
  try {
    const episode = await EpisodeService.getEpisodeWithDetails(req.params.id);
    
    if (!episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }
    
    // Don't allow changing these fields
    delete req.body.seriesId;
    delete req.body.seasonId;
    delete req.body.originalFile;
    delete req.body.hlsPath;
    delete req.body.processingStatus;
    
    Object.assign(episode, req.body);
    await episode.save();
    
    res.json({
      success: true,
      data: episode
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete episode
 */
export const deleteEpisode = async (req: Request, res: Response) => {
  try {
    const success = await EpisodeService.deleteEpisode(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found or could not be deleted'
      });
    }
    
    res.json({
      success: true,
      message: 'Episode deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Add subtitle to episode
 */
export const addSubtitle = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Subtitle file is required'
      });
    }
    
    const { language, label } = req.body;
    
    if (!language || !label) {
      return res.status(400).json({
        success: false,
        error: 'Language and label are required'
      });
    }
    
    const subtitle = {
      language,
      label,
      file: req.file.path,
      type: 'uploaded' as const
    };
    
    const episode = await EpisodeService.addSubtitle(req.params.id, subtitle);
    
    if (!episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }
    
    res.json({
      success: true,
      data: episode,
      message: 'Subtitle added successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Remove subtitle from episode
 */
export const removeSubtitle = async (req: Request, res: Response) => {
  try {
    const { language, type } = req.params;
    
    if (!['embedded', 'uploaded'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subtitle type'
      });
    }
    
    const episode = await EpisodeService.removeSubtitle(
      req.params.id,
      language,
      type as 'embedded' | 'uploaded'
    );
    
    if (!episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }
    
    res.json({
      success: true,
      data: episode,
      message: 'Subtitle removed successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get episode statistics
 */
export const getEpisodeStats = async (req: Request, res: Response) => {
  try {
    const stats = await EpisodeService.getEpisodeStats(req.params.id);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};