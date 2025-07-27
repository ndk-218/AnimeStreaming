import { Document, Types } from 'mongoose';

// Subtitle interface
export interface ISubtitle {
  language: string;
  label: string;
  file: string;
  type: 'embedded' | 'uploaded';
}

// Video quality interface
export interface IVideoQuality {
  quality: '480p' | '720p' | '1080p';
  file: string;
}

// Base interface
export interface IEpisodeBase {
  seriesId: Types.ObjectId;
  seasonId: Types.ObjectId;
  episodeNumber: number;
  title: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  originalFile?: string;
  hlsPath?: string;
  qualities: IVideoQuality[];
  subtitles: ISubtitle[];
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  viewCount: number;
}

// Document interface
export interface IEpisodeDocument extends IEpisodeBase, Document {
  createdAt: Date;
  updatedAt: Date;
  // Virtual fields
  series?: any;
  season?: any;
  // Instance methods
  incrementViewCount(): Promise<IEpisodeDocument>;
  isPlayable(): boolean;
}

// Input interface
export interface IEpisodeInput extends Partial<IEpisodeBase> {
  seriesId: string | Types.ObjectId;
  seasonId: string | Types.ObjectId;
  episodeNumber: number;
  title: string;
  originalFile?: string;
}

// Processing update interface
export interface IProcessingUpdate {
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  hlsPath?: string;
  qualities?: IVideoQuality[];
  duration?: number;
  thumbnail?: string;
}