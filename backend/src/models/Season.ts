import mongoose, { Document, Schema, Types } from 'mongoose';

// ===== INTERFACES =====

interface IImages {
  poster?: string;
  banner?: string;
  thumbnail?: string;
}

interface IStats {
  viewCount: number;
  averageRating: number;
  totalRatings: number;
  completionRate: number; // Percentage of users who completed this season
}

interface ISeason extends Document {
  seriesId: Types.ObjectId;
  title: string;
  seasonNumber: number;
  seasonType: 'tv' | 'movie' | 'ova' | 'special' | 'ona';
  description?: string;
  episodeCount: number;
  airingStatus: 'not_yet_aired' | 'currently_airing' | 'finished_airing';
  airedFrom?: Date;
  airedTo?: Date;
  releaseYear?: number; // Specifically for movies
  images: IImages;
  stats: IStats;
  lastUpdated: Date;
}

// ===== SCHEMAS =====

const ImagesSchema = new Schema<IImages>({
  poster: { type: String },
  banner: { type: String },
  thumbnail: { type: String }
});

const StatsSchema = new Schema<IStats>({
  viewCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 10 },
  totalRatings: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0, min: 0, max: 100 }
});

const SeasonSchema = new Schema<ISeason>({
  seriesId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Series', 
    required: true,
    index: true
  },
  title: { type: String, required: true },
  seasonNumber: { 
    type: Number, 
    required: true,
    min: 0 // 0 for movies/specials that aren't numbered seasons
  },
  seasonType: { 
    type: String, 
    enum: ['tv', 'movie', 'ova', 'special', 'ona'],
    default: 'tv',
    required: true
  },
  description: { type: String },
  episodeCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  airingStatus: { 
    type: String, 
    enum: ['not_yet_aired', 'currently_airing', 'finished_airing'],
    default: 'not_yet_aired'
  },
  airedFrom: { type: Date },
  airedTo: { type: Date },
  releaseYear: { 
    type: Number,
    min: 1960,
    max: new Date().getFullYear() + 5
  },
  images: { type: ImagesSchema },
  stats: { type: StatsSchema, default: () => ({}) },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// ===== INDEXES =====
SeasonSchema.index({ seriesId: 1, seasonNumber: 1 }, { unique: true });
SeasonSchema.index({ seriesId: 1 });
SeasonSchema.index({ seasonType: 1 });
SeasonSchema.index({ airingStatus: 1 });
SeasonSchema.index({ airedFrom: 1 });
SeasonSchema.index({ 'stats.averageRating': -1 });
SeasonSchema.index({ 'stats.viewCount': -1 });

// ===== METHODS =====
SeasonSchema.methods.updateEpisodeCount = async function() {
  const Episode = mongoose.model('Episode');
  
  const count = await Episode.countDocuments({ 
    seasonId: this._id 
  });
  
  this.episodeCount = count;
  this.lastUpdated = new Date();
  
  return this.save();
};

SeasonSchema.methods.updateStats = async function() {
  const Episode = mongoose.model('Episode');
  
  // Update episode count
  await this.updateEpisodeCount();
  
  // Calculate average rating from episodes
  const ratingStats = await Episode.aggregate([
    { $match: { seasonId: this._id } },
    { 
      $group: {
        _id: null,
        avgRating: { $avg: '$stats.averageRating' },
        totalViews: { $sum: '$stats.viewCount' }
      }
    }
  ]);
  
  if (ratingStats.length > 0) {
    this.stats.averageRating = ratingStats[0].avgRating || 0;
    this.stats.viewCount = ratingStats[0].totalViews || 0;
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

SeasonSchema.methods.incrementViewCount = function() {
  this.stats.viewCount += 1;
  this.lastUpdated = new Date();
  return this.save();
};

// ===== VIRTUAL FIELDS =====
SeasonSchema.virtual('displayTitle').get(function() {
  if (this.seasonType === 'movie') {
    return this.title;
  } else if (this.seasonType === 'ova' || this.seasonType === 'special') {
    return `${this.title} (${this.seasonType.toUpperCase()})`;
  } else {
    return `${this.title}`;
  }
});

SeasonSchema.virtual('isMovie').get(function() {
  return this.seasonType === 'movie';
});

SeasonSchema.virtual('isSpecial').get(function() {
  return ['ova', 'special', 'ona'].includes(this.seasonType);
});

// ===== PRE HOOKS =====
SeasonSchema.pre('save', function(next) {
  // Auto-set release year for movies from airedFrom
  if (this.seasonType === 'movie' && this.airedFrom && !this.releaseYear) {
    this.releaseYear = this.airedFrom.getFullYear();
  }
  
  // Auto-set airingStatus based on dates
  const now = new Date();
  if (this.airedFrom && this.airedTo) {
    if (now < this.airedFrom) {
      this.airingStatus = 'not_yet_aired';
    } else if (now >= this.airedFrom && now <= this.airedTo) {
      this.airingStatus = 'currently_airing';
    } else {
      this.airingStatus = 'finished_airing';
    }
  }
  
  next();
});

// ===== POST HOOKS =====
SeasonSchema.post('save', async function(doc) {
  // Update parent series stats when season changes
  const Series = mongoose.model('Series');
  const series = await Series.findById(doc.seriesId);
  if (series) {
    await series.updateStats();
  }
});

SeasonSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
  // Update parent series stats when season is deleted
  const Series = mongoose.model('Series');
  const series = await Series.findById(doc.seriesId);
  if (series) {
    await series.updateStats();
  }
});

export const Season = mongoose.model<ISeason>('Season', SeasonSchema);
export type { ISeason, IImages as ISeasonImages, IStats as ISeasonStats };