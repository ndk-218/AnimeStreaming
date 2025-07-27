// @ts-nocheck
const mongoose = require('mongoose');

// ===== SIMPLE PROCESSING JOB SCHEMA =====
const processingJobSchema = new mongoose.Schema(
  {
    episodeId: { 
      type: mongoose.Schema.Types.ObjectId, 
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
    errorMessage: String,
    startedAt: Date,
    completedAt: Date
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ===== BASIC INDEXES =====
processingJobSchema.index({ episodeId: 1 });
processingJobSchema.index({ status: 1 });
processingJobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ProcessingJob', processingJobSchema);