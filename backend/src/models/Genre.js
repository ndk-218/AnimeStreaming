const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 300
  },
  // Metadata for tracking usage
  seriesCount: {
    type: Number,
    default: 0
  },
  // ✅ NEW: Track total view count for trending/ranking
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search performance
genreSchema.index({ name: 'text' });
// Remove duplicate name index since name field already has unique: true
genreSchema.index({ isActive: 1 });
// ✅ NEW: Index for sorting by viewCount
genreSchema.index({ viewCount: -1 });

// Virtual for search compatibility
genreSchema.virtual('displayName').get(function() {
  return this.name;
});

module.exports = mongoose.model('Genre', genreSchema);
