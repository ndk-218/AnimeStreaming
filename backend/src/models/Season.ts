import mongoose, { Schema, Document, Types } from 'mongoose';

// ===== INTERFACE ĐƠN GIẢN =====
export interface ISeason extends Document {
  seriesId: Types.ObjectId;
  title: string;
  seasonNumber: number;
  seasonType: 'tv' | 'movie' | 'ova' | 'special';
  releaseYear?: number;
  description?: string;
  posterImage?: string;
  episodeCount: number;
  status: 'upcoming' | 'airing' | 'completed';
}

// ===== SCHEMA ĐƠN GIẢN =====
const seasonSchema = new Schema<ISeason>(
  {
    seriesId: {
      type: Schema.Types.ObjectId,
      ref: 'Series',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    seasonNumber: {
      type: Number,
      required: true,
      min: 0
    },
    seasonType: {
      type: String,
      enum: ['tv', 'movie', 'ova', 'special'],
      default: 'tv'
    },
    releaseYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 5
    },
    description: String,
    posterImage: String,
    episodeCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['upcoming', 'airing', 'completed'],
      default: 'upcoming'
    }
  },
  {
    timestamps: true,
    versionKey: false, // Disable __v
    toJSON: { virtuals: true }
  }
);

// ===== INDEX CƠ BẢN =====
seasonSchema.index({ seriesId: 1, seasonNumber: 1 }, { unique: true });

// ===== METHOD ĐƠN GIẢN =====
seasonSchema.methods.isMovie = function() {
  return this.seasonType === 'movie';
};

export const Season = mongoose.model<ISeason>('Season', seasonSchema);