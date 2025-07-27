import mongoose, { Schema, Document } from 'mongoose';

// ===== INTERFACE CHO ĐỒ ÁN =====
export interface ISeries extends Document {
  title: string;
  originalTitle?: string;
  slug: string;
  description?: string;
  releaseYear?: number;
  status: 'ongoing' | 'completed' | 'upcoming';
  genres: string[];
  studio?: string;
  posterImage?: string;
  bannerImage?: string;
  viewCount: number;
}

// ===== SCHEMA ĐƠN GIẢN =====
const seriesSchema = new Schema<ISeries>(
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
    description: { 
      type: String
    },
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
    versionKey: false, // Disable __v
    toJSON: { 
      virtuals: true
    }
  }
);

// ===== INDEX CƠ BẢN =====
seriesSchema.index({ title: 'text' });
seriesSchema.index({ slug: 1 });
seriesSchema.index({ genres: 1 });

// ===== METHOD ĐƠN GIẢN =====
seriesSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

export const Series = mongoose.model<ISeries>('Series', seriesSchema);