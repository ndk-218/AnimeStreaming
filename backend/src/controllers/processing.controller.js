const { getJobStatus } = require('../config/queue');
const Episode = require('../models/Episode');

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

module.exports = {
  getProcessingStatus,
  getAllProcessingJobs
};