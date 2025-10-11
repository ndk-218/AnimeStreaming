import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import Episode from '../models/Episode.js';
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
  }

  /**
   * Main processing function
   * @param {string} episodeId - MongoDB Episode ID
   * @param {string} inputPath - Path to uploaded video file
   * @param {Function} progressCallback - Progress update callback
   */
  async processVideo(episodeId, inputPath, progressCallback) {
    try {
      // Update episode status
      await Episode.findByIdAndUpdate(episodeId, {
        processingStatus: 'processing'
      });

      // Create output directories
      const outputDir = path.join(
        process.cwd(),
        'uploads',
        'videos',
        episodeId.toString()
      );
      await fs.mkdir(outputDir, { recursive: true });

      // Step 1: Extract subtitles (10%)
      progressCallback?.(10, 'Extracting subtitles...');
      const subtitles = await this.extractSubtitles(inputPath, outputDir);

      // Step 2: Get video metadata (15%)
      progressCallback?.(15, 'Analyzing video...');
      const metadata = await this.getVideoMetadata(inputPath);

      // Step 3: Convert to HLS với multiple qualities (15% -> 90%)
      progressCallback?.(15, 'Converting to HLS...');
      const qualities = await this.convertToHLS(
        inputPath,
        outputDir,
        metadata,
        (progress) => {
          // Map conversion progress (0-100) to overall progress (15-90)
          const overallProgress = 15 + (progress * 0.75);
          progressCallback?.(overallProgress, 'Converting to HLS...');
        }
      );

      // Step 4: Create master playlist (95%)
      progressCallback?.(95, 'Creating master playlist...');
      await this.createMasterPlaylist(outputDir, qualities);

      // Step 5: Update database (100%)
      progressCallback?.(100, 'Finalizing...');
      await this.updateEpisodeWithResults(
        episodeId,
        outputDir,
        qualities,
        subtitles,
        metadata
      );

      // Step 6: Cleanup original file
      await fs.unlink(inputPath);

      return {
        success: true,
        episodeId,
        qualities,
        subtitles
      };
    } catch (error) {
      // Update episode với failed status
      await Episode.findByIdAndUpdate(episodeId, {
        processingStatus: 'failed'
      });

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
   */
  async convertToHLS(inputPath, outputDir, metadata, progressCallback) {
    const qualities = [];
    
    console.log('\n🎬 === HLS CONVERSION START ===');
    console.log(`📂 Output Directory: ${outputDir}`);
    console.log(`📹 Input Path: ${inputPath}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    
    // Determine available qualities based on source resolution
    const sourceHeight = metadata.height;
    const availableQualities = [];

    if (sourceHeight >= 1080) {
      availableQualities.push('1080p', '720p', '480p');
    } else if (sourceHeight >= 720) {
      availableQualities.push('720p', '480p');
    } else {
      availableQualities.push('480p');
    }

    console.log(`📊 Source Resolution: ${metadata.width}x${metadata.height}`);
    console.log(`🎯 Target Qualities: ${availableQualities.join(', ')}`);

    // Process each quality
    for (let i = 0; i < availableQualities.length; i++) {
      const quality = availableQualities[i];
      const qualityDir = path.join(outputDir, quality);
      await fs.mkdir(qualityDir, { recursive: true });

      const outputPath = path.join(qualityDir, 'playlist.m3u8');
      
      console.log(`\n📹 Converting ${quality}...`);
      console.log(`   📁 Quality Dir: ${qualityDir}`);
      console.log(`   📄 Playlist: ${outputPath}`);
      
      await this.convertToQuality(
        inputPath,
        outputPath,
        quality,
        (progress) => {
          // Calculate overall progress for this quality
          const baseProgress = (i / availableQualities.length) * 100;
          const qualityProgress = (progress / availableQualities.length);
          progressCallback?.(baseProgress + qualityProgress);
        }
      );

      // Verify files were created
      try {
        const files = await fs.readdir(qualityDir);
        console.log(`✅ ${quality} completed - Files created: ${files.length}`);
        console.log(`   Files: ${files.join(', ')}`);
      } catch (err) {
        console.error(`❌ ${quality} - Error reading output dir:`, err.message);
      }

      qualities.push({
        quality,
        file: path.relative(process.cwd(), outputPath)
      });
    }

    console.log('\n✅ === HLS CONVERSION COMPLETE ===');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`📦 Total Qualities: ${qualities.length}\n`);

    return qualities;
  }

  /**
   * Convert video to specific quality using HLS
   */
 convertToQuality(inputPath, outputPath, quality, progressCallback) {
  const preset = this.qualityPresets[quality];

  return new Promise((resolve, reject) => {
    // THÊM DÒNG NÀY để log stderr
    let ffmpegCommand = ffmpeg(inputPath);
    
    ffmpegCommand
      .outputOptions([
        // Video codec settings
        '-c:v libx264',
        `-preset ${preset.preset}`,
        '-tune animation',
        `-b:v ${preset.videoBitrate}`,
        `-maxrate ${preset.videoBitrate}`,
        `-bufsize ${parseInt(preset.videoBitrate) * 2}k`,
        `-vf scale=${preset.resolution}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2`,
        '-pix_fmt yuv420p',
        
        // Audio codec settings
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
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        if (progress.percent) {
          progressCallback?.(progress.percent);
        }
      })
      // THÊM EVENT LISTENER NÀY:
      .on('stderr', (stderrLine) => {
        console.log('[FFmpeg]:', stderrLine);
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

    // Sort qualities by resolution (highest first)
    const sortedQualities = [...qualities].sort((a, b) => {
      const aHeight = parseInt(a.quality);
      const bHeight = parseInt(b.quality);
      return bHeight - aHeight;
    });

    // Add stream info for each quality
    for (const quality of sortedQualities) {
      const preset = this.qualityPresets[quality.quality];
      const bandwidth = parseInt(preset.videoBitrate) * 1000; // Convert to bps
      const resolution = preset.resolution;

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
    metadata
  ) {
    const masterPath = path.join(outputDir, 'master.m3u8');

    await Episode.findByIdAndUpdate(episodeId, {
      processingStatus: 'completed',
      hlsPath: path.relative(process.cwd(), masterPath),
      qualities: qualities,
      subtitles: subtitles,
      duration: metadata.duration
    });
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