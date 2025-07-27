import { Document, Types } from 'mongoose';

// Base interface
export interface ISeasonBase {
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

// Document interface
export interface ISeasonDocument extends ISeasonBase, Document {
  createdAt: Date;
  updatedAt: Date;
  // Virtual fields
  episodes?: any[];
  series?: any;
  // Instance methods
  isMovie(): boolean;
}

// Input interface
export interface ISeasonInput extends Partial<ISeasonBase> {
  seriesId: string | Types.ObjectId;
  title: string;
  seasonNumber: number;
  seasonType: 'tv' | 'movie' | 'ova' | 'special';
}