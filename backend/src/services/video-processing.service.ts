import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { EpisodeService } from './episode.service';
import { socketService } from './socket.service';

interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
}

interface ProcessingProgress {
  episodeId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  error?: string;
}

export class VideoProcessingService {
  /**
   * Process video file to HLS format
   */
  static async processVideo(episodeId: string, inputPath: string): Promise<void> {
    try {
      // Update status to processing
      await EpisodeService.updateProcessingStatus(episodeId, {
        processingStatus: 'processing'
      });
      
      // Send initial progress
      this.sendProgress({
        episodeId,
        status: 'processing',
        progress: 0,
        currentStep: 'Analyzing video...'
      });
      
      // Get video info
      const videoInfo = await this.getVideoInfo(inputPath);
      
      // Setup output paths
      const paths = await EpisodeService.getEpisodeFilePaths(episodeId);
      await this.ensureDirectories(paths);
      
      // Generate thumbnail
      this.sendProgress({
        episodeId,
        status: 'processing',
        progress: 10,
        currentStep: 'Generating thumbnail...'
      });
      await this.generateThumbnail(inputPath, paths.thumbnailPath);
      
      // Extract subtitles
      this.sendProgress({
        episodeId,
        status: 'processing',
        progress: 20,
        currentStep: 'Extracting subtitles...'
      });
      const subtitles = await this.extractSubtitles(inputPath, paths.subtitlesDir);
      
      // Convert to HLS
      this.sendProgress({
        episodeId,
        status: 'processing',
        progress: 30,
        currentStep: 'Converting to HLS format...'
      });
      const qualities = await this.convertToHLS(
        inputPath,
        paths.hlsDir,
        videoInfo,
        (progress) => {
          this.sendProgress({
            episodeId,
            status: 'processing',
            progress: 30 + (progress * 0.6), // 30-90%
            currentStep: `Converting video... ${Math.round(progress * 100)}%`
          });
        }
      );
      
      // Update episode with results
      this.sendProgress({
        episodeId,
        status: 'processing',
        progress: 95,
        currentStep: 'Finalizing...'
      });
      
      await EpisodeService.updateProcessingStatus(episodeId, {
        processingStatus: 'completed',
        hlsPath: `/videos/${episodeId}/hls/master.m3u8`,
        qualities,
        duration: Math.round(videoInfo.duration),
        thumbnail: `/videos/${episodeId}/thumbnail.jpg`
      });
      
      // Add extracted subtitles
      for (const subtitle of subtitles) {
        await EpisodeService.addSubtitle(episodeId, subtitle);
      }
      
      // Send completion
      this.sendProgress({
        episodeId,
        status: 'completed',
        progress: 100,
        currentStep: 'Processing completed!'
      });
      
      // Cleanup original file
      await this.cleanupOriginalFile(inputPath);
      
    } catch (error: any) {
      console.error('Video processing error:', error);
      
      // Update status to failed
      await EpisodeService.updateProcessingStatus(episodeId, {
        processingStatus: 'failed',
        processingError: error.message
      });
      
      // Send error notification
      this.sendProgress({
        episodeId,
        status: 'failed',
        progress: 0,
        currentStep: 'Processing failed',
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Get video information using ffprobe
   */
  private static async getVideoInfo(inputPath: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,codec_name,bit_rate,duration',
        '-show_entries', 'format=duration',
        '-of', 'json',
        inputPath
      ]);
      
      let output = '';
      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new Error('Failed to get video info'));
          return;
        }
        
        try {
          const info = JSON.parse(output);
          const stream = info.streams[0];
          const format = info.format;
          
          resolve({
            duration: parseFloat(format.duration || stream.duration || '0'),
            width: parseInt(stream.width),
            height: parseInt(stream.height),
            codec: stream.codec_name,
            bitrate: parseInt(stream.bit_rate || format.bit_rate || '0')
          });
        } catch (error) {
          reject(new Error('Failed to parse video info'));
        }
      });
    });
  }
  
  /**
   * Generate thumbnail from video
   */
  private static async generateThumbnail(
    inputPath: string, 
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-ss', '00:00:10', // 10 seconds in
        '-vframes', '1',
        '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease',
        '-y',
        outputPath
      ]);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Failed to generate thumbnail'));
        }
      });
    });
  }
  
  /**
   * Extract embedded subtitles
   */
  private static async extractSubtitles(
    inputPath: string,
    outputDir: string
  ): Promise<Array<any>> {
    const subtitles: Array<any> = [];
    
    // Get subtitle streams
    const streams = await this.getSubtitleStreams(inputPath);
    
    for (const stream of streams) {
      const outputFile = path.join(outputDir, `subtitle_${stream.index}.vtt`);
      
      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-i', inputPath,
          '-map', `0:${stream.index}`,
          '-c:s', 'webvtt',
          '-y',
          outputFile
        ]);
        
        ffmpeg.on('close', (code) => {
          if (code === 0) {
            subtitles.push({
              language: stream.language || `Track ${stream.index}`,
              label: stream.title || stream.language || `Subtitle ${stream.index}`,
              file: outputFile.replace(process.cwd(), ''),
              type: 'embedded'
            });
            resolve();
          } else {
            resolve(); // Don't fail if subtitle extraction fails
          }
        });
      });
    }
    
    return subtitles;
  }
  
  /**
   * Get subtitle streams from video
   */
  private static async getSubtitleStreams(inputPath: string): Promise<Array<any>> {
    return new Promise((resolve) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-select_streams', 's',
        '-show_entries', 'stream=index:stream_tags=language,title',
        '-of', 'json',
        inputPath
      ]);
      
      let output = '';
      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      ffprobe.on('close', () => {
        try {
          const info = JSON.parse(output);
          resolve(info.streams || []);
        } catch {
          resolve([]);
        }
      });
    });
  }
  
  /**
   * Convert video to HLS format with multiple qualities
   */
  private static async convertToHLS(
    inputPath: string,
    outputDir: string,
    videoInfo: VideoInfo,
    onProgress: (progress: number) => void
  ): Promise<Array<{ quality: string; file: string }>> {
    const qualities = this.determineQualities(videoInfo);
    const outputFiles: Array<{ quality: string; file: string }> = [];
    
    // Create master playlist content
    let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n';
    
    // Process each quality
    for (let i = 0; i < qualities.length; i++) {
      const quality = qualities[i];
      const playlistName = `${quality.name}/playlist.m3u8`;
      const resolution = `${quality.width}x${quality.height}`;
      
      await this.encodeQuality(
        inputPath,
        path.join(outputDir, quality.name),
        quality,
        (progress) => {
          const overallProgress = (i + progress) / qualities.length;
          onProgress(overallProgress);
        }
      );
      
      // Add to master playlist
      masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${quality.bitrate},RESOLUTION=${resolution}\n`;
      masterPlaylist += `${playlistName}\n`;
      
      outputFiles.push({
        quality: quality.name,
        file: playlistName
      });
    }
    
    // Write master playlist
    await fs.writeFile(
      path.join(outputDir, 'master.m3u8'),
      masterPlaylist
    );
    
    return outputFiles;
  }
  
  /**
   * Encode single quality
   */
  private static async encodeQuality(
    inputPath: string,
    outputDir: string,
    quality: any,
    onProgress: (progress: number) => void
  ): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true });
    
    return new Promise((resolve, reject) => {
      const args = [
        '-i', inputPath,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', quality.crf.toString(),
        '-vf', `scale=${quality.width}:${quality.height}:force_original_aspect_ratio=decrease,pad=${quality.width}:${quality.height}:(ow-iw)/2:(oh-ih)/2`,
        '-c:a', 'aac',
        '-ar', '48000',
        '-b:a', '128k',
        '-hls_time', '10',
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts'),
        '-progress', 'pipe:1',
        '-y',
        path.join(outputDir, 'playlist.m3u8')
      ];
      
      const ffmpeg = spawn('ffmpeg', args);
      
      ffmpeg.stdout.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/out_time_ms=(\d+)/);
        if (match && quality.duration) {
          const currentTime = parseInt(match[1]) / 1000000;
          const progress = Math.min(currentTime / quality.duration, 1);
          onProgress(progress);
        }
      });
      
      ffmpeg.stderr.on('data', (data) => {
        // console.error(`FFmpeg stderr: ${data}`);
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });
    });
  }
  
  /**
   * Determine encoding qualities based on source video
   */
  private static determineQualities(videoInfo: VideoInfo): Array<any> {
    const qualities = [];
    
    // Always include 480p
    qualities.push({
      name: '480p',
      width: 854,
      height: 480,
      bitrate: 1000000,
      crf: 28,
      duration: videoInfo.duration
    });
    
    // Include 1080p if source is HD
    if (videoInfo.height >= 1080) {
      qualities.push({
        name: '1080p',
        width: 1920,
        height: 1080,
        bitrate: 5000000,
        crf: 23,
        duration: videoInfo.duration
      });
    }
    
    return qualities;
  }
  
  /**
   * Ensure required directories exist
   */
  private static async ensureDirectories(paths: any): Promise<void> {
    await fs.mkdir(paths.hlsDir, { recursive: true });
    await fs.mkdir(paths.subtitlesDir, { recursive: true });
    await fs.mkdir(path.dirname(paths.thumbnailPath), { recursive: true });
  }
  
  /**
   * Send progress update via socket
   */
  private static sendProgress(progress: ProcessingProgress): void {
    socketService.emitProcessingProgress(progress);
  }
  
  /**
   * Cleanup original file after successful processing
   */
  private static async cleanupOriginalFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to cleanup original file:', error);
    }
  }
}