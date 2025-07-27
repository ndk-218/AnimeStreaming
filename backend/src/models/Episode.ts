import mongoose, { Schema, Document, Types } from 'mongoose';

// ===== INTERFACE ĐƠN GIẢN CHO ĐỒ ÁN =====
export interface ISubtitle {
  language: string;
  label: string;
  file: string;
}

export interface IVideoQuality {
  quality: '480p' | '1080p';
  file: string;
}

export interface IEpisode extends Document {
  seriesId: Types.ObjectId;
  seasonId: Types.ObjectId;
  episodeNumber: number;
  title: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  hlsPath?: string;
  qualities: IVideoQuality[];
  subtitles: ISubtitle[];
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  viewCount: number;
}

// ===== SUB SCHEMAS ĐƠN GIẢN =====
const subtitleSchema = new Schema<ISubtitle>({
  language: { type: String, required: true },
  label: { type: String, required: true },
  file: { type: String, required: true }
}, { _id: false, versionKey: false });

const videoQualitySchema = new Schema<IVideoQuality>({
  quality: { type: String, enum: ['480p', '1080p'], required: true },
  file: { type: String, required: true }
}, { _id: false, versionKey: false });

// ===== SCHEMA CHÍNH =====
const episodeSchema = new Schema<IEpisode>(
  {
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
      min: 1
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    duration: Number, // seconds
    thumbnail: String,
    hlsPath: String, // path to m3u8 file
    qualities: [videoQualitySchema],
    subtitles: [subtitleSchema],
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    viewCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    versionKey: false, // Disable __v
    toJSON: { virtuals: true }
  }
);

// ===== INDEX CƠ BẢN =====
episodeSchema.index({ seasonId: 1, episodeNumber: 1 }, { unique: true });
episodeSchema.index({ processingStatus: 1 });

// ===== METHODS ĐƠN GIẢN =====
episodeSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

episodeSchema.methods.isReady = function() {
  return this.processingStatus === 'completed';
};

export const Episode = mongoose.model<IEpisode>('Episode', episodeSchema);