const { getJobStatus, videoQueue } = require('../config/queue');
const Episode = require('../models/Episode');
const AdminNotification = require('../models/AdminNotification');
const path = require('path');
const fs = require('fs/promises');

/**
 * Get processing status for an episode
 * GET /admin/episodes/:id/processing-status
 */
const getProcessingStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Get episode
    const episode = await Episode.findById(id);
    if (!episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }

    // Get job status from queue
    const jobId = `video-${id}`;
    const jobStatus = await getJobStatus(jobId);

    res.json({
      success: true,
      data: {
        episode: {
          id: episode._id,
          title: episode.title,
          processingStatus: episode.processingStatus
        },
        job: jobStatus
      }
    });

  } catch (error) {
    console.error('❌ Get processing status error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all processing jobs
 * GET /admin/processing/jobs
 */
const getAllProcessingJobs = async (req, res) => {
  try {
    const { videoQueue } = require('../config/queue');
    
    const [waiting, active, completed, failed] = await Promise.all([
      videoQueue.getWaiting(),
      videoQueue.getActive(),
      videoQueue.getCompleted(0, 10),
      videoQueue.getFailed(0, 10)
    ]);

    res.json({
      success: true,
      data: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        jobs: {
          waiting: waiting.map(j => ({ id: j.id, data: j.data })),
          active: active.map(j => ({ id: j.id, data: j.data, progress: j.progress })),
          completed: completed.map(j => ({ id: j.id, finishedOn: j.finishedOn })),
          failed: failed.map(j => ({ id: j.id, failedReason: j.failedReason }))
        }
      }
    });

  } catch (error) {
    console.error('❌ Get all processing jobs error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Cancel processing job for an episode
 * POST /admin/episodes/:id/cancel-processing
 */
const cancelProcessing = async (req, res) => {
  try {
    const { id } = req.params;

    // Get episode
    const episode = await Episode.findById(id);
    if (!episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }

    // Check if episode is being processed
    if (episode.processingStatus !== 'processing') {
      return res.status(400).json({
        success: false,
        error: 'Episode is not being processed'
      });
    }

    console.log(`🛑 Cancelling processing for episode: ${id}`);
    console.log(`   Current stage: ${episode.processingStage}`);

    // Cancel upscale process if running
    if (episode.processingStage === 'upscaling') {
      console.log('   Cancelling upscale process...');
      try {
        const UpscaleService = (await import('../services/upscale.service.js')).default;
        UpscaleService.cancelUpscale();
      } catch (importError) {
        console.error('   Failed to import UpscaleService:', importError.message);
      }
    }

    // Find and remove job from queue
    const jobId = `video-${id}`;
    
    // Try to find job in different states
    const [waitingJobs, activeJobs] = await Promise.all([
      videoQueue.getWaiting(),
      videoQueue.getActive()
    ]);

    // Find the job
    let job = waitingJobs.find(j => j.id.includes(id));
    if (!job) {
      job = activeJobs.find(j => j.id.includes(id));
    }

    if (job) {
      console.log(`   Found job: ${job.id}`);
      try {
        // Force remove even if locked
        await job.remove({ removeOnComplete: true, removeOnFail: true });
        console.log('   Job removed from queue');
      } catch (removeError) {
        // If normal remove fails, try to moveToFailed to trigger cleanup
        console.log('   Normal remove failed, forcing fail state...');
        try {
          await job.moveToFailed({ message: 'Cancelled by admin' }, true);
          await job.remove();
          console.log('   Job moved to failed and removed');
        } catch (failError) {
          console.error('   Failed to remove job:', failError.message);
          // Continue anyway - will cleanup files
        }
      }
    } else {
      console.log('   Job not found in queue (may have just completed)');
    }

    // Cleanup episode files
    const episodeDir = path.join(
      process.cwd(),
      'uploads',
      'videos',
      id.toString()
    );

    const tempDir = path.join(
      process.cwd(),
      'temp',
      'upscale',
      id.toString()
    );

    // Delete episode directory
    try {
      await fs.rm(episodeDir, { recursive: true, force: true });
      console.log('   Deleted episode directory');
    } catch (err) {
      console.error('   Failed to delete episode directory:', err.message);
    }

    // Delete temp upscale directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log('   Deleted temp upscale directory');
    } catch (err) {
      console.error('   Failed to delete temp directory:', err.message);
    }

    // Delete episode from database
    await Episode.findByIdAndDelete(id);
    console.log('   Episode deleted from database');
    
    // Delete admin notification
    try {
      await AdminNotification.deleteMany({
        episodeId: id,
        type: 'upload'
      });
      console.log('   Deleted admin upload notification');
    } catch (err) {
      console.error('   Failed to delete notification:', err.message);
    }

    console.log('✅ Processing cancelled successfully');

    res.json({
      success: true,
      message: 'Processing cancelled, episode and notification deleted successfully'
    });

  } catch (error) {
    console.error('❌ Cancel processing error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getProcessingStatus,
  getAllProcessingJobs,
  cancelProcessing
};