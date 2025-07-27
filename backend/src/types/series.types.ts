import { Document, Types } from 'mongoose';

// Base interface không extend Document
export interface ISeriesBase {
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
  stats: {
    totalSeasons: number;
    totalEpisodes: number;
    averageRating: number;
    viewCount: number;
  };
}

// Interface cho Document
export interface ISeriesDocument extends ISeriesBase, Document {
  createdAt: Date;
  updatedAt: Date;
  // Virtual fields
  seasons?: any[];
  // Instance methods
  incrementViewCount(): Promise<ISeriesDocument>;
}

// Interface cho input data (không có Document properties)
export interface ISeriesInput extends Partial<ISeriesBase> {
  title: string; // Required
}

// Interface cho query filters
export interface ISeriesFilters {
  search?: string;
  genres?: string[];
  status?: 'ongoing' | 'completed' | 'upcoming';
  year?: number;
  studio?: string;
}