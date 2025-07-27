import { Document, Types } from 'mongoose';

// Watchlist item interface
export interface IWatchlistItem {
  seriesId: Types.ObjectId;
  addedAt: Date;
  status: 'watching' | 'completed' | 'plan_to_watch' | 'dropped';
}

// Watch history interface
export interface IWatchHistory {
  episodeId: Types.ObjectId;
  watchedAt: Date;
  duration: number;
  progress: number; // Percentage watched
}

// Base interface
export interface IUserBase {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  preferences: {
    language: string;
    autoplay: boolean;
    quality: 'auto' | '480p' | '720p' | '1080p';
    subtitles: boolean;
  };
  watchlist: IWatchlistItem[];
  watchHistory: IWatchHistory[];
}

// Document interface
export interface IUserDocument extends IUserBase, Document {
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  addToWatchlist(seriesId: string | Types.ObjectId): Promise<IUserDocument>;
  removeFromWatchlist(seriesId: string | Types.ObjectId): Promise<IUserDocument>;
  updateWatchProgress(episodeId: string | Types.ObjectId, progress: number): Promise<IUserDocument>;
}

// Input interface (for registration)
export interface IUserInput {
  username: string;
  email: string;
  password: string;
}

// Login interface
export interface IUserLogin {
  email: string;
  password: string;
}