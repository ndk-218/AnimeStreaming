import mongoose, { Schema } from 'mongoose';
import { ISeasonDocument } from '../types/season.types';

const seasonSchema = new Schema<ISeasonDocument>(
  {
    seriesId: {
      type: Schema.Types.ObjectId,
      ref: 'Series',
      required: [true, 'Series ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Season title is required'],
      trim: true
    },
    seasonNumber: {
      type: Number,
      required: [true, 'Season number is required'],
      min: [0, 'Season number cannot be negative']
    },
    seasonType: {
      type: String,
      enum: ['tv', 'movie', 'ova', 'special'],
      default: 'tv',
      required: true
    },
    releaseYear: {
      type: Number,
      min: [1900, 'Release year must be after 1900'],
      max: [new Date().getFullYear() + 5, 'Release year cannot be too far in the future']
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    posterImage: String,
    episodeCount: {
      type: Number,
      default: 0,
      min: [0, 'Episode count cannot be negative']
    },
    status: {
      type: String,
      enum: ['upcoming', 'airing', 'completed'],
      default: 'upcoming'
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
seasonSchema.virtual('episodes', {
  ref: 'Episode',
  localField: '_id',
  foreignField: 'seasonId'
});

// Virtual for series details
seasonSchema.virtual('series', {
  ref: 'Series',
  localField: 'seriesId',
  foreignField: '_id',
  justOne: true
});

// Compound indexes
seasonSchema.index({ seriesId: 1, seasonNumber: 1 }, { unique: true });
seasonSchema.index({ seriesId: 1, seasonType: 1 });
seasonSchema.index({ status: 1 });

// Instance method
seasonSchema.methods.isMovie = function(): boolean {
  return this.seasonType === 'movie';
};

// Pre-save middleware for validation
seasonSchema.pre('save', async function(next) {
  // Validate season number uniqueness per series
  if (this.isNew || this.isModified('seasonNumber')) {
    const existingSeason = await mongoose.model('Season').findOne({
      seriesId: this.seriesId,
      seasonNumber: this.seasonNumber,
      _id: { $ne: this._id }
    });
    
    if (existingSeason) {
      next(new Error(`Season number ${this.seasonNumber} already exists for this series`));
      return;
    }
  }
  
  next();
});

export default mongoose.model<ISeasonDocument>('Season', seasonSchema);