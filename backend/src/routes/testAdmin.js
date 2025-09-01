const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { videoProcessingService } = require('../services/videoProcessingService');
const router = express.Router();

// ===== REAL FILE UPLOAD CONFIGURATION =====

// Ensure upload directories exist
const ensureDirectories = async () => {
  const dirs = [
    'uploads/videos',
    'uploads/subtitles', 
    'uploads/temp',
    'temp/processing'
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(path.join(process.cwd(), dir));
  }
};

// Initialize directories
ensureDirectories().catch(console.error);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let uploadPath;
    
    if (file.fieldname === 'videoFile') {
      uploadPath = path.join(process.cwd(), 'temp', 'processing');
    } else if (file.fieldname === 'subtitleFiles') {
      uploadPath = path.join(process.cwd(), 'uploads', 'subtitles');
    } else {
      uploadPath = path.join(process.cwd(), 'uploads', 'temp');
    }
    
    await fs.ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    
    // Create unique filename
    const filename = `${timestamp}-${uniqueId}-${nameWithoutExt}${ext}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'videoFile') {
    // Video files
    const allowedVideoTypes = ['.mp4', '.mkv', '.avi', '.mov'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedVideoTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported video format: ${ext}`), false);
    }
  } else if (file.fieldname === 'subtitleFiles') {
    // Subtitle files
    const allowedSubtitleTypes = ['.srt', '.vtt', '.ass'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedSubtitleTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported subtitle format: ${ext}`), false);
    }
  } else {
    cb(new Error('Unexpected field name'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB limit
    files: 11 // 1 video + up to 10 subtitle files
  }
});

// ===== EXISTING MOCK ENDPOINTS =====
router.post('/series', (req, res) => {
  console.log('📺 Creating series:', req.body.title);
  res.json({
    success: true,
    message: 'Series created successfully',
    data: {
      _id: uuidv4(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
});

router.post('/seasons', (req, res) => {
  console.log('📅 Creating season:', req.body.title);
  res.json({
    success: true,
    message: 'Season created successfully',
    data: {
      _id: uuidv4(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
});

router.get('/studios/search', (req, res) => {
  const { q } = req.query;
  const mockStudios = [
    { name: 'Mappa', count: 15 },
    { name: 'Studio Pierrot', count: 12 },
    { name: 'Madhouse', count: 20 },
    { name: 'Wit Studio', count: 8 },
    { name: 'Bones', count: 10 },
    { name: 'Toei Animation', count: 25 },
    { name: 'Studio Ghibli', count: 18 },
    { name: 'Production I.G', count: 14 },
    { name: 'Sunrise', count: 16 },
    { name: 'A-1 Pictures', count: 13 }
  ].filter(studio => 
    studio.name.toLowerCase().includes((q || '').toLowerCase())
  );
  
  res.json({
    success: true,
    data: mockStudios
  });
});

router.get('/genres/search', (req, res) => {
  const { q } = req.query;
  const mockGenres = [
    { name: 'Action', count: 45 }, { name: 'Adventure', count: 32 },
    { name: 'Comedy', count: 28 }, { name: 'Drama', count: 38 },
    { name: 'Fantasy', count: 24 }, { name: 'Romance', count: 22 },
    { name: 'Sci-Fi', count: 18 }, { name: 'Thriller', count: 15 },
    { name: 'Horror', count: 12 }, { name: 'Mystery', count: 16 },
    { name: 'Slice of Life', count: 20 }, { name: 'Sports', count: 14 },
    { name: 'Supernatural', count: 19 }, { name: 'Mecha', count: 11 },
    { name: 'School', count: 25 }, { name: 'Shounen', count: 35 },
    { name: 'Shoujo', count: 18 }, { name: 'Seinen', count: 22 },
    { name: 'Josei', count: 12 }
  ].filter(genre => 
    genre.name.toLowerCase().includes((q || '').toLowerCase())
  );
  
  res.json({ success: true, data: mockGenres });
});

router.get('/seasons/series/:seriesId', async (req, res) => {
  try {
    const seriesId = req.params.seriesId;
    console.log(`📅 Fetching seasons for series: ${seriesId}`);
    
    // Mock seasons data with real episode count
    const mockSeasons = [
      {
        _id: '68b3ccfd36d16c269361d1b6',
        seriesId: seriesId,
        title: 'Season 1',
        seasonNumber: 1,
        seasonType: 'tv',
        releaseYear: 2013,
        status: 'completed'
      }
    ];
    
    // Get real episode count for each season
    for (const season of mockSeasons) {
      try {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'videos');
        
        if (await fs.pathExists(uploadsDir)) {
          const episodeDirs = await fs.readdir(uploadsDir, { withFileTypes: true });
          let episodeCount = 0;
          
          // Count episodes by checking for video files in each directory
          for (const dir of episodeDirs) {
            if (dir.isDirectory()) {
              const episodeDir = path.join(uploadsDir, dir.name);
              const files = await fs.readdir(episodeDir);
              
              // Check if directory has video files (original.* files)
              const hasVideo = files.some(file => file.startsWith('original.'));
              if (hasVideo) {
                episodeCount++;
              }
            }
          }
          
          season.episodeCount = episodeCount;
        } else {
          season.episodeCount = 0;
        }
        
      } catch (error) {
        console.error(`Error counting episodes for season ${season._id}:`, error.message);
        season.episodeCount = 0;
      }
    }
    
    console.log(`✅ Found ${mockSeasons.length} seasons with episode counts:`, 
      mockSeasons.map(s => `${s.title}: ${s.episodeCount} episodes`));
    
    res.json({
      success: true,
      data: mockSeasons
    });
    
  } catch (error) {
    console.error('❌ Get seasons error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/episodes/season/:seasonId', async (req, res) => {
  try {
    const seasonId = req.params.seasonId;
    console.log(`🎦 Fetching episodes for season: ${seasonId}`);
    
    const episodes = [];
    const uploadsDir = path.join(process.cwd(), 'uploads', 'videos');
    
    if (await fs.pathExists(uploadsDir)) {
      const episodeDirs = await fs.readdir(uploadsDir, { withFileTypes: true });
      let episodeNumber = 1;
      
      for (const dir of episodeDirs) {
        if (dir.isDirectory()) {
          const episodeDir = path.join(uploadsDir, dir.name);
          const files = await fs.readdir(episodeDir);
          
          // Find original video file
          const videoFile = files.find(file => file.startsWith('original.'));
          
          if (videoFile) {
            const videoPath = path.join(episodeDir, videoFile);
            const stats = await fs.stat(videoPath);
            
            // Check for HLS processing completion
            const hlsDir = path.join(episodeDir, 'hls');
            const hasHLS = await fs.pathExists(hlsDir);
            const hasMaster = hasHLS && await fs.pathExists(path.join(hlsDir, 'master.m3u8'));
            
            let processingStatus = 'pending';
            if (hasMaster) {
              processingStatus = 'completed';
            } else if (hasHLS) {
              processingStatus = 'processing';
            }
            
            episodes.push({
              _id: dir.name, // Use directory name as episode ID
              episodeNumber: episodeNumber,
              title: `Episode ${episodeNumber}`, // Default title, could be enhanced
              duration: 1440, // Mock duration, could be extracted from video
              processingStatus,
              fileSize: stats.size,
              uploadDate: stats.birthtime,
              videoFile: videoFile,
              hasHLS: hasMaster
            });
            
            episodeNumber++;
          }
        }
      }
    }
    
    // Sort by episode number
    episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    
    console.log(`✅ Found ${episodes.length} episodes for season ${seasonId}`);
    
    res.json({
      success: true,
      data: episodes
    });
    
  } catch (error) {
    console.error('❌ Get episodes error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== REAL EPISODE UPLOAD ENDPOINT =====

// Store active uploads to prevent duplicates
const activeUploads = new Map();

router.post('/episodes', 
  // Multer middleware for file upload
  upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'subtitleFiles', maxCount: 10 }
  ]),
  
  // Main upload handler
  async (req, res) => {
    const uploadFingerprint = `${req.body.seriesId}-${req.body.seasonId}-${req.body.title}-${req.body.episodeNumber}`;
    
    // Check for duplicate based on content fingerprint (only if NOT replacing)
    if (!req.body.replaceEpisodeId && activeUploads.has(uploadFingerprint)) {
      console.log(`⚠️  Duplicate upload detected for: ${req.body.title} Episode ${req.body.episodeNumber}`);
      return res.status(409).json({
        success: false,
        error: 'This episode is already being uploaded'
      });
    }
    
    // Mark upload as active
    activeUploads.set(uploadFingerprint, { startTime: Date.now() });
    
    try {
      // Validate required fields
      const { seriesId, seasonId, title, episodeNumber, replaceEpisodeId } = req.body;
      
      console.log('🚀 Episode upload started');
      console.log('📁 Files received:', {
        video: req.files?.videoFile?.length || 0,
        subtitles: req.files?.subtitleFiles?.length || 0
      });
      console.log('📝 Form data:', req.body);
      
      if (!seriesId || !seasonId || !title || !episodeNumber) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: seriesId, seasonId, title, episodeNumber'
        });
      }
      
      if (!req.files?.videoFile || req.files.videoFile.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Video file is required'
        });
      }
      
      const videoFile = req.files.videoFile[0];
      const subtitleFiles = req.files?.subtitleFiles || [];
      
      // Handle episode replacement or creation
      let episodeId;
      let isReplacement = false;
      
      if (replaceEpisodeId) {
        // REPLACE EXISTING EPISODE
        episodeId = replaceEpisodeId;
        isReplacement = true;
        
        console.log(`🔄 Replacing existing episode: ${episodeId}`);
        
        // Clean up old files
        const oldEpisodeDir = path.join(process.cwd(), 'uploads', 'videos', episodeId);
        
        if (await fs.pathExists(oldEpisodeDir)) {
          console.log(`🗑️ Cleaning up old episode files: ${oldEpisodeDir}`);
          try {
            // Remove old files but keep directory structure
            const oldFiles = await fs.readdir(oldEpisodeDir);
            for (const file of oldFiles) {
              const filePath = path.join(oldEpisodeDir, file);
              const stats = await fs.stat(filePath);
              
              if (stats.isFile() && file.startsWith('original.')) {
                await fs.remove(filePath);
                console.log(`✅ Removed old video: ${file}`);
              } else if (stats.isDirectory() && file === 'hls') {
                await fs.remove(filePath);
                console.log(`✅ Removed old HLS directory`);
              }
            }
          } catch (cleanupError) {
            console.error('⚠️ Old file cleanup error (continuing anyway):', cleanupError.message);
          }
        }
      } else {
        // CREATE NEW EPISODE
        episodeId = uuidv4();
        console.log(`🆕 Creating new episode: ${episodeId}`);
      }
      
      // Create episode directory structure
      const episodeDir = path.join(process.cwd(), 'uploads', 'videos', episodeId);
      await fs.ensureDir(episodeDir);
      await fs.ensureDir(path.join(episodeDir, 'subtitles'));
      
      // Move video file to episode directory
      const videoDestination = path.join(episodeDir, `original${path.extname(videoFile.originalname)}`);
      await fs.move(videoFile.path, videoDestination);
      
      console.log('📼 Video file saved to:', videoDestination);
      
      // Process subtitle files
      const processedSubtitles = [];
      for (const subtitleFile of subtitleFiles) {
        const subtitleDestination = path.join(episodeDir, 'subtitles', subtitleFile.originalname);
        await fs.move(subtitleFile.path, subtitleDestination);
        
        processedSubtitles.push({
          language: path.basename(subtitleFile.originalname, path.extname(subtitleFile.originalname)),
          file: subtitleDestination,
          originalName: subtitleFile.originalname
        });
        
        console.log('📄 Subtitle saved:', subtitleDestination);
      }
      
      // Create episode data
      const episodeData = {
        _id: episodeId,
        seriesId,
        seasonId,
        title,
        episodeNumber: parseInt(episodeNumber),
        description: req.body.description || '',
        
        // File information
        originalFile: {
          path: videoDestination,
          size: videoFile.size,
          mimetype: videoFile.mimetype,
          originalName: videoFile.originalname
        },
        
        subtitles: processedSubtitles,
        
        // Processing status
        processingStatus: 'pending',
        hlsPath: null, // Will be set after processing
        qualities: [],
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log(`✅ Episode ${isReplacement ? 'replacement' : 'upload'} completed:`, {
        id: episodeId,
        title: title,
        videoSize: `${(videoFile.size / (1024 * 1024)).toFixed(2)}MB`,
        subtitleCount: subtitleFiles.length,
        isReplacement
      });
      
      // Return success response
      res.json({
        success: true,
        message: `Episode ${isReplacement ? 'replaced' : 'uploaded'} successfully`,
        data: episodeData,
        processingId: `proc_${episodeId}_${Date.now()}`
      });
      
      // Start video processing asynchronously (don't wait for completion)
      console.log('🎬 Starting HLS video processing...');
      setImmediate(async () => {
        try {
          const processingResult = await videoProcessingService.processVideoToHLS(
            episodeId,
            videoDestination,
            {
              qualities: ['480p', '1080p'], // Generate both qualities
              segmentDuration: 10 // 10 second segments
            }
          );
          
          console.log('✅ Video processing completed:', processingResult);
          
          // TODO: Update episode in database with HLS paths
          // await Episode.findByIdAndUpdate(episodeId, {
          //   processingStatus: 'completed',
          //   hlsPath: processingResult.hlsPath,
          //   qualities: processingResult.qualities,
          //   duration: processingResult.duration
          // });
          
        } catch (processingError) {
          console.error('❌ Video processing failed:', processingError.message);
          
          // TODO: Update episode status to failed
          // await Episode.findByIdAndUpdate(episodeId, {
          //   processingStatus: 'failed',
          //   processingError: processingError.message
          // });
        }
      });
      
    } catch (error) {
      console.error('❌ Episode upload error:', error);
      
      // Cleanup uploaded files on error
      try {
        if (req.files?.videoFile) {
          for (const file of req.files.videoFile) {
            await fs.remove(file.path).catch(() => {});
          }
        }
        if (req.files?.subtitleFiles) {
          for (const file of req.files.subtitleFiles) {
            await fs.remove(file.path).catch(() => {});
          }
        }
      } catch (cleanupError) {
        console.error('⚠️  Cleanup error:', cleanupError);
      }
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload episode'
      });
    } finally {
      // Remove from active uploads
      activeUploads.delete(uploadFingerprint);
    }
  }
);

// ===== FILE INFO ENDPOINT =====
router.get('/episodes/:id/files', async (req, res) => {
  try {
    const episodeId = req.params.id;
    const episodeDir = path.join(process.cwd(), 'uploads', 'videos', episodeId);
    
    if (!(await fs.pathExists(episodeDir))) {
      return res.status(404).json({
        success: false,
        error: 'Episode files not found'
      });
    }
    
    // List files in episode directory
    const files = await fs.readdir(episodeDir, { withFileTypes: true });
    const fileInfo = [];
    
    for (const file of files) {
      if (file.isFile()) {
        const filePath = path.join(episodeDir, file.name);
        const stats = await fs.stat(filePath);
        
        fileInfo.push({
          name: file.name,
          size: stats.size,
          modified: stats.mtime,
          type: path.extname(file.name)
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        episodeId,
        directory: episodeDir,
        files: fileInfo
      }
    });
    
  } catch (error) {
    console.error('❌ Get episode files error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== PROCESSING STATUS ENDPOINT =====
router.get('/episodes/:id/processing-status', (req, res) => {
  try {
    const episodeId = req.params.id;
    const status = videoProcessingService.getProcessingStatus(episodeId);
    
    if (!status) {
      return res.json({
        success: true,
        data: {
          status: 'not_found',
          message: 'No processing status found for this episode'
        }
      });
    }
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('❌ Get processing status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
