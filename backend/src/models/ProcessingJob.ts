import mongoose, { Document, Schema, Types } from 'mongoose';

// ===== INTERFACES =====

interface IOutputFiles {
  masterPlaylist?: string;
  qualities: {
    [quality: string]: {
      playlist: string;
      segmentCount: number;
      totalSize: number; // bytes
    };
  };
  thumbnail?: string;
  timelineThumbnails?: string;
  subtitles?: string[];
}

interface IProgress {
  currentStep: string;
  percentage: number;
  estimatedTimeRemaining?: number; // seconds
  startedAt: Date;
  completedSteps: string[];
}

interface IErrorDetails {
  code: string;
  message: string;
  stack?: string;
  ffmpegError?: string;
  step?: string;
}

interface IProcessingJob extends Document {
  // Job identification
  jobId: string; // BullMQ job ID
  episodeId: Types.ObjectId;
  
  // Job details
  jobType: 'hls_conversion' | 'subtitle_extraction' | 'thumbnail_generation';
  priority: 'low' | 'normal' | 'high';
  
  // Input file info
  inputFile: {
    path: string;
    filename: string;
    size: number;
    format: string;
    duration?: number;
  };
  
  // Output configuration
  outputConfig: {
    qualities: string[]; // ['480p', '1080p']
    segmentDuration: number; // seconds
    outputDir: string;
  };
  
  // Processing status
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: IProgress;
  
  // Results
  outputFiles: IOutputFiles;
  
  // Error handling
  error?: IErrorDetails;
  retryCount: number;
  maxRetries: number;
  
  // Timestamps
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ===== SCHEMAS =====

const OutputQualitySchema = new Schema({
  playlist: { type: String, required: true },
  segmentCount: { type: Number, default: 0 },
  totalSize: { type: Number, default: 0 }
});

const OutputFilesSchema = new Schema<IOutputFiles>({
  masterPlaylist: { type: String },
  qualities: { type: Map, of: OutputQualitySchema },
  thumbnail: { type: String },
  timelineThumbnails: { type: String },
  subtitles: [{ type: String }]
});

const ProgressSchema = new Schema<IProgress>({
  currentStep: { type: String, default: 'Initializing' },
  percentage: { type: Number, default: 0, min: 0, max: 100 },
  estimatedTimeRemaining: { type: Number },
  startedAt: { type: Date, default: Date.now },
  completedSteps: [{ type: String }]
});

const ErrorDetailsSchema = new Schema<IErrorDetails>({
  code: { type: String, required: true },
  message: { type: String, required: true },
  stack: { type: String },
  ffmpegError: { type: String },
  step: { type: String }
});

const InputFileSchema = new Schema({
  path: { type: String, required: true },
  filename: { type: String, required: true },
  size: { type: Number, required: true },
  format: { type: String, required: true },
  duration: { type: Number }
});

const OutputConfigSchema = new Schema({
  qualities: [{ 
    type: String, 
    enum: ['480p', '1080p'],
    required: true 
  }],
  segmentDuration: { type: Number, default: 10 },
  outputDir: { type: String, required: true }
});

const ProcessingJobSchema = new Schema<IProcessingJob>({
  jobId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  episodeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Episode', 
    required: true,
    index: true
  },
  
  jobType: { 
    type: String, 
    enum: ['hls_conversion', 'subtitle_extraction', 'thumbnail_generation'],
    default: 'hls_conversion'
  },
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  
  inputFile: { type: InputFileSchema, required: true },
  outputConfig: { type: OutputConfigSchema, required: true },
  
  status: { 
    type: String, 
    enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'queued',
    index: true
  },
  progress: { type: ProgressSchema, default: () => ({}) },
  
  outputFiles: { type: OutputFilesSchema, default: () => ({}) },
  
  error: { type: ErrorDetailsSchema },
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  
  queuedAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date }
}, {
  timestamps: true
});

// ===== INDEXES =====
ProcessingJobSchema.index({ jobId: 1 }, { unique: true });
ProcessingJobSchema.index({ episodeId: 1 });
ProcessingJobSchema.index({ status: 1 });
ProcessingJobSchema.index({ priority: 1, queuedAt: 1 });
ProcessingJobSchema.index({ createdAt: -1 });

