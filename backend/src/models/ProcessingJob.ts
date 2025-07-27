import mongoose, { Schema, Document, Types } from 'mongoose';

// ===== INTERFACE ĐƠN GIẢN =====
export interface IProcessingJob extends Document {
  episodeId: Types.ObjectId;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  inputFile: string;
  outputDir: string;
  errorMessage?: string;
}

// ===== SCHEMA ĐƠN GIẢN =====
const processingJobSchema = new Schema<IProcessingJob>(
  {
    episodeId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Episode', 
      required: true,
      index: true
    },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    progress: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 100 
    },
    inputFile: { 
      type: String, 
      required: true 
    },
    outputDir: { 
      type: String, 
      required: true 
    },
    errorMessage: String
  },
  {
    timestamps: true,
    versionKey: false // Disable __v
  }
);

// ===== INDEX CƠ BẢN =====
processingJobSchema.index({ episodeId: 1 });
processingJobSchema.index({ status: 1 });

// ===== METHODS ĐƠN GIẢN =====
processingJobSchema.methods.updateProgress = function(progress: number, status?: string) {
  this.progress = Math.min(100, Math.max(0, progress));
  if (status) {
    this.status = status;
  }
  return this.save();
};

processingJobSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.progress = 100;
  return this.save();
};

processingJobSchema.methods.markFailed = function(error: string) {
  this.status = 'failed';
  this.errorMessage = error;
  return this.save();
};

export const ProcessingJob = mongoose.model<IProcessingJob>('ProcessingJob', processingJobSchema);