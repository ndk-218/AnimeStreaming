const mongoose = require('mongoose');

// ===== SUB SCHEMAS =====
const subtitleSchema = new mongoose.Schema({
  language: { type: String, required: true },
  label: { type: String, required: true },
  file: { type: String, required: true }
}, { _id: false, versionKey: false });

const videoQualitySchema = new mongoose.Schema({
  quality: { type: String, enum: ['480p', '1080p'], required: true },
  file: { type: String, required: true }
}, { _id: false, versionKey: false });

// ===== SIMPLE EPISODE SCHEMA =====
const episodeSchema = new mongoose.Schema(
  {
    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Series',
      required: true
      // Removed index: true to avoid duplicate
    },
    seasonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Season',
      required: true
      // Removed index: true to avoid duplicate
    },
    episodeNumber: {
      type: Number,
      required: true,
      min: 1
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    duration: Number,
    thumbnail: String,
    hlsPath: String,
    qualities: [videoQualitySchema],
    subtitles: [subtitleSchema],
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    viewCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ===== INDEXES (Clean, no duplicates) =====
episodeSchema.index({ seasonId: 1, episodeNumber: 1 }, { unique: true });
episodeSchema.index({ processingStatus: 1 });
episodeSchema.index({ seriesId: 1 }); // Only define once here
episodeSchema.index({ viewCount: -1 });

module.exports = mongoose.model('Episode', episodeSchema);