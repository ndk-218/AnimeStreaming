// @ts-nocheck
const EpisodeService = require('../services/episode.service');
const path = require('path');
const fs = require('fs-extra');

/**
 * ===== EPISODES CONTROLLER - JAVASCRIPT VERSION =====
 * Phase 1: Admin upload + Anonymous streaming
 */

/**
 * Tạo episode mới và bắt đầu xử lý video
 * POST /admin/episodes
 */
const createEpisode = async (req, res) => {
  try {
    console.log('📁 Files received:', req.files); // Debug log
    
    // Kiểm tra file video được upload
    if (!req.files || !req.files.videoFile || !req.files.videoFile[0]) {
      return res.status(400).json({
        success: false,
        error: 'Video file is required'
      });
    }

    // Validate dữ liệu đầu vào
    const { seriesId, seasonId, episodeNumber, title, description } = req.body;
    
    if (!seriesId || !seasonId || !episodeNumber || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: seriesId, seasonId, episodeNumber, title'
      });
    }

    const episodeData = {
      seriesId,
      seasonId,
      episodeNumber: parseInt(episodeNumber),
      title,
      description: description || '',
      originalFile: req.files.videoFile[0].path
    };

    // Tạo episode trong database
    const episode = await EpisodeService.createEpisode(episodeData);
    
    // Process subtitle files if any
    if (req.files && req.files.subtitleFiles && req.files.subtitleFiles.length > 0) {
      console.log(`📄 Processing ${req.files.subtitleFiles.length} subtitle file(s)`);
      // TODO: Add subtitle processing logic here
    }

    // Add video to processing queue
    const { addVideoProcessingJob } = require('../config/queue');

    // ✅ FIX: Dynamic detect file extension
    const episodeDir = path.join(
      process.cwd(),
      'uploads',
      'videos',
      episode._id.toString()
    );
    
    const files = await fs.readdir(episodeDir);
    const originalFile = files.find(f => f.startsWith('original.'));
    
    if (!originalFile) {
      throw new Error(`Original video file not found in ${episodeDir}`);
    }
    
    const videoPath = path.join(episodeDir, originalFile);
    console.log('📹 Video file path:', videoPath);
    console.log('   File extension:', path.extname(originalFile));

    await addVideoProcessingJob(
      episode._id.toString(), 
      videoPath
    );
    
    console.log(`📺 Episode queued for processing: ${episode.title} (Job ID: video-${episode._id})`);

    res.status(201).json({
      success: true,
      data: episode,
      message: 'Episode created successfully and queued for processing'
    });

  } catch (error) {
    console.error('❌ Create episode error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy episode theo ID với thông tin chi tiết
 * GET /episodes/:id
 */
const getEpisodeById = async (req, res) => {
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

  } catch (error) {
    console.error('❌ Get episode error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy tất cả episodes trong một season
 * GET /seasons/:seasonId/episodes
 */
const getEpisodesBySeason = async (req, res) => {
  try {
    const { seasonId } = req.params;
    const onlyCompleted = req.query.playable === 'true';

    const episodes = await EpisodeService.getEpisodesBySeason(seasonId, onlyCompleted);

    res.json({
      success: true,
      data: episodes,
      count: episodes.length
    });

  } catch (error) {
    console.error('❌ Get episodes by season error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Stream episode (tăng view count và lấy thông tin streaming)
 * GET /episodes/:id/stream
 */
const streamEpisode = async (req, res) => {
  try {
    const episode = await EpisodeService.getEpisodeWithDetails(req.params.id);

    if (!episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }

    // Kiểm tra episode có thể phát được không
    if (!EpisodeService.isEpisodePlayable(episode)) {
      return res.status(400).json({
        success: false,
        error: 'Episode is not available for streaming',
        processingStatus: episode.processingStatus
      });
    }

    // Tăng view count
    // ❌ REMOVED: Double counting issue - view already incremented in playback endpoint
    // await EpisodeService.incrementViewCount(episode._id);

    // Lấy next và previous episodes
    const [nextEpisode, previousEpisode] = await Promise.all([
      EpisodeService.getNextEpisode(episode._id.toString()),
      EpisodeService.getPreviousEpisode(episode._id.toString())
    ]);

    res.json({
      success: true,
      data: {
        episode: {
          id: episode._id,
          title: episode.title,
          description: episode.description,
          duration: episode.duration,
          hlsPath: episode.hlsPath,
          qualities: episode.qualities,
          subtitles: episode.subtitles,
          thumbnail: episode.thumbnail,
          series: episode.seriesId,
          season: episode.seasonId
        },
        navigation: {
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
      }
    });

  } catch (error) {
    console.error('❌ Stream episode error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Increment view count cho episode (debounced từ frontend)
 * POST /api/episodes/:id/view
 */
const incrementView = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate episode ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid episode ID format'
      });
    }

    // Tăng view count (cascade update Season + Genres)
    const episode = await EpisodeService.incrementViewCount(id);

    if (!episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }

    console.log(`👁️ View incremented via API: Episode ${episode.episodeNumber} (${episode.viewCount} views)`);

    res.json({
      success: true,
      data: {
        viewCount: episode.viewCount
      },
      message: 'View count incremented successfully'
    });

  } catch (error) {
    console.error('❌ Increment view error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Cập nhật thông tin episode (chỉ admin)
 * PUT /admin/episodes/:id
 */
const updateEpisode = async (req, res) => {
  try {
    const episode = await EpisodeService.getEpisodeWithDetails(req.params.id);

    if (!episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }

    // Lọc bỏ các trường không được phép thay đổi
    const allowedFields = ['title', 'description', 'episodeNumber'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = field === 'episodeNumber' ? parseInt(req.body[field]) : req.body[field];
      }
    });

    // Cập nhật episode
    Object.assign(episode, updateData);
    await episode.save();

    res.json({
      success: true,
      data: episode,
      message: 'Episode updated successfully'
    });

  } catch (error) {
    console.error('❌ Update episode error:', error.message);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Xóa episode (chỉ admin)
 * DELETE /admin/episodes/:id
 */
const deleteEpisode = async (req, res) => {
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

  } catch (error) {
    console.error('❌ Delete episode error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Thêm subtitle cho episode (chỉ admin)
 * POST /admin/episodes/:id/subtitles
 */
const addSubtitle = async (req, res) => {
  try {
    // uploadSubtitle middleware sử dụng .single() nên file nằm trong req.file (singular)
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

    const subtitleData = {
      language,
      label,
      file: req.file.path, // req.file vì dùng .single()
      type: 'uploaded'
    };

    const episode = await EpisodeService.addSubtitle(req.params.id, subtitleData);

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

  } catch (error) {
    console.error('❌ Add subtitle error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Tìm kiếm episodes
 * GET /episodes/search?q=term
 */
const searchEpisodes = async (req, res) => {
  try {
    const { q: searchTerm, limit = 20 } = req.query;

    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search term is required'
      });
    }

    const episodes = await EpisodeService.searchEpisodes(searchTerm.trim(), parseInt(limit));

    res.json({
      success: true,
      data: episodes,
      count: episodes.length,
      searchTerm: searchTerm.trim()
    });

  } catch (error) {
    console.error('❌ Search episodes error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy episodes phổ biến nhất
 * GET /episodes/popular
 */
const getPopularEpisodes = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const episodes = await EpisodeService.getPopularEpisodes(parseInt(limit));

    res.json({
      success: true,
      data: episodes,
      count: episodes.length
    });

  } catch (error) {
    console.error('❌ Get popular episodes error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy thống kê episodes (chỉ admin)
 * GET /admin/episodes/stats
 */
const getEpisodeStats = async (req, res) => {
  try {
    const stats = await EpisodeService.getEpisodeStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Get episode stats error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Cập nhật trạng thái processing (dành cho video processing service)
 * PUT /admin/episodes/:id/processing
 */
const updateProcessingStatus = async (req, res) => {
  try {
    const { processingStatus, hlsPath, qualities, duration, thumbnail, subtitles } = req.body;

    if (!processingStatus) {
      return res.status(400).json({
        success: false,
        error: 'Processing status is required'
      });
    }

    const updateData = {
      processingStatus,
      hlsPath,
      qualities,
      duration,
      thumbnail,
      subtitles
    };

    const episode = await EpisodeService.updateProcessingStatus(req.params.id, updateData);

    if (!episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }

    res.json({
      success: true,
      data: episode,
      message: 'Processing status updated successfully'
    });

  } catch (error) {
    console.error('❌ Update processing status error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Replace video file cho episode đã tồn tại
 * PUT /admin/episodes/:id/video
 */
const replaceEpisodeVideo = async (req, res) => {
  try {
    console.log('🔄 Replace video request for episode:', req.params.id);
    console.log('📁 Files received:', req.files);

    // Kiểm tra file video được upload
    if (!req.files || !req.files.videoFile || !req.files.videoFile[0]) {
      return res.status(400).json({
        success: false,
        error: 'Video file is required'
      });
    }

    const episodeId = req.params.id;
    const newVideoPath = req.files.videoFile[0].path;

    // Replace video trong service
    await EpisodeService.replaceEpisodeVideo(episodeId, newVideoPath);

    // Add video to processing queue
    console.log('📦 Attempting to add job to queue...');
    
    let addVideoProcessingJob;
    try {
      // Dynamic import cho ES Module
      const queueModule = await import('../config/queue.js');
      addVideoProcessingJob = queueModule.addVideoProcessingJob;
      console.log('✅ Queue module loaded successfully');
    } catch (importError) {
      console.error('❌ Failed to import queue module:', importError.message);
      throw new Error('Failed to initialize video processing queue');
    }

    // ✅ FIX: Dynamic detect file extension instead of hard-coding .mp4
    const episodeDir = path.join(
      process.cwd(),
      'uploads',
      'videos',
      episodeId
    );
    
    // Find original video file (could be .mp4, .mkv, .avi, etc.)
    const files = await fs.readdir(episodeDir);
    const originalFile = files.find(f => f.startsWith('original.'));
    
    if (!originalFile) {
      throw new Error(`Original video file not found in ${episodeDir}`);
    }
    
    const videoPath = path.join(episodeDir, originalFile);
    console.log('🎥 Video path for processing:', videoPath);
    console.log('   File extension:', path.extname(originalFile));
    
    const job = await addVideoProcessingJob(episodeId, videoPath);
    
    console.log(`✅ Job added to queue successfully!`);
    console.log(`📺 Job ID: video-${episodeId}`);
    console.log(`🔢 Queue job ID: ${job.id}`);

    res.json({
      success: true,
      message: 'Episode video replaced successfully and queued for processing',
      jobId: job.id
    });

  } catch (error) {
    console.error('❌ Replace episode video error:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
/**
 * Lấy episodes gần đây
 * GET /episodes/recent
 */
const getRecentEpisodes = async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    
    const episodes = await EpisodeService.getRecentEpisodes(parseInt(limit));

    res.json({
      success: true,
      data: episodes,
      count: episodes.length
    });

  } catch (error) {
    console.error('❌ Get recent episodes error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lấy episodes trending (10 ngày gần nhất + nhiều views)
 * GET /episodes/trending
 */
const getTrendingEpisodes = async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    
    const episodes = await EpisodeService.getTrendingEpisodes(parseInt(limit));

    res.json({
      success: true,
      data: episodes,
      count: episodes.length
    });

  } catch (error) {
    console.error('❌ Get trending episodes error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createEpisode,
  getEpisodeById,
  getEpisodesBySeason,
  streamEpisode,
  incrementView,
  updateEpisode,
  replaceEpisodeVideo,
  deleteEpisode,
  addSubtitle,
  searchEpisodes,
  getPopularEpisodes,
  getRecentEpisodes,
  getTrendingEpisodes,
  getEpisodeStats,
  updateProcessingStatus
};
