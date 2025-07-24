# API Endpoints - HLS Video Platform

## Video Upload & Processing

### POST /api/videos/upload
**Upload video file và start processing**

**Request:**
- Content-Type: multipart/form-data
- Body: FormData với 'video' file field

**Response:**
```json
{
  "success": true,
  "data": {
    "videoId": "vid_1234567890",
    "status": "processing",
    "message": "Video uploaded successfully, processing started"
  }
}
```

### GET /api/videos/:videoId/status
**Check processing progress**

**Response:**
```json
{
  "success": true, 
  "data": {
    "videoId": "vid_1234567890",
    "status": "processing",
    "progress": 75,
    "currentStep": "Converting to 720p"
  }
}
```

### GET /api/videos/:videoId
**Get video details**

**Response:**
```json
{
  "success": true,
  "data": {
    "videoId": "vid_1234567890",
    "title": "Sample Video",
    "description": "Video description",
    "duration": 300,
    "masterPlaylistUrl": "/api/stream/vid_1234567890/playlist.m3u8",
    "thumbnailUrl": "/api/stream/vid_1234567890/thumbnail.jpg",
    "resolutions": [
      {
        "quality": "1080p",
        "width": 1920,
        "height": 1080,
        "playlistUrl": "/api/stream/vid_1234567890/1080p/playlist.m3u8"
      }
    ],
    "status": "ready"
  }
}
```

## Video Streaming

### GET /api/stream/:videoId/playlist.m3u8
**Serve master HLS playlist**

**Response:**
```
#EXTM3U
#EXT-X-VERSION:6
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720  
720p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
480p/playlist.m3u8
```

### GET /api/stream/:videoId/:quality/playlist.m3u8
**Serve quality-specific playlist**

### GET /api/stream/:videoId/:quality/:segment
**Serve TS segments**

## Video Management

### GET /api/videos
**List all videos**

**Query params:**
- page: number (default: 1)
- limit: number (default: 20)
- status: string ("ready", "processing", "error")

### PUT /api/videos/:videoId
**Update video metadata**

### DELETE /api/videos/:videoId
**Delete video và cleanup files**

## WebSocket Events

### Connection: /socket.io/

### Events:
- **join_room**: Join room cho specific video processing
- **processing_progress**: Real-time progress updates
- **processing_complete**: Video conversion completed
- **processing_error**: Conversion failed

**Example:**
```javascript
// Client joins room
socket.emit('join_room', { videoId: 'vid_1234567890' });

// Listen for progress
socket.on('processing_progress', (data) => {
  console.log(`Progress: ${data.progress}%`);
});
```