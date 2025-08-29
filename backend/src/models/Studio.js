const mongoose = require('mongoose');

const studioSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Metadata for tracking usage
  seriesCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search performance
studioSchema.index({ name: 'text' });
studioSchema.index({ name: 1, isActive: 1 });

// Virtual for search compatibility
studioSchema.virtual('displayName').get(function() {
  return this.name;
});

module.exports = mongoose.model('Studio', studioSchema);