// ===== VIRTUAL FIELDS =====
ProcessingJobSchema.virtual('isCompleted').get(function() {
  return ['completed', 'failed', 'cancelled'].includes(this.status);
});

ProcessingJobSchema.virtual('duration').get(function() {
  if (!this.startedAt) return null;
  const endTime = this.completedAt || new Date();
  return Math.floor((endTime.getTime() - this.startedAt.getTime()) / 1000);
});

ProcessingJobSchema.virtual('canRetry').get(function() {
  return this.status === 'failed' && this.retryCount < this.maxRetries;
});

// ===== METHODS =====

ProcessingJobSchema.methods.updateProgress = function(
  step: string, 
  percentage: number, 
  estimatedTimeRemaining?: number
) {
  this.progress.currentStep = step;
  this.progress.percentage = Math.min(100, Math.max(0, percentage));
  
  if (estimatedTimeRemaining) {
    this.progress.estimatedTimeRemaining = estimatedTimeRemaining;
  }
  
  // Add to completed steps if at 100%
  if (percentage === 100 && !this.progress.completedSteps.includes(step)) {
    this.progress.completedSteps.push(step);
  }
  
  return this.save();
};

ProcessingJobSchema.methods.markAsStarted = function() {
  this.status = 'processing';
  this.startedAt = new Date();
  this.progress.startedAt = new Date();
  return this.save();
};

ProcessingJobSchema.methods.markAsCompleted = function(outputFiles: Partial<IOutputFiles>) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.progress.percentage = 100;
  this.progress.currentStep = 'Completed';
  this.outputFiles = { ...this.outputFiles, ...outputFiles };
  return this.save();
};

ProcessingJobSchema.methods.markAsFailed = function(error: Partial<IErrorDetails>) {
  this.status = 'failed';
  this.completedAt = new Date();
  this.error = {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    stack: error.stack,
    ffmpegError: error.ffmpegError,
    step: error.step || this.progress.currentStep
  };
  return this.save();
};

ProcessingJobSchema.methods.retry = function() {
  if (!this.canRetry) {
    throw new Error('Job cannot be retried');
  }
  
  this.retryCount += 1;
  this.status = 'queued';
  this.progress = {
    currentStep: 'Retrying',
    percentage: 0,
    startedAt: new Date(),
    completedSteps: []
  };
  this.error = undefined;
  this.startedAt = undefined;
  this.completedAt = undefined;
  
  return this.save();
};

ProcessingJobSchema.methods.cancel = function() {
  if (this.isCompleted) {
    throw new Error('Cannot cancel completed job');
  }
  
  this.status = 'cancelled';
  this.completedAt = new Date();
  this.progress.currentStep = 'Cancelled';
  
  return this.save();
};

// ===== STATIC METHODS =====

ProcessingJobSchema.statics.getQueueStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        stats: {
          $push: {
            status: '$_id',
            count: '$count'
          }
        }
      }
    }
  ]);
};

ProcessingJobSchema.statics.getActiveJobs = function() {
  return this.find({
    status: { $in: ['queued', 'processing'] }
  }).sort({ priority: -1, queuedAt: 1 });
};

ProcessingJobSchema.statics.getFailedJobs = function() {
  return this.find({ status: 'failed' })
    .sort({ completedAt: -1 })
    .limit(50);
};

// ===== PRE HOOKS =====
ProcessingJobSchema.pre('save', function(next) {
  // Auto-set jobId if not provided
  if (!this.jobId) {
    this.jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  next();
});

// ===== POST HOOKS =====
ProcessingJobSchema.post('save', async function(doc) {
  // Update episode processing status when job status changes
  if (doc.isModified('status')) {
    const Episode = mongoose.model('Episode');
    const episode = await Episode.findById(doc.episodeId);
    
    if (episode) {
      await episode.updateProcessingStatus(
        doc.status, 
        doc.progress.percentage, 
        doc.error?.message
      );
    }
  }
});

export const ProcessingJob = mongoose.model<IProcessingJob>('ProcessingJob', ProcessingJobSchema);
export type { 
  IProcessingJob, 
  IOutputFiles, 
  IProgress, 
  IErrorDetails 
};