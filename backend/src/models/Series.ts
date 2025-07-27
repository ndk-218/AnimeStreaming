import mongoose, { Schema } from 'mongoose';
import { ISeriesDocument } from '../types/series.types';

const seriesSchema = new Schema<ISeriesDocument>(
  {
    title: { 
      type: String, 
      required: [true, 'Title is required'],
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
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    releaseYear: {
      type: Number,
      min: [1900, 'Release year must be after 1900'],
      max: [new Date().getFullYear() + 5, 'Release year cannot be too far in the future']
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
    stats: {
      totalSeasons: { type: Number, default: 0, min: 0 },
      totalEpisodes: { type: Number, default: 0, min: 0 },
      averageRating: { type: Number, default: 0, min: 0, max: 10 },
      viewCount: { type: Number, default: 0, min: 0 }
    }
  },
  { 
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Virtual relationship
seriesSchema.virtual('seasons', {
  ref: 'Season',
  localField: '_id',
  foreignField: 'seriesId'
});

// Instance methods
seriesSchema.methods.incrementViewCount = function(): Promise<ISeriesDocument> {
  this.stats.viewCount += 1;
  return this.save();
};

// Indexes for performance
seriesSchema.index({ title: 'text', originalTitle: 'text' });
seriesSchema.index({ slug: 1 });
seriesSchema.index({ genres: 1 });
seriesSchema.index({ status: 1 });
seriesSchema.index({ 'stats.averageRating': -1 });
seriesSchema.index({ 'stats.viewCount': -1 });
seriesSchema.index({ createdAt: -1 });

// Export model với type
export default mongoose.model<ISeriesDocument>('Series', seriesSchema);