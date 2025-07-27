import mongoose, { Document, Schema, Types } from 'mongoose';

// ===== INTERFACES =====

interface ITitle {
  english?: string;
  romaji?: string;
  japanese?: string;
}

interface IQuality {
  quality: string; // "480p", "1080p"
  bandwidth: number;
  resolution: string; // "1920x1080"
  manifestUrl: string; // Path to quality-specific playlist
}

interface IStreaming {
  hlsManifest: string; // Master playlist path
  availableQualities: IQuality[];
}

interface ISubtitle {
  id: string;
  language: string; // Language code: "en", "ja", "es"
  languageName: string; // Display name: "English", "Japanese"
  type: 'embedded' | 'admin_uploaded' | 'user_uploaded';
  format: 'vtt' | 'srt' | 'ass';
  fileUrl: string;
  isDefault: boolean;
  qualityScore: number; // 1-10 rating for subtitle quality
  uploadedBy?: Types.ObjectId; // User ID if user-uploaded
  moderationStatus?: 'pending' | 'approved' | 'rejected';
}

interface INavigation {
  previousEpisode?: Types.ObjectId;
  nextEpisode?: Types.ObjectId;
}

interface IFlags {
  isFiller: boolean;
  isRecap: boolean;
  hasPostCredits: boolean;
  isProcessing: boolean;
}

interface IStats {
  viewCount: number;
  averageRating: number;
  totalRatings: number;
  completionRate: number; // Percentage who watched to end
  averageWatchTime: number; // Average seconds watched
}

interface IEpisode extends Document {
  seriesId: Types.ObjectId;
  seasonId: Types.ObjectId;
  episodeNumber: number;
  title: ITitle;
  description?: string;
  duration: number; // Duration in seconds
  airDate?: Date;
  
  // Video & Streaming
  originalFilename: string;
  originalFileSize: number;
  thumbnail?: string;
  timelineThumbnails?: string; // VTT file with timeline thumbnails
  streaming: IStreaming;
  
  // Subtitles
  subtitles: ISubtitle[];
  
  // Navigation
  navigation: INavigation;
  
  // Episode metadata
  flags: IFlags;
  stats: IStats;
  
  // Processing
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingProgress: number; // 0-100
  processingJobId?: string;
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  processingError?: string;
  
  lastUpdated: Date;
}

// ===== SCHEMAS =====

const TitleSchema = new Schema<ITitle>({
  english: { type: String },
  romaji: { type: String },
  japanese: { type: String }
});

const QualitySchema = new Schema<IQuality>({
  quality: { type: String, required: true },
  bandwidth: { type: Number, required: true },
  resolution: { type: String, required: true },
  manifestUrl: { type: String, required: true }
});

const StreamingSchema = new Schema<IStreaming>({
  hlsManifest: { type: String, required: true },
  availableQualities: [QualitySchema]
});

const SubtitleSchema = new Schema<ISubtitle>({
  id: { type: String, required: true },
  language: { type: String, required: true },
  languageName: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['embedded', 'admin_uploaded', 'user_uploaded'],
    required: true
  },
  format: { 
    type: String, 
    enum: ['vtt', 'srt', 'ass'],
    required: true
  },
  fileUrl: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  qualityScore: { type: Number, min: 1, max: 10, default: 8 },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  moderationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  }
});

const NavigationSchema = new Schema<INavigation>({
  previousEpisode: { type: Schema.Types.ObjectId, ref: 'Episode' },
  nextEpisode: { type: Schema.Types.ObjectId, ref: 'Episode' }
});

const FlagsSchema = new Schema<IFlags>({
  isFiller: { type: Boolean, default: false },
  isRecap: { type: Boolean, default: false },
  hasPostCredits: { type: Boolean, default: false },
  isProcessing: { type: Boolean, default: false }
});

const StatsSchema = new Schema<IStats>({
  viewCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 10 },
  totalRatings: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0, min: 0, max: 100 },
  averageWatchTime: { type: Number, default: 0 }
});

const EpisodeSchema = new Schema<IEpisode>({
  seriesId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Series', 
    required: true,
    index: true
  },
  seasonId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Season', 
    required: true,
    index: true
  },
  episodeNumber: { 
    type: Number, 
    required: true,
    min: 0
  },
  title: { type: TitleSchema, required: true },
  description: { type: String },
  duration: { 
    type: Number, 
    required: true,
    min: 0 // Duration in seconds
  },
  airDate: { type: Date },
  
  // File & Processing
  originalFilename: { type: String, required: true },
  originalFileSize: { type: Number, required: true },
  thumbnail: { type: String },
  timelineThumbnails: { type: String },
  streaming: { type: StreamingSchema },
  
  // Content
  subtitles: [SubtitleSchema],
  navigation: { type: NavigationSchema, default: () => ({}) },
  flags: { type: FlagsSchema, default: () => ({}) },
  stats: { type: StatsSchema, default: () => ({}) },
  
  // Processing
  processingStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingProgress: { type: Number, default: 0, min: 0, max: 100 },
  processingJobId: { type: String },
  processingStartedAt: { type: Date },
  processingCompletedAt: { type: Date },
  processingError: { type: String },
  
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// ===== INDEXES =====
EpisodeSchema.index({ seriesId: 1, seasonId: 1, episodeNumber: 1 }, { unique: true });
EpisodeSchema.index({ seriesId: 1 });
EpisodeSchema.index({ seasonId: 1 });
EpisodeSchema.index({ processingStatus: 1 });
EpisodeSchema.index({ airDate: 1 });
EpisodeSchema.index({ 'stats.viewCount': -1 });
EpisodeSchema.index({ 'stats.averageRating': -1 });
EpisodeSchema.index({ 'title.english': 'text', 'title.romaji': 'text', description: 'text' });

// ===== METHODS =====
EpisodeSchema.methods.updateProcessingStatus = function(status: string, progress?: number, error?: string) {
  this.processingStatus = status;
  
  if (progress !== undefined) {
    this.processingProgress = progress;
  }
  
  if (status === 'processing' && !this.processingStartedAt) {
    this.processingStartedAt = new Date();
    this.flags.isProcessing = true;
  }
  
  if (status === 'completed' || status === 'failed') {
    this.processingCompletedAt = new Date();
    this.flags.isProcessing = false;
    if (status === 'completed') {
      this.processingProgress = 100;
    }
  }
  
  if (error) {
    this.processingError = error;
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

EpisodeSchema.methods.addSubtitle = function(subtitle: Partial<ISubtitle>) {
  const newSubtitle: ISubtitle = {
    id: `sub_${Date.now()}`,
    language: subtitle.language!,
    languageName: subtitle.languageName!,
    type: subtitle.type!,
    format: subtitle.format!,
    fileUrl: subtitle.fileUrl!,
    isDefault: subtitle.isDefault || false,
    qualityScore: subtitle.qualityScore || 8,
    uploadedBy: subtitle.uploadedBy,
    moderationStatus: subtitle.moderationStatus || 'approved'
  };
  
  this.subtitles.push(newSubtitle);
  this.lastUpdated = new Date();
  return this.save();
};

EpisodeSchema.methods.incrementViewCount = function() {
  this.stats.viewCount += 1;
  this.lastUpdated = new Date();
  return this.save();
};

EpisodeSchema.methods.updateNavigation = async function() {
  // Find previous and next episodes in the same season
  const prevEpisode = await mongoose.model('Episode').findOne({
    seasonId: this.seasonId,
    episodeNumber: { $lt: this.episodeNumber }
  }).sort({ episodeNumber: -1 });
  
  const nextEpisode = await mongoose.model('Episode').findOne({
    seasonId: this.seasonId,
    episodeNumber: { $gt: this.episodeNumber }
  }).sort({ episodeNumber: 1 });
  
  this.navigation.previousEpisode = prevEpisode?._id;
  this.navigation.nextEpisode = nextEpisode?._id;
  
  this.lastUpdated = new Date();
  return this.save();
};

// ===== VIRTUAL FIELDS =====
EpisodeSchema.virtual('primaryTitle').get(function() {
  return this.title.english || this.title.romaji || this.title.japanese;
});

EpisodeSchema.virtual('durationFormatted').get(function() {
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

EpisodeSchema.virtual('isReady').get(function() {
  return this.processingStatus === 'completed' && !this.flags.isProcessing;
});

EpisodeSchema.virtual('hasSubtitles').get(function() {
  return this.subtitles && this.subtitles.length > 0;
});

// ===== PRE HOOKS =====
EpisodeSchema.pre('save', function(next) {
  // Auto-update navigation when episode number changes
  if (this.isModified('episodeNumber')) {
    this.updateNavigation().catch(console.error);
  }
  next();
});

// ===== POST HOOKS =====
EpisodeSchema.post('save', async function(doc) {
  // Update parent season stats when episode changes
  const Season = mongoose.model('Season');
  const season = await Season.findById(doc.seasonId);
  if (season) {
    await season.updateStats();
  }
  
  // Update navigation for adjacent episodes
  if (doc.isModified('episodeNumber')) {
    const adjacentEpisodes = await mongoose.model('Episode').find({
      seasonId: doc.seasonId,
      _id: { $ne: doc._id }
    });
    
    for (const episode of adjacentEpisodes) {
      await episode.updateNavigation();
    }
  }
});

EpisodeSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
  // Update parent season stats when episode is deleted
  const Season = mongoose.model('Season');
  const season = await Season.findById(doc.seasonId);
  if (season) {
    await season.updateStats();
  }
});

export const Episode = mongoose.model<IEpisode>('Episode', EpisodeSchema);
export type { 
  IEpisode, 
  ITitle as IEpisodeTitle, 
  IQuality, 
  IStreaming, 
  ISubtitle, 
  INavigation, 
  IFlags, 
  IStats as IEpisodeStats 
};