# Video Streaming Platform - HLS Implementation

## Mục tiêu Phase 1
Xây dựng video streaming platform với HLS (HTTP Live Streaming) để streaming mượt mà trên mọi device.

## HLS Workflow
1. **Upload**: User upload video file (MP4, AVI, MOV)
2. **Processing**: Convert sang HLS format (m3u8 + ts segments)
3. **Storage**: Lưu playlist và segments theo structure
4. **Streaming**: Serve HLS content qua HTTP
5. **Player**: HLS.js player với adaptive bitrate

## Technical Requirements

### Video Processing
- **Input formats**: MP4, AVI, MOV, MKV
- **Output format**: HLS (m3u8 playlist + ts segments)
- **Segment duration**: 10 seconds per segment
- **Multiple qualities**: 480p, 720p, 1080p (adaptive bitrate)
- **FFmpeg integration**: Automated conversion pipeline

### File Structure
```
uploads/videos/[videoId]/
├── playlist.m3u8          # Master playlist
├── 480p/
│   ├── playlist.m3u8      # 480p playlist  
│   ├── segment001.ts
│   ├── segment002.ts
│   └── ...
├── 720p/
│   ├── playlist.m3u8      # 720p playlist
│   ├── segment001.ts  
│   └── ...
└── 1080p/
    ├── playlist.m3u8      # 1080p playlist
    ├── segment001.ts
    └── ...
```

### Database Schema
```javascript
// Video Model
{
  _id: ObjectId,
  title: String,
  description: String,
  originalFilename: String,
  videoId: String, // Unique identifier cho folder
  duration: Number, // seconds
  resolutions: [{
    quality: String, // "480p", "720p", "1080p"
    width: Number,
    height: Number,
    bitrate: Number,
    playlistPath: String // "uploads/videos/[videoId]/480p/playlist.m3u8"
  }],
  masterPlaylistPath: String, // "uploads/videos/[videoId]/playlist.m3u8"
  thumbnailPath: String,
  status: String, // "processing", "ready", "error"
  processingProgress: Number, // 0-100%
  uploadedAt: Date,
  processedAt: Date
}
```

## Frontend Features
- **Upload Interface**: Drag & drop với progress tracking
- **Video Player**: HLS.js player với quality selector
- **Video Library**: Grid layout với thumbnails
- **Processing Status**: Real-time progress cho video conversion
- **Responsive Design**: Mobile-first approach

## Backend Features
- **Upload Endpoint**: `/api/upload` với Multer
- **Processing Queue**: FFmpeg job queue
- **Progress Tracking**: WebSocket cho real-time updates
- **HLS Serving**: Static file serving cho m3u8/ts files
- **Metadata API**: CRUD operations cho video info

## FFmpeg Commands Reference
```bash
# Generate multiple qualities + master playlist
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]split=3[v1][v2][v3]; [v1]copy[v1out]; [v2]scale=1280:720[v2out]; [v3]scale=854:480[v3out]" \
  -map "[v1out]" -c:v libx264 -x264-params "nal-hrd=cbr:force-cfr=1" -b:v 5000k -maxrate 5300k -minrate 4700k -bufsize 10000k -preset slow -g 48 -sc_threshold 0 -keyint_min 48 -hls_time 10 -hls_playlist_type vod -b:a 196k -ac 2 -ar 48000 -hls_segment_filename "1080p/segment%03d.ts" 1080p/playlist.m3u8 \
  -map "[v2out]" -c:v libx264 -x264-params "nal-hrd=cbr:force-cfr=1" -b:v 2800k -maxrate 2996k -minrate 2604k -bufsize 5600k -preset slow -g 48 -sc_threshold 0 -keyint_min 48 -hls_time 10 -hls_playlist_type vod -b:a 128k -ac 2 -ar 48000 -hls_segment_filename "720p/segment%03d.ts" 720p/playlist.m3u8 \
  -map "[v3out]" -c:v libx264 -x264-params "nal-hrd=cbr:force-cfr=1" -b:v 1400k -maxrate 1498k -minrate 1302k -bufsize 2800k -preset slow -g 48 -sc_threshold 0 -keyint_min 48 -hls_time 10 -hls_playlist_type vod -b:a 128k -ac 2 -ar 48000 -hls_segment_filename "480p/segment%03d.ts" 480p/playlist.m3u8
```

## Development Phases

### Phase 1A: Basic Upload & Single Quality (1 tuần)
- Upload endpoint với Multer
- FFmpeg convert 1 quality (720p)
- Basic HLS player
- Simple video list

### Phase 1B: Multi-Quality HLS (1 tuần)  
- Multiple quality generation
- Master playlist creation
- Adaptive bitrate player
- Quality selector UI

### Phase 1C: Processing Pipeline (1 tuần)
- Background job processing
- Progress tracking với WebSocket
- Error handling cho failed conversions
- Thumbnail generation

## Success Criteria
- Video upload hoàn chỉnh trong < 2 phút
- HLS playback mượt mà trên desktop/mobile
- Adaptive bitrate switching tự động
- No buffering với connection tốt
- Processing progress real-time updates

## Technical Challenges
1. **FFmpeg Performance**: Optimize conversion speed
2. **Storage Management**: Disk space cho multiple qualities
3. **Concurrent Processing**: Handle multiple uploads
4. **Browser Compatibility**: HLS support across devices
5. **Error Recovery**: Handle failed conversions gracefully