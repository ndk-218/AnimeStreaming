import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import Episode from '../models/Episode.js';
import Season from '../models/Season.js';
import UpscaleService from './upscale.service.js';
import AdminNotification from '../models/AdminNotification.js';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

class VideoProcessorService {
  constructor() {
    // Quality presets cho anime
    this.qualityPresets = {
      '1080p': {
        resolution: '1920x1080',
        videoBitrate: '5000k',
        audioBitrate: '192k',
        preset: 'slow' // Better quality for anime
      },
      '720p': {
        resolution: '1280x720',
        videoBitrate: '2500k',
        audioBitrate: '128k',
        preset: 'medium'
      },
      '480p': {
        resolution: '854x480',
        videoBitrate: '1000k',
        audioBitrate: '96k',
        preset: 'fast'
      }
    };
    
    // GPU acceleration detection
    this.gpuAcceleration = {
      enabled: false,
      type: null // 'nvenc' (NVIDIA) | 'qsv' (Intel) | 'amf' (AMD)
    };
    
    // Auto-detect GPU on initialization
    this.detectGPU();
  }
  
  /**
   * Detect available GPU hardware acceleration
   */
  async detectGPU() {
    console.log('🔍 Detecting GPU hardware acceleration...');
    
    try {
      // Test NVIDIA NVENC (most common for gaming/workstation GPUs)
      const hasNvenc = await this.testEncoder('h264_nvenc');
      if (hasNvenc) {
        this.gpuAcceleration = { enabled: true, type: 'nvenc' };
        console.log('✅ NVIDIA NVENC detected and enabled');
        console.log('   🚀 GPU encoding will be 5-10x faster than CPU!');
        return;
      }
      
      // Test Intel Quick Sync Video
      const hasQSV = await this.testEncoder('h264_qsv');
      if (hasQSV) {
        this.gpuAcceleration = { enabled: true, type: 'qsv' };
        console.log('✅ Intel QSV detected and enabled');
        return;
      }
      
      // Test AMD AMF
      const hasAMF = await this.testEncoder('h264_amf');
      if (hasAMF) {
        this.gpuAcceleration = { enabled: true, type: 'amf' };
        console.log('✅ AMD AMF detected and enabled');
        return;
      }
      
      console.log('⚠️ No GPU acceleration available, using CPU (libx264)');
    } catch (error) {
      console.log('⚠️ GPU detection failed, falling back to CPU');
    }
  }
  
  /**
   * Test if encoder is available
   */
  testEncoder(encoderName) {
    return new Promise((resolve) => {
      ffmpeg()
        .input('color=c=black:s=256x256:d=1')
        .inputFormat('lavfi')
        .videoCodec(encoderName)
        .outputOptions(['-frames:v 1', '-f null'])
        .output('-')
        .on('end', () => resolve(true))
        .on('error', () => resolve(false))
        .run();
    });
  }

  /**
   * Main processing function
   * @param {string} episodeId - MongoDB Episode ID
   * @param {string} inputPath - Path to uploaded video file
   * @param {Function} progressCallback - Progress update callback
   */
  async processVideo(episodeId, inputPath, progressCallback) {
    let upscaledVideoPath = null;
    let tempDir = null;
    
    try {
      // Get episode to check season
      const episode = await Episode.findById(episodeId);
      if (!episode) {
        throw new Error('Episode not found');
      }
      
      // Check if season requires upscaling
      const season = await Season.findById(episode.seasonId);
      const shouldUpscale = season?.isUpscaled || false;
      
      console.log(`\n🎬 Processing: ${episode.episodeNumber} - ${shouldUpscale ? 'Upscale + HLS' : 'HLS only'}`);
      
      // Update episode status
      await Episode.findByIdAndUpdate(episodeId, {
        processingStatus: 'processing',
        processingStage: shouldUpscale ? 'upscaling' : 'converting'
      });
      
      // Update admin notification
      await this.updateAdminNotification(episodeId, 'uploading', 0, 'Starting video upload...');

      let videoToProcess = inputPath;
      
      // ========== STEP 0: UPSCALE (if needed) ==========
      if (shouldUpscale) {
        progressCallback?.(5, 'Upscaling video (this may take 2-3 hours)...');
        await this.updateAdminNotification(episodeId, 'upscaling', 5, 'Upscaling video...');
        
        // Create temp directory for upscaling
        tempDir = path.join(process.cwd(), 'temp', 'upscale', episodeId.toString());
        await fs.mkdir(tempDir, { recursive: true });
        
        // Copy original to temp
        const tempInputPath = path.join(tempDir, path.basename(inputPath));
        await fs.copyFile(inputPath, tempInputPath);
        
        // Run upscale
        try {
          upscaledVideoPath = await UpscaleService.upscaleVideo(
            tempInputPath,
            (percent, message) => {
              progressCallback?.(5, message || 'Upscaling video...');
            }
          );
          
          // Verify file exists and has content
          const stats = await fs.stat(upscaledVideoPath);
          if (stats.size < 1000) {
            throw new Error(`Upscaled file is too small (${stats.size} bytes)`);
          }
          
          console.log(`✅ Upscaled: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          
          // Use upscaled video for HLS conversion
          videoToProcess = upscaledVideoPath;
          
          // Update stage
          await Episode.findByIdAndUpdate(episodeId, {
            processingStage: 'converting'
          });
          
          await this.updateAdminNotification(episodeId, 'converting', 15, 'Converting to HLS...');
          
        } catch (upscaleError) {
          console.error('❌ Upscale failed:', upscaleError);
          // Cleanup and fail
          if (tempDir) {
            await UpscaleService.cleanupTempFiles(tempDir);
          }
          throw new Error(`Upscale failed: ${upscaleError.message}`);
        }
      }

      // Create output directories
      const outputDir = path.join(
        process.cwd(),
        'uploads',
        'videos',
        episodeId.toString()
      );
      await fs.mkdir(outputDir, { recursive: true });

      // ========== STEP 1: Handle subtitles ==========
      // Check if episode already has uploaded subtitles
      const existingSubtitles = episode.subtitles || [];
      const hasUploadedSubtitles = existingSubtitles.some(sub => sub.type === 'uploaded');
      
      let subtitles = [];
      if (hasUploadedSubtitles) {
        // Keep uploaded subtitles, don't extract from video
        console.log(`📝 Using ${existingSubtitles.length} uploaded subtitle(s) - skipping extraction`);
        subtitles = existingSubtitles;
      } else {
        // No uploaded subtitles, extract from video
        const subtitleProgress = shouldUpscale ? 10 : 10;
        progressCallback?.(subtitleProgress, 'Extracting subtitles...');
        subtitles = await this.extractSubtitles(videoToProcess, outputDir);
        console.log(`📝 Extracted ${subtitles.length} embedded subtitle(s) from video`);
      }

      // ========== STEP 2: Get video metadata ==========
      const metadataProgress = shouldUpscale ? 15 : 15;
      progressCallback?.(metadataProgress, 'Analyzing video...');
      const metadata = await this.getVideoMetadata(videoToProcess);

      // ========== STEP 3: Convert to HLS với multiple qualities ==========
      const hlsStartProgress = shouldUpscale ? 15 : 15;
      const hlsEndProgress = shouldUpscale ? 90 : 90;
      
      progressCallback?.(hlsStartProgress, 'Converting to HLS...');
      await this.updateAdminNotification(episodeId, 'converting', hlsStartProgress, 'Converting to HLS...');
      const qualities = await this.convertToHLS(
        videoToProcess,
        outputDir,
        metadata,
        (progress) => {
          // Map conversion progress (0-100) to overall progress
          const overallProgress = hlsStartProgress + (progress * (hlsEndProgress - hlsStartProgress) / 100);
          progressCallback?.(overallProgress, 'Converting to HLS...');
        },
        shouldUpscale // Pass shouldUpscale flag
      );

      // ========== STEP 4: Create master playlist ==========
      progressCallback?.(95, 'Creating master playlist...');
      await this.createMasterPlaylist(outputDir, qualities);

      // ========== STEP 5: Update database ==========
      progressCallback?.(100, 'Finalizing...');
      await this.updateAdminNotification(episodeId, 'completed', 100, 'Processing completed!');
      
      await this.updateEpisodeWithResults(
        episodeId,
        outputDir,
        qualities,
        subtitles,
        metadata,
        shouldUpscale
      );

      // ========== STEP 6: Cleanup ==========
      await fs.unlink(inputPath);
      
      if (tempDir) {
        try {
          await UpscaleService.cleanupTempFiles(tempDir);
        } catch (cleanupError) {
          console.error('⚠️ Cleanup error:', cleanupError.message);
        }
      }

      console.log('✅ Processing complete\n');
      
      return {
        success: true,
        episodeId,
        qualities,
        subtitles,
        upscaled: shouldUpscale
      };
      
    } catch (error) {
      console.error('❌ Video processing failed:', error);
      
      // Update episode với failed status
      await Episode.findByIdAndUpdate(episodeId, {
        processingStatus: 'failed'
      });
      
      // Update admin notification to failed
      await this.updateAdminNotification(episodeId, 'failed', 0, `Processing failed: ${error.message}`);
      
      // Cleanup temp files on error
      if (tempDir) {
        try {
          await UpscaleService.cleanupTempFiles(tempDir);
        } catch (cleanupError) {
          console.error('Failed to cleanup temp files:', cleanupError);
        }
      }

      throw error;
    }
  }

  /**
   * Extract embedded subtitles từ video
   */
  async extractSubtitles(inputPath, outputDir) {
    const subtitlesDir = path.join(outputDir, 'subtitles');
    await fs.mkdir(subtitlesDir, { recursive: true });

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, async (err, metadata) => {
        if (err) return resolve([]); // No subtitles is OK

        const subtitleStreams = metadata.streams.filter(
          (s) => s.codec_type === 'subtitle'
        );

        if (subtitleStreams.length === 0) return resolve([]);

        const extractedSubs = [];

        // Extract each subtitle stream
        for (let i = 0; i < subtitleStreams.length; i++) {
          const stream = subtitleStreams[i];
          const language = stream.tags?.language || `sub${i}`;
          const outputPath = path.join(subtitlesDir, `${language}.vtt`);

          try {
            await this.extractSubtitleStream(
              inputPath,
              i,
              outputPath
            );

            extractedSubs.push({
              language,
              label: this.getLanguageLabel(language),
              file: path.relative(process.cwd(), outputPath),
              type: 'embedded'
            });
          } catch (error) {
            console.error(`Failed to extract subtitle ${language}:`, error);
          }
        }

        resolve(extractedSubs);
      });
    });
  }

  /**
   * Extract single subtitle stream
   */
  extractSubtitleStream(inputPath, streamIndex, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-map 0:s:${streamIndex}`, // Select subtitle stream
          '-f webvtt' // Convert to WebVTT
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  /**
   * Get video metadata
   */
  getVideoMetadata(inputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) return reject(err);

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === 'video'
        );

        resolve({
          duration: Math.floor(metadata.format.duration),
          width: videoStream.width,
          height: videoStream.height,
          bitrate: metadata.format.bit_rate
        });
      });
    });
  }
  /**
   * Convert video to HLS với multiple qualities
   * @param {boolean} isUpscaled - Nếu true, chỉ tạo 1 quality duy nhất
   */
  async convertToHLS(inputPath, outputDir, metadata, progressCallback, isUpscaled = false) {
    const qualities = [];
    
    console.log(`\n🎬 Converting to HLS ${isUpscaled ? '(Upscaled - Single quality)' : '(Multiple qualities)'}`);
    
    let availableQualities = [];
    
    if (isUpscaled) {
      availableQualities = ['Upscaled'];
    } else {
      const sourceHeight = metadata.height;
      if (sourceHeight >= 1080) {
        availableQualities.push('1080p', '720p', '480p');
      } else if (sourceHeight >= 720) {
        availableQualities.push('720p', '480p');
      } else {
        availableQualities.push('480p');
      }
    }

    console.log(`   Source: ${metadata.width}x${metadata.height}`);
    console.log(`   Qualities: ${availableQualities.join(', ')}`);

    // Process each quality
    for (let i = 0; i < availableQualities.length; i++) {
      const quality = availableQualities[i];
      const qualityDir = path.join(outputDir, quality);
      await fs.mkdir(qualityDir, { recursive: true });
      const outputPath = path.join(qualityDir, 'playlist.m3u8');
      
      await this.convertToQuality(
        inputPath,
        outputPath,
        quality,
        (progress) => {
          const baseProgress = (i / availableQualities.length) * 100;
          const qualityProgress = (progress / availableQualities.length);
          progressCallback?.(baseProgress + qualityProgress);
        }
      );

      qualities.push({
        quality,
        file: path.relative(process.cwd(), outputPath)
      });
    }

    console.log(`✅ HLS conversion complete`);
    return qualities;
  }

  /**
   * Convert video to specific quality using HLS with GPU acceleration
   */
  convertToQuality(inputPath, outputPath, quality, progressCallback) {
    // For "Upscaled" quality, use original resolution (no scaling)
    const preset = quality === 'Upscaled' 
      ? {
          resolution: null, // No scaling - keep original
          videoBitrate: '8000k', // High bitrate for upscaled content
          audioBitrate: '192k',
          preset: 'slow'
        }
      : this.qualityPresets[quality];
    
    const useGPU = this.gpuAcceleration.enabled;

    return new Promise((resolve, reject) => {
      let ffmpegCommand = ffmpeg(inputPath);
      
      // Base output options
      const outputOptions = [];
      
      // ========== GPU ACCELERATION SETTINGS ==========
      if (useGPU) {
        const gpuType = this.gpuAcceleration.type;
        
        if (gpuType === 'nvenc') {
          // NVIDIA NVENC - Fastest and most common
          outputOptions.push(
            '-c:v h264_nvenc',
            '-preset p4', // p1 (fastest) to p7 (slowest), p4 is balanced
            '-tune hq', // High quality tune
            '-rc vbr', // Variable bitrate
            `-b:v ${preset.videoBitrate}`,
            `-maxrate ${preset.videoBitrate}`,
            `-bufsize ${parseInt(preset.videoBitrate) * 2}k`,
            '-profile:v high',
            '-rc-lookahead 20',
            '-spatial_aq 1',
            '-aq-strength 8'
          );
        } else if (gpuType === 'qsv') {
          // Intel Quick Sync
          outputOptions.push(
            '-c:v h264_qsv',
            '-preset medium',
            `-b:v ${preset.videoBitrate}`,
            `-maxrate ${preset.videoBitrate}`,
            `-bufsize ${parseInt(preset.videoBitrate) * 2}k`,
            '-look_ahead 1'
          );
        } else if (gpuType === 'amf') {
          // AMD AMF
          outputOptions.push(
            '-c:v h264_amf',
            '-quality balanced',
            `-b:v ${preset.videoBitrate}`,
            `-maxrate ${preset.videoBitrate}`,
            `-bufsize ${parseInt(preset.videoBitrate) * 2}k`
          );
        }
      } else {
        // CPU encoding (fallback)
        outputOptions.push(
          '-c:v libx264',
          `-preset ${preset.preset}`,
          '-tune animation',
          `-b:v ${preset.videoBitrate}`,
          `-maxrate ${preset.videoBitrate}`,
          `-bufsize ${parseInt(preset.videoBitrate) * 2}k`
        );
      }
      
      // ========== COMMON SETTINGS ==========
      outputOptions.push(
        // Audio settings (same for GPU/CPU)
        '-c:a aac',
        `-b:a ${preset.audioBitrate}`,
        '-ac 2',
        
        // HLS settings
        '-f hls',
        '-hls_time 6',
        '-hls_playlist_type vod',
        '-hls_segment_filename',
        path.join(path.dirname(outputPath), 'segment%03d.ts'),
        
        // Optimization
        '-g 48',
        '-sc_threshold 0'
      );
      
      // Video scaling (only if not Upscaled)
      if (preset.resolution) {
        outputOptions.push(
          `-vf scale=${preset.resolution}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2`,
          '-pix_fmt yuv420p'
        );
      } else {
        // Upscaled: Keep original resolution, just ensure even dimensions
        outputOptions.push(
          '-vf pad=ceil(iw/2)*2:ceil(ih/2)*2',
          '-pix_fmt yuv420p'
        );
      }
      
      ffmpegCommand
        .outputOptions(outputOptions)
        .output(outputPath)
        .on('progress', (progress) => {
          if (progress.percent) {
            progressCallback?.(progress.percent);
          }
        })
        .on('stderr', (stderrLine) => {
          // Silent - only log errors
          if (stderrLine.includes('error')) {
            console.error('[FFmpeg]:', stderrLine);
          }
        })
        .on('end', resolve)
        .on('error', (err, stdout, stderr) => {
          console.error('❌ FFmpeg error:', err.message);
          console.error('❌ FFmpeg stderr:', stderr);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Create master playlist for adaptive streaming
   */
  async createMasterPlaylist(outputDir, qualities) {
    const masterPath = path.join(outputDir, 'master.m3u8');
    
    let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

    // Add stream info for each quality
    for (const quality of qualities) {
      let bandwidth, resolution;
      
      if (quality.quality === 'Upscaled') {
        // For upscaled content, use high bitrate
        bandwidth = 8000 * 1000; // 8 Mbps
        // Get resolution from the actual playlist file
        resolution = '1920x1080'; // Default, will be overridden if we can read it
      } else {
        const preset = this.qualityPresets[quality.quality];
        bandwidth = parseInt(preset.videoBitrate) * 1000; // Convert to bps
        resolution = preset.resolution;
      }

      masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n`;
      masterContent += `${quality.quality}/playlist.m3u8\n\n`;
    }

    await fs.writeFile(masterPath, masterContent, 'utf-8');
    
    return path.relative(process.cwd(), masterPath);
  }

  /**
   * Update Episode document với processing results
   */
  async updateEpisodeWithResults(
    episodeId,
    outputDir,
    qualities,
    subtitles,
    metadata,
    isUpscaled = false
  ) {
    const masterPath = path.join(outputDir, 'master.m3u8');
    
    // Use EpisodeService to trigger notifications
    const EpisodeService = (await import('./episode.service.js')).default;
    
    await EpisodeService.updateProcessingStatus(episodeId, {
      processingStatus: 'completed',
      hlsPath: path.relative(process.cwd(), masterPath),
      qualities: qualities,
      subtitles: subtitles,
      duration: metadata.duration
    });
    
    console.log('✅ Episode updated with results (notifications triggered)');
  }

  /**
   * Get human-readable language label
   */
  getLanguageLabel(langCode) {
    const labels = {
      'en': 'English',
      'eng': 'English',
      'ja': 'Japanese',
      'jpn': 'Japanese',
      'vi': 'Vietnamese',
      'vie': 'Vietnamese',
      'zh': 'Chinese',
      'chi': 'Chinese',
      'ko': 'Korean',
      'kor': 'Korean'
    };

    return labels[langCode.toLowerCase()] || langCode.toUpperCase();
  }

  /**
   * Update admin notification progress
   */
  async updateAdminNotification(episodeId, status, progress, stage) {
    try {
      const notification = await AdminNotification.findOne({
        episodeId,
        type: 'upload'
      }).sort({ createdAt: -1 });
      
      if (notification) {
        notification.processingStatus = status;
        notification.processingProgress = progress;
        notification.processingStage = stage;
        notification.updatedAt = new Date();
        await notification.save();
      }
    } catch (error) {
      console.error('Failed to update admin notification:', error);
    }
  }
  
  /**
   * Delete processed video files
   */
  async deleteProcessedVideo(episodeId) {
    const videoDir = path.join(
      process.cwd(),
      'uploads',
      'videos',
      episodeId.toString()
    );

    try {
      await fs.rm(videoDir, { recursive: true, force: true });
      return true;
    } catch (error) {
      console.error('Failed to delete video directory:', error);
      return false;
    }
  }
}

export default new VideoProcessorService();
