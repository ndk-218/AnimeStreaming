import { Worker } from 'bullmq';
import Redis from 'ioredis';
import videoProcessorService from '../services/videoProcessor.service.js';
import Episode from '../models/Episode.js';

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
});

// Create worker to process video jobs
const videoWorker = new Worker(
  'video-processing',
  async (job) => {
    const { episodeId, videoPath } = job.data;

    console.log(`\n🎬 [Worker] Starting video processing`);
    console.log(`   Episode ID: ${episodeId}`);
    console.log(`   Video Path: ${videoPath}\n`);

    try {
      // Process video với progress updates
      const result = await videoProcessorService.processVideo(
        episodeId,
        videoPath,
        (progress, message) => {
          // Update job progress
          job.updateProgress({
            percent: Math.round(progress),
            message
          });
          
          console.log(`[Worker] ${episodeId} - ${Math.round(progress)}%: ${message}`);
        }
      );

      console.log(`\n✅ [Worker] Video processing completed`);
      console.log(`   Qualities: ${result.qualities.map(q => q.quality).join(', ')}`);
      console.log(`   Subtitles: ${result.subtitles.length}\n`);
      
      return result;
    } catch (error) {
      console.error(`\n❌ [Worker] Video processing failed:`, error.message);
      
      // Update episode status to failed
      await Episode.findByIdAndUpdate(episodeId, {
        processingStatus: 'failed'
      });
      
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Process 2 videos simultaneously
    limiter: {
      max: 5, // Max 5 jobs
      duration: 60000 // Per 60 seconds
    }
  }
);

// Worker event listeners
videoWorker.on('completed', (job) => {
  console.log(`✅ [Worker] Job ${job.id} completed successfully`);
});

videoWorker.on('failed', (job, err) => {
  console.error(`❌ [Worker] Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
});

videoWorker.on('progress', (job, progress) => {
  console.log(`📊 [Worker] Job ${job.id} progress: ${progress.percent}% - ${progress.message}`);
});

videoWorker.on('error', (err) => {
  console.error(`❌ [Worker] Worker error:`, err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 [Worker] Received SIGTERM, shutting down gracefully...');
  await videoWorker.close();
  await redisConnection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 [Worker] Received SIGINT, shutting down gracefully...');
  await videoWorker.close();
  await redisConnection.quit();
  process.exit(0);
});

console.log('🎬 Video Processing Worker Started');
console.log('📊 Concurrency: 2 videos');
console.log('⏰ Rate limit: 5 jobs per minute');
console.log('🔄 Waiting for jobs...\n');

export default videoWorker;