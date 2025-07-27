import mongoose, { Document, Schema } from 'mongoose';

// ===== INTERFACES =====

interface ITitle {
  english?: string;
  romaji?: string;
  japanese?: string;
  synonyms?: string[];
}

interface IImages {
  poster?: string;
  banner?: string;
  thumbnail?: string;
  screenshots?: string[];
}

interface IExternalLinks {
  malId?: number;
  anilistId?: number;
  officialSite?: string;
}

interface IStats {
  totalSeasons: number;
  totalEpisodes: number;
  averageRating: number;
  totalRatings: number;
  viewCount: number;
  favoriteCount: number;
}

interface ISeries extends Document {
  title: ITitle;
  description: string;
  genres: string[];
  tags: string[];
  studio: string;
  director?: string;
  source: 'manga' | 'novel' | 'original' | 'game' | 'web_manga' | 'other';
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  releaseYear: number;
  rating: 'G' | 'PG' | 'PG-13' | 'R' | 'R+' | 'Rx';
  contentWarnings: string[];
  images: IImages;
  externalLinks: IExternalLinks;
  stats: IStats;
  slug: string;
  lastUpdated: Date;
}

// ===== SCHEMAS =====

const TitleSchema = new Schema<ITitle>({
  english: { type: String },
  romaji: { type: String },
  japanese: { type: String },
  synonyms: [{ type: String }]
});

const ImagesSchema = new Schema<IImages>({
  poster: { type: String },
  banner: { type: String },
  thumbnail: { type: String },
  screenshots: [{ type: String }]
});

const ExternalLinksSchema = new Schema<IExternalLinks>({
  malId: { type: Number },
  anilistId: { type: Number },
  officialSite: { type: String }
});

const StatsSchema = new Schema<IStats>({
  totalSeasons: { type: Number, default: 0 },
  totalEpisodes: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 10 },
  totalRatings: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  favoriteCount: { type: Number, default: 0 }
});

const SeriesSchema = new Schema<ISeries>({
  title: { type: TitleSchema, required: true },
  description: { type: String, required: true },
  genres: [{ 
    type: String, 
    required: true,
    enum: [
      'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
      'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 
      'Supernatural', 'Thriller', 'Ecchi', 'Harem', 'Josei', 'Kids',
      'Magic', 'Martial Arts', 'Mecha', 'Military', 'Music', 'Parody',
      'Police', 'Psychological', 'School', 'Seinen', 'Shoujo', 'Shounen',
      'Space', 'Super Power', 'Vampire', 'Yaoi', 'Yuri', 'Hentai'
    ]
  }],
  tags: [{ type: String }],
  studio: { type: String, required: true },
  director: { type: String },
  source: { 
    type: String, 
    enum: ['manga', 'novel', 'original', 'game', 'web_manga', 'other'],
    default: 'manga'
  },
  status: { 
    type: String, 
    enum: ['ongoing', 'completed', 'hiatus', 'cancelled'],
    default: 'ongoing'
  },
  releaseYear: { 
    type: Number, 
    required: true,
    min: 1960,
    max: new Date().getFullYear() + 2
  },
  rating: { 
    type: String, 
    enum: ['G', 'PG', 'PG-13', 'R', 'R+', 'Rx'],
    default: 'PG-13'
  },
  contentWarnings: [{ type: String }],
  images: { type: ImagesSchema },
  externalLinks: { type: ExternalLinksSchema },
  stats: { type: StatsSchema, default: () => ({}) },
  slug: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// ===== INDEXES =====
SeriesSchema.index({ slug: 1 }, { unique: true });
SeriesSchema.index({ 'title.english': 'text', 'title.romaji': 'text', 'title.japanese': 'text', description: 'text' });
SeriesSchema.index({ genres: 1 });
SeriesSchema.index({ studio: 1 });
SeriesSchema.index({ status: 1 });
SeriesSchema.index({ releaseYear: 1 });
SeriesSchema.index({ 'stats.averageRating': -1 });
SeriesSchema.index({ 'stats.viewCount': -1 });
SeriesSchema.index({ createdAt: -1 });

// ===== METHODS =====
SeriesSchema.methods.updateStats = async function() {
  const Season = mongoose.model('Season');
  const Episode = mongoose.model('Episode');
  
  // Đếm total seasons và episodes
  const totalSeasons = await Season.countDocuments({ seriesId: this._id });
  const totalEpisodes = await Episode.countDocuments({ seriesId: this._id });
  
  // Update stats
  this.stats.totalSeasons = totalSeasons;
  this.stats.totalEpisodes = totalEpisodes;
  this.lastUpdated = new Date();
  
  return this.save();
};

SeriesSchema.methods.incrementViewCount = function() {
  this.stats.viewCount += 1;
  this.lastUpdated = new Date();
  return this.save();
};

// ===== VIRTUAL FIELDS =====
SeriesSchema.virtual('primaryTitle').get(function() {
  return this.title.english || this.title.romaji || this.title.japanese;
});

SeriesSchema.virtual('allTitles').get(function() {
  const titles = [];
  if (this.title.english) titles.push(this.title.english);
  if (this.title.romaji) titles.push(this.title.romaji);
  if (this.title.japanese) titles.push(this.title.japanese);
  if (this.title.synonyms) titles.push(...this.title.synonyms);
  return titles;
});

// ===== PRE HOOKS =====
SeriesSchema.pre('save', function(next) {
  // Auto-generate slug from title if not provided
  if (!this.slug && this.title.english) {
    this.slug = this.title.english
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

export const Series = mongoose.model<ISeries>('Series', SeriesSchema);
export type { ISeries, ITitle, IImages, IExternalLinks, IStats };