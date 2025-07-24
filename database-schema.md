# Database Schema - HLS Video Platform

## Video Collection (MongoDB)

```javascript
{
  _id: ObjectId("..."),
  videoId: "vid_1234567890", // Unique ID cho folder naming
  title: "Sample Video",
  description: "Video description here",
  
  // Original file info
  originalFilename: "myvideo.mp4",
  originalFileSize: 157286400, // bytes
  
  // HLS processing info
  masterPlaylistPath: "uploads/videos/vid_1234567890/playlist.m3u8",
  duration: 300, // seconds
  
  // Multiple quality variants
  resolutions: [
    {
      quality: "1080p",
      width: 1920,
      height: 1080,
      bitrate: 5000000, // bps
      playlistPath: "uploads/videos/vid_1234567890/1080p/playlist.m3u8",
      segmentCount: 30
    },
    {
      quality: "720p", 
      width: 1280,
      height: 720,
      bitrate: 2800000,
      playlistPath: "uploads/videos/vid_1234567890/720p/playlist.m3u8",
      segmentCount: 30
    },
    {
      quality: "480p",
      width: 854, 
      height: 480,
      bitrate: 1400000,
      playlistPath: "uploads/videos/vid_1234567890/480p/playlist.m3u8", 
      segmentCount: 30
    }
  ],
  
  // Metadata
  thumbnailPath: "uploads/videos/vid_1234567890/thumbnail.jpg",
  
  // Processing status
  status: "ready", // "uploading", "processing", "ready", "error"
  processingProgress: 100, // 0-100%
  processingStartedAt: Date("2025-01-01T10:00:00Z"),
  processingCompletedAt: Date("2025-01-01T10:05:00Z"),
  
  // Timestamps
  uploadedAt: Date("2025-01-01T10:00:00Z"),
  createdAt: Date("2025-01-01T10:00:00Z"),
  updatedAt: Date("2025-01-01T10:05:00Z")
}
```

## Processing Jobs Collection (Optional - cho queue system)

```javascript
{
  _id: ObjectId("..."),
  videoId: "vid_1234567890",
  jobType: "hls_conversion",
  status: "processing", // "pending", "processing", "completed", "failed"
  progress: 45, // 0-100%
  inputPath: "temp/uploads/original_video.mp4",
  outputPath: "uploads/videos/vid_1234567890/",
  ffmpegCommand: "ffmpeg -i input.mp4...",
  errorMessage: null,
  startedAt: Date("2025-01-01T10:00:00Z"),
  completedAt: null,
  createdAt: Date("2025-01-01T10:00:00Z")
}
```

## Mongoose Models Structure

### Video Model
```typescript
import mongoose, { Document, Schema } from 'mongoose';

interface IResolution {
  quality: string;
  width: number;
  height: number;
  bitrate: number;
  playlistPath: string;
  segmentCount: number;
}

interface IVideo extends Document {
  videoId: string;
  title: string;
  description?: string;
  originalFilename: string;
  originalFileSize: number;
  masterPlaylistPath: string;
  duration: number;
  resolutions: IResolution[];
  thumbnailPath?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  processingProgress: number;
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  uploadedAt: Date;
}

const ResolutionSchema = new Schema<IResolution>({
  quality: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  bitrate: { type: Number, required: true },
  playlistPath: { type: String, required: true },
  segmentCount: { type: Number, default: 0 }
});

const VideoSchema = new Schema<IVideo>({
  videoId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  originalFilename: { type: String, required: true },
  originalFileSize: { type: Number, required: true },
  masterPlaylistPath: { type: String },
  duration: { type: Number, default: 0 },
  resolutions: [ResolutionSchema],
  thumbnailPath: { type: String },
  status: { 
    type: String, 
    enum: ['uploading', 'processing', 'ready', 'error'],
    default: 'uploading'
  },
  processingProgress: { type: Number, default: 0 },
  processingStartedAt: { type: Date },
  processingCompletedAt: { type: Date },
  uploadedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const Video = mongoose.model<IVideo>('Video', VideoSchema);
```

## Indexes for Performance

```javascript
// Video collection indexes
db.videos.createIndex({ "videoId": 1 }, { unique: true });
db.videos.createIndex({ "status": 1 });
db.videos.createIndex({ "uploadedAt": -1 });
db.videos.createIndex({ "title": "text", "description": "text" }); // Text search

// Processing Jobs collection indexes (if using)
db.processingjobs.createIndex({ "videoId": 1 });
db.processingjobs.createIndex({ "status": 1 });
db.processingjobs.createIndex({ "createdAt": -1 });
```