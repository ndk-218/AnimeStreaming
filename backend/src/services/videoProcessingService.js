/**
 * VIDEO PROCESSING SERVICE
 * ========================
 * Handles FFmpeg video processing for HLS conversion
 * Converts MP4/MKV -> HLS (m3u8 + ts segments)
 * 
 * Dependencies: ffmpeg-static, fluent-ffmpeg
 * Usage: Called after episode upload
 */

const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const path = require('path');
const fs = require('fs-extra');

// Set FFmpeg paths
console.log('🔧 Setting up FFmpeg paths...');
try {
  console.log('FFmpeg static path:', ffmpegStatic);
  console.log('FFprobe static path:', ffprobeStatic.path);
  
  ffmpeg.setFfmpegPath(ffmpegStatic);
  ffmpeg.setFfprobePath(ffprobeStatic.path); // Use .path property for ffprobe-static
  
  console.log('✅ FFmpeg paths configured successfully');
} catch (error) {
  console.error('❌ FFmpeg setup error:', error.message);
}

class VideoProcessingService {
  constructor() {
    this.processingQueue = new Map(); // Store processing status
  }

  /**
   * Process video to HLS format
   * @param {string} episodeId - Unique episode identifier
   * @param {string} inputPath - Path to original video file
   * @param {object} options - Processing options
   */
  async processVideoToHLS(episodeId, inputPath, options = {}) {
    console.log(`🎬 Starting HLS processing for episode: ${episodeId}`);
    
    // Set processing status
    this.processingQueue.set(episodeId, {
      status: 'processing',
      progress: 0,
      currentStep: 'Video Analysis',
      startTime: Date.now()
    });

    try {
      // Create output directory structure
      const episodeDir = path.join(process.cwd(), 'uploads', 'videos', episodeId);
      const hlsDir = path.join(episodeDir, 'hls');
      await fs.ensureDir(hlsDir);

      // Create quality directories
      const qualities = options.qualities || ['480p', '1080p'];
      for (const quality of qualities) {
        await fs.ensureDir(path.join(hlsDir, quality));
      }

      // Get video metadata
      const metadata = await this.getVideoMetadata(inputPath);
      console.log(`📊 Video metadata:`, {
        duration: metadata.duration,
        resolution: `${metadata.width}x${metadata.height}`,
        codec: metadata.codec,
        bitrate: metadata.bitrate
      });

      // Update processing status
      this.updateProcessingStatus(episodeId, {
        progress: 10,
        currentStep: 'Format Conversion'
      });

      // Process each quality
      const processedQualities = [];
      for (let i = 0; i < qualities.length; i++) {
        const quality = qualities[i];
        const qualitySettings = this.getQualitySettings(quality, metadata);
        
        console.log(`🔧 Processing ${quality} quality...`);
        
        // Update progress
        const baseProgress = 20 + (i * 60 / qualities.length);
        this.updateProcessingStatus(episodeId, {
          progress: baseProgress,
          currentStep: `Quality Generation - ${quality}`
        });

        const outputPath = await this.convertToHLS(
          inputPath, 
          path.join(hlsDir, quality), 
          qualitySettings,
          (progress) => {
            // Update progress during conversion
            const totalProgress = baseProgress + (progress * 60 / qualities.length / 100);
            this.updateProcessingStatus(episodeId, {
              progress: Math.min(totalProgress, 80)
            });
          }
        );

        processedQualities.push({
          quality,
          resolution: qualitySettings.resolution,
          bitrate: qualitySettings.videoBitrate,
          file: path.relative(path.join(process.cwd(), 'uploads'), outputPath)
        });
      }

      // Update processing status
      this.updateProcessingStatus(episodeId, {
        progress: 85,
        currentStep: 'Creating Master Playlist'
      });

      // Create master playlist
      const masterPlaylistPath = await this.createMasterPlaylist(hlsDir, processedQualities);
      
      // Update processing status
      this.updateProcessingStatus(episodeId, {
        progress: 95,
        currentStep: 'Finalization'
      });

      // Final processing result
      const result = {
        episodeId,
        hlsPath: path.relative(path.join(process.cwd(), 'uploads'), masterPlaylistPath),
        qualities: processedQualities,
        duration: metadata.duration,
        processingTime: Date.now() - this.processingQueue.get(episodeId).startTime,
        status: 'completed'
      };

      // Update processing status to completed
      this.updateProcessingStatus(episodeId, {
        progress: 100,
        currentStep: 'Processing Complete',
        status: 'completed'
      });

      console.log(`✅ HLS processing completed for episode: ${episodeId}`);
      return result;

    } catch (error) {
      console.error(`❌ HLS processing failed for episode ${episodeId}:`, error.message);
      
      // Update processing status to failed
      this.updateProcessingStatus(episodeId, {
        status: 'failed',
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Get video metadata using FFprobe
   */
  async getVideoMetadata(inputPath) {
    console.log(`🔍 Analyzing video: ${inputPath}`);
    
    // Validate input path
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error(`Invalid input path: ${inputPath}`);
    }
    
    // Check if file exists
    if (!(await fs.pathExists(inputPath))) {
      throw new Error(`Video file not found: ${inputPath}`);
    }
    
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          console.error('❌ FFprobe error:', err.message);
          reject(new Error(`Failed to analyze video: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        
        if (!videoStream) {
          reject(new Error('No video stream found in file'));
          return;
        }
        
        const result = {
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          codec: videoStream.codec_name || 'unknown',
          bitrate: parseInt(metadata.format.bit_rate) || 0,
          fps: 30 // Default FPS, eval can be dangerous
        };
        
        // Calculate FPS safely
        if (videoStream.r_frame_rate) {
          const [num, den] = videoStream.r_frame_rate.split('/');
          if (num && den && parseInt(den) !== 0) {
            result.fps = parseInt(num) / parseInt(den);
          }
        }
        
        console.log('✅ Video metadata extracted:', result);
        resolve(result);
      });
    });
  }

  /**
   * Get quality settings based on target quality and source video
   */
  getQualitySettings(quality, metadata) {
    const settings = {
      '480p': {
        resolution: '854x480',
        videoBitrate: '1000k',
        audioBitrate: '96k',
        maxWidth: 854,
        maxHeight: 480
      },
      '720p': {
        resolution: '1280x720', 
        videoBitrate: '2500k',
        audioBitrate: '128k',
        maxWidth: 1280,
        maxHeight: 720
      },
      '1080p': {
        resolution: '1920x1080',
        videoBitrate: '5000k',
        audioBitrate: '192k',
        maxWidth: 1920,
        maxHeight: 1080
      }
    };

    const targetSettings = settings[quality] || settings['480p'];
    
    // Don't upscale - use source resolution if smaller than target
    if (metadata.width < targetSettings.maxWidth || metadata.height < targetSettings.maxHeight) {
      const aspectRatio = metadata.width / metadata.height;
      let newWidth = metadata.width;
      let newHeight = metadata.height;
      
      // Ensure even dimensions (required for h264)
      if (newWidth % 2 !== 0) newWidth -= 1;
      if (newHeight % 2 !== 0) newHeight -= 1;
      
      targetSettings.resolution = `${newWidth}x${newHeight}`;
    }

    return targetSettings;
  }

  /**
   * Convert video to HLS format using FFmpeg
   */
  async convertToHLS(inputPath, outputDir, qualitySettings, progressCallback) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(outputDir, 'playlist.m3u8');
      
      const command = ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .videoBitrate(qualitySettings.videoBitrate)
        .audioBitrate(qualitySettings.audioBitrate)
        .size(qualitySettings.resolution)
        .outputOptions([
          '-hls_time 10',        // 10 second segments
          '-hls_list_size 0',    // Keep all segments in playlist
          '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts'),
          '-preset medium',       // Encoding preset (balance speed/quality)
          '-crf 23',             // Constant Rate Factor (quality)
          '-maxrate ' + qualitySettings.videoBitrate,
          '-bufsize ' + (parseInt(qualitySettings.videoBitrate) * 2) + 'k',
          '-g 60',               // GOP size (2 seconds at 30fps)
          '-sc_threshold 0',     // Disable scene change detection
          '-force_key_frames expr:gte(t,n_forced*2)', // Force keyframe every 2 seconds
        ]);

      // Progress tracking
      command.on('progress', (progress) => {
        if (progressCallback) {
          progressCallback(progress.percent || 0);
        }
      });

      // Error handling
      command.on('error', (error) => {
        console.error(`❌ FFmpeg error:`, error.message);
        reject(error);
      });

      // Success handling
      command.on('end', () => {
        console.log(`✅ HLS conversion completed: ${outputPath}`);
        resolve(outputPath);
      });

      // Start conversion
      command.run();
    });
  }

  /**
   * Create master playlist (m3u8) for adaptive streaming
   */
  async createMasterPlaylist(hlsDir, qualities) {
    const masterPlaylistPath = path.join(hlsDir, 'master.m3u8');
    
    let content = '#EXTM3U\n#EXT-X-VERSION:3\n\n';
    
    // Add each quality variant
    for (const quality of qualities) {
      const bandwidth = parseInt(quality.bitrate) * 1000; // Convert to bps
      
      content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality.resolution}\n`;
      content += `${quality.quality}/playlist.m3u8\n\n`;
    }
    
    await fs.writeFile(masterPlaylistPath, content);
    console.log(`✅ Master playlist created: ${masterPlaylistPath}`);
    
    return masterPlaylistPath;
  }

  /**
   * Update processing status
   */
  updateProcessingStatus(episodeId, updates) {
    const current = this.processingQueue.get(episodeId) || {};
    this.processingQueue.set(episodeId, {
      ...current,
      ...updates,
      updatedAt: Date.now()
    });
  }

  /**
   * Get processing status
   */
  getProcessingStatus(episodeId) {
    return this.processingQueue.get(episodeId) || null;
  }

  /**
   * Clear processing status (after completion)
   */
  clearProcessingStatus(episodeId) {
    this.processingQueue.delete(episodeId);
  }
}

// Create singleton instance
const videoProcessingService = new VideoProcessingService();

module.exports = {
  VideoProcessingService,
  videoProcessingService
};
