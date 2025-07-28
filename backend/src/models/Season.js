const mongoose = require('mongoose');

// ===== UPDATED SEASON SCHEMA =====
const seasonSchema = new mongoose.Schema(
  {
    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Series',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    seasonNumber: {
      type: Number,
      required: true,
      min: 0
    },
    seasonType: {
      type: String,
      enum: ['tv', 'movie', 'ova', 'special'],
      default: 'tv'
    },
    releaseYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 5
    },
    description: String,
    posterImage: String,
    episodeCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['upcoming', 'airing', 'completed'],
      default: 'upcoming'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ===== UPDATED INDEXES =====
// Cho phép multiple movies với cùng series
// Movie được đánh số theo year thay vì sequential number
seasonSchema.index({ seriesId: 1, seasonNumber: 1, seasonType: 1 }, { unique: true });
seasonSchema.index({ status: 1 });
seasonSchema.index({ seasonType: 1 });

module.exports = mongoose.model('Season', seasonSchema);