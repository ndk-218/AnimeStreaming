const mongoose = require('mongoose');

// ===== SUPER SIMPLE SERIES SCHEMA =====
const seriesSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true 
    },
    originalTitle: { 
      type: String, 
      trim: true 
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true 
    },
    description: String,
    releaseYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 5
    },
    status: {
      type: String,
      enum: ['ongoing', 'completed', 'upcoming'],
      default: 'upcoming'
    },
    genres: [{
      type: String,
      trim: true
    }],
    studio: {
      type: String,
      trim: true
    },
    posterImage: String,
    bannerImage: String,
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

// ===== BASIC INDEXES =====
seriesSchema.index({ title: 'text' });
seriesSchema.index({ slug: 1 });
seriesSchema.index({ genres: 1 });

// ===== AUTO SLUG GENERATION =====
seriesSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim('-');
  }
  next();
});

module.exports = mongoose.model('Series', seriesSchema);