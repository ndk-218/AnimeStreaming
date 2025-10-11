import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

console.log('🔌 Initializing Redis connection for queue...');

// Redis connection
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
});

// Redis event listeners
redisConnection.on('connect', () => {
  console.log('✅ Queue Redis connected');
});

redisConnection.on('error', (err) => {
  console.error('❌ Queue Redis error:', err.message);
});

redisConnection.on('close', () => {
  console.log('⚠️ Queue Redis connection closed');
});

console.log('📦 Creating video processing queue...');

// Video processing queue
export const videoQueue = new Queue('video-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry 3 lần nếu fail
    backoff: {
      type: 'exponential',
      delay: 5000 // 5s, 10s, 20s
    },
    removeOnComplete: {
      age: 24 * 3600, // Giữ job history 24h
      count: 100
    },
    removeOnFail: {
      age: 7 * 24 * 3600 // Giữ failed jobs 7 ngày
    }
  }
});

console.log('✅ Video processing queue created');

// Helper để add job vào queue
export const addVideoProcessingJob = async (episodeId, videoPath) => {
  const timestamp = Date.now();
  const jobId = `video-${episodeId}-${timestamp}`;
  
  console.log(`\n📥 Adding job to queue:`);
  console.log(`   Episode ID: ${episodeId}`);
  console.log(`   Video Path: ${videoPath}`);
  console.log(`   Job ID: ${jobId}`);
  console.log(`   Timestamp: ${new Date(timestamp).toISOString()}`);
  
  const job = await videoQueue.add(
    'process-video',
    {
      episodeId,
      videoPath
    },
    {
      jobId: jobId, // Unique job ID with timestamp
      priority: 1 // Higher priority = process first
    }
  );
  
  console.log(`✅ Job added successfully!`);
  console.log(`   Queue: video-processing`);
  console.log(`   Job Name: process-video`);
  console.log(`   Job ID: ${job.id}`);
  console.log(`   Job State: ${await job.getState()}\n`);
  
  return job;
};

// Helper để check job status
export const getJobStatus = async (jobId) => {
  const job = await videoQueue.getJob(jobId);
  if (!job) return null;

  return {
    id: job.id,
    progress: job.progress,
    state: await job.getState(),
    failedReason: job.failedReason,
    finishedOn: job.finishedOn
  };
};

export default videoQueue;