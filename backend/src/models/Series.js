const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  originalTitle: {
    type: String,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  releaseYear: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 10
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'hiatus', 'cancelled'],
    default: 'ongoing'
  },
  // Image fields - will be added in Priority 3
  posterImage: String,
  bannerImage: String,
  
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
  },
  totalEpisodes: {
    type: Number,
    default: 0
  },
  totalSeasons: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
seriesSchema.index({ title: 'text', originalTitle: 'text', description: 'text' });
seriesSchema.index({ slug: 1 });
seriesSchema.index({ releaseYear: 1, status: 1 });
seriesSchema.index({ createdAt: -1 }); // For recent series
seriesSchema.index({ viewCount: -1 }); // For popular series

// Pre-save middleware to generate slug
seriesSchema.pre('save', async function(next) {
  if (this.isModified('title') && !this.slug) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure unique slug
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Virtual for seasons
seriesSchema.virtual('seasons', {
  ref: 'Season',
  localField: '_id',
  foreignField: 'seriesId'
});

module.exports = mongoose.model('Series', seriesSchema);
