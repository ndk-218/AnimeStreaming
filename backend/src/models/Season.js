const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  seriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Series',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  seasonNumber: {
    type: Number,
    required: true,
    min: 1
  },
  seasonType: {
    type: String,
    enum: ['tv', 'movie', 'ova', 'special'],
    required: true,
    default: 'tv'
  },
  releaseYear: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 10
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Studio and Genre relationships - moved from Series
  studios: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Studio'
  }],
  genres: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Genre'
  }],
  
  // Season status
  status: {
    type: String,
    enum: ['upcoming', 'airing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  
  // Episode count - calculated automatically
  episodeCount: {
    type: Number,
    default: 0
  },
  
  // Upscale flag - determines if episodes should be upscaled
  isUpscaled: {
    type: Boolean,
    default: false
  },
  
  // Images - will be implemented in Priority 3
  posterImage: String,
  thumbnailImage: String,
  
  // Metadata
  viewCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
seasonSchema.index({ seriesId: 1, seasonNumber: 1, seasonType: 1 });
seasonSchema.index({ seriesId: 1, createdAt: -1 });
seasonSchema.index({ releaseYear: 1, seasonType: 1 });

// Virtual for episodes
seasonSchema.virtual('episodes', {
  ref: 'Episode',
  localField: '_id',
  foreignField: 'seasonId'
});

// Virtual for populated studios
seasonSchema.virtual('studioNames').get(function() {
  if (this.populated('studios')) {
    return this.studios.map(studio => studio.name);
  }
  return [];
});

// Virtual for populated genres
seasonSchema.virtual('genreNames').get(function() {
  if (this.populated('genres')) {
    return this.genres.map(genre => genre.name);
  }
  return [];
});

module.exports = mongoose.model('Season', seasonSchema);
