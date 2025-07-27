import mongoose, { Schema } from 'mongoose';
import { IEpisodeDocument, ISubtitle, IVideoQuality } from '../types/episode.types';

const subtitleSchema = new Schema<ISubtitle>({
  language: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  file: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['embedded', 'uploaded'],
    default: 'uploaded'
  }
}, { _id: false });

const videoQualitySchema = new Schema<IVideoQuality>({
  quality: {
    type: String,
    enum: ['480p', '720p', '1080p'],
    required: true
  },
  file: {
    type: String,
    required: true
  }
}, { _id: false });

const episodeSchema = new Schema<IEpisodeDocument>(
  {
    seriesId: {
      type: Schema.Types.ObjectId,
      ref: 'Series',
      required: [true, 'Series ID is required'],
      index: true
    },
    seasonId: {
      type: Schema.Types.ObjectId,
      ref: 'Season',
      required: [true, 'Season ID is required'],
      index: true
    },
    episodeNumber: {
      type: Number,
      required: [true, 'Episode number is required'],
      min: [0, 'Episode number cannot be negative']
    },
    title: {
      type: String,
      required: [true, 'Episode title is required'],
      trim: true
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative']
    },
    thumbnail: String,
    originalFile: String,
    hlsPath: String,
    qualities: [videoQualitySchema],
    subtitles: [subtitleSchema],
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    processingError: String,
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        delete ret.originalFile; // Hide original file path
        return ret;
      }
    }
  }
);

// Virtual relationships
episodeSchema.virtual('series', {
  ref: 'Series',
  localField: 'seriesId',
  foreignField: '_id',
  justOne: true
});

episodeSchema.virtual('season', {
  ref: 'Season',
  localField: 'seasonId',
  foreignField: '_id',
  justOne: true
});

// Compound indexes
episodeSchema.index({ seasonId: 1, episodeNumber: 1 }, { unique: true });
episodeSchema.index({ seriesId: 1, processingStatus: 1 });
episodeSchema.index({ createdAt: -1 });

// Instance methods
episodeSchema.methods.incrementViewCount = function(): Promise<IEpisodeDocument> {
  this.viewCount += 1;
  return this.save();
};

episodeSchema.methods.isPlayable = function(): boolean {
  return this.processingStatus === 'completed' && !!this.hlsPath;
};

// Pre-save middleware
episodeSchema.pre('save', async function(next) {
  // Validate episode number uniqueness per season
  if (this.isNew || this.isModified('episodeNumber')) {
    const existingEpisode = await mongoose.model('Episode').findOne({
      seasonId: this.seasonId,
      episodeNumber: this.episodeNumber,
      _id: { $ne: this._id }
    });
    
    if (existingEpisode) {
      next(new Error(`Episode number ${this.episodeNumber} already exists in this season`));
      return;
    }
  }
  
  next();
});

export default mongoose.model<IEpisodeDocument>('Episode', episodeSchema);