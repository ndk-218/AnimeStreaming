# Anime Streaming Platform - Technical Requirements

## Project Vision

Build a Netflix-like anime streaming platform where administrators manage content and users stream anime series. The platform supports hierarchical content organization (Series → Seasons → Episodes), comprehensive subtitle systems, and scalable architecture from anonymous viewing to full user community features.

## Content Hierarchy Model

### Series (Anime Shows)
Top-level anime content container supporting multiple seasons and types:
- **TV Series**: Regular animated series (Attack on Titan, One Piece)
- **Movies**: Feature-length anime films  
- **OVAs**: Original Video Animations
- **Specials**: Special episodes or shorts

### Seasons (Content Groupings)
Flexible season structure within each series:
- **TV Seasons**: "Season 1", "Season 2", "Season 3"
- **Movie Seasons**: "Movie 2019", "Movie 2021" (with year labels for identification)
- **OVA Seasons**: "OVA" (containing multiple OVA episodes)
- **Mixed Content**: One anime can have TV seasons, movies, and OVAs simultaneously

### Episodes (Individual Videos)
Actual video content within seasons:
- **TV Episodes**: Sequential episodes within TV seasons
- **Movie Episodes**: Single movie file within movie season
- **OVA Episodes**: Individual OVAs within OVA season

## Database Schema Design

### Core Collections

**Series Collection** - Top-level anime metadata:
```javascript
{
  _id: ObjectId,
  title: {
    english: String,
    romaji: String,
    japanese: String,
    synonyms: [String] // Alternative titles for search
  },
  description: String,
  genres: [String], // ["Action", "Adventure", "Shounen"]
  tags: [String],   // ["Magic", "School", "Superpowers"]
  
  // Production Information
  studio: String,
  director: String,
  source: String, // "manga", "light_novel", "original", "game"
  status: String, // "ongoing", "completed", "upcoming", "cancelled"
  
  // Visual Assets
  images: {
    poster: String,     // Main poster image
    banner: String,     // Wide banner for hero sections
    thumbnail: String,  // Small thumbnail for cards
    screenshots: [String]
  },
  
  // SEO and Discovery
  slug: String,        // URL-friendly identifier
  malId: Number,       // MyAnimeList integration
  anilistId: Number,   // AniList integration
  
  // Aggregate Statistics (denormalized for performance)
  stats: {
    totalSeasons: Number,
    totalEpisodes: Number,
    averageRating: Number,
    totalRatings: Number,
    viewCount: Number,
    favoriteCount: Number
  },
  
  // Administrative
  isActive: Boolean,
  isFeatured: Boolean,
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId, // Admin user who added the series
  
  // Content Rating
  rating: String, // "G", "PG", "PG-13", "R"
  contentWarnings: [String]
}
```

**Seasons Collection** - Content organization within series:
```javascript
{
  _id: ObjectId,
  seriesId: ObjectId,
  
  // Season Identification
  seasonNumber: Number,    // 1, 2, 3 for TV seasons
  seasonType: String,      // "tv", "movie", "ova", "special"
  title: String,          // "Season 1", "Movie 2019", "OVA"
  releaseYear: Number,    // For movies and OVAs
  
  // Content Information
  description: String,
  episodeCount: Number,   // Total episodes in this season
  
  // Airing Information
  airingStatus: String,   // "not_yet_aired", "currently_airing", "finished_airing"
  airedFrom: Date,
  airedTo: Date,
  
  // Visual Assets
  images: {
    poster: String,
    banner: String,
    thumbnail: String
  },
  
  // Performance Statistics
  stats: {
    viewCount: Number,
    averageRating: Number,
    totalRatings: Number,
    completionRate: Number
  },
  
  // Administrative
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Episodes Collection** - Individual video content:
```javascript
{
  _id: ObjectId,
  seriesId: ObjectId,
  seasonId: ObjectId,
  
  // Episode Identification
  episodeNumber: Number,
  title: {
    english: String,
    romaji: String,
    japanese: String
  },
  description: String,
  
  // Video Files (HLS format)
  videoFiles: {
    "480p": {
      manifestUrl: String,  // Path to .m3u8 file
      duration: Number,     // Seconds
      fileSize: Number,     // Bytes
      bitrate: Number
    },
    "1080p": {
      manifestUrl: String,
      duration: Number,
      fileSize: Number,
      bitrate: Number
    }
  },
  
  // Subtitle System
  subtitles: [{
    _id: ObjectId,
    language: String,       // ISO 639-1 code ("en", "ja", "es")
    type: String,          // "embedded", "admin_uploaded", "user_uploaded"
    format: String,        // "srt", "vtt", "ass"
    fileUrl: String,
    uploadedBy: ObjectId,  // User ID (null for embedded/admin)
    qualityScore: Number,  // 1-10 quality rating
    downloadCount: Number,
    isVerified: Boolean,   // Manually verified by admin
    moderationStatus: String // "approved", "pending", "rejected"
  }],
  
  // Episode Metadata
  airDate: Date,
  duration: Number,       // Total duration in seconds
  thumbnail: String,      // Episode preview image
  
  // Episode Flags
  isFiller: Boolean,
  isRecap: Boolean,
  hasPostCredits: Boolean,
  
  // Processing Status
  processingStatus: String, // "pending", "processing", "completed", "failed"
  isActive: Boolean,
  
  // Statistics
  stats: {
    viewCount: Number,
    averageRating: Number,
    totalRatings: Number,
    completionRate: Number, // Percentage of viewers who finish episode
    averageWatchTime: Number
  },
  
  // Administrative
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date
}
```

### Phase 2 Collections (User Management)

**Users Collection** - User accounts and preferences:
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  passwordHash: String,
  role: String, // "user", "admin", "moderator"
  
  // Profile Information
  profile: {
    displayName: String,
    avatar: String,
    bio: String,
    joinDate: Date,
    preferences: {
      defaultQuality: String,     // "480p", "1080p", "auto"
      defaultSubtitleLang: String, // "en", "off"
      autoplay: Boolean,
      darkMode: Boolean
    }
  },
  
  // User Lists (embedded for performance)
  watchlist: [{
    animeId: ObjectId,
    addedAt: Date,
    status: String, // "watching", "plan_to_watch", "completed", "dropped"
    priority: Number,
    personalRating: Number,
    notes: String
  }],
  
  // Watch History (recent 100 items)
  watchHistory: [{
    episodeId: ObjectId,
    seriesId: ObjectId,
    watchedAt: Date,
    progress: Number,    // Seconds watched
    completed: Boolean,
    // Cached data for performance
    seriesTitle: String,
    episodeTitle: String,
    thumbnail: String
  }],
  
  // Account Status
  isEmailVerified: Boolean,
  isActive: Boolean,
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Comments Collection** - Community interaction:
```javascript
{
  _id: ObjectId,
  targetType: String,    // "series", "season", "episode"
  targetId: ObjectId,
  
  // User Information
  userId: ObjectId,
  userDisplayName: String, // Cached for performance
  userAvatar: String,      // Cached for performance
  
  // Comment Content
  content: String,
  isEdited: Boolean,
  editedAt: Date,
  
  // Threading Support
  parentCommentId: ObjectId, // null for top-level comments
  threadDepth: Number,
  
  // Moderation
  isHidden: Boolean,
  isReported: Boolean,
  reportCount: Number,
  moderatedBy: ObjectId,
  moderationReason: String,
  
  // Engagement
  likesCount: Number,
  dislikesCount: Number,
  repliesCount: Number,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

## Video Processing Pipeline

### Input Requirements
- **Supported Formats**: MP4, MKV, AVI
- **Maximum File Size**: 4GB per episode
- **Recommended Resolution**: 1080p or higher
- **Audio**: Stereo or multi-channel audio tracks
- **Subtitles**: Embedded or separate subtitle files

### Processing Workflow

1. **Upload Validation**
   - File format verification
   - Virus scanning
   - Metadata extraction
   - Duration and resolution validation

2. **FFmpeg Processing**
   ```bash
   # Dual-quality HLS generation optimized for anime
   ffmpeg -i input.mkv \
   -filter_complex "[0:v]split=2[v1][v2]; [v1]scale=1920:1080[v1out]; [v2]scale=854:480[v2out]" \
   -map "[v1out]" -c:v:0 libx264 -preset medium -crf 18 -tune animation \
   -map "[v2out]" -c:v:1 libx264 -preset fast -crf 22 \
   -c:a aac -b:a 128k \
   -f hls -hls_time 6 -hls_playlist_type vod \
   -hls_segment_filename "stream_%v/segment_%03d.ts" \
   -master_pl_name "master.m3u8" \
   "stream_%v.m3u8"
   ```

3. **Subtitle Processing**
   - Extract embedded subtitles
   - Convert formats to WebVTT
   - Generate subtitle manifests
   - Quality validation and scoring

4. **Thumbnail Generation**
   - Extract frames at key moments
   - Generate multiple sizes
   - Optimize for web delivery

5. **File Organization**
   ```
   uploads/videos/{episodeId}/
   ├── master.m3u8           # Master playlist
   ├── 1080p/
   │   ├── playlist.m3u8     # 1080p playlist
   │   └── segment_*.ts      # Video segments
   ├── 480p/
   │   ├── playlist.m3u8     # 480p playlist
   │   └── segment_*.ts      # Video segments
   ├── subtitles/
   │   ├── en.vtt           # English subtitles
   │   ├── ja.vtt           # Japanese subtitles
   │   └── es.vtt           # Spanish subtitles
   └── thumbnails/
       ├── preview.jpg      # Main thumbnail
       └── timeline_*.jpg   # Timeline preview images
   ```

## API Architecture

### Phase 1 Endpoints (Anonymous Streaming)

**Content Discovery:**
```
GET  /api/v1/series                    # Browse anime catalog
GET  /api/v1/series/trending          # Trending anime
GET  /api/v1/series/search            # Search with filters
GET  /api/v1/series/:id               # Series details
GET  /api/v1/series/:id/seasons       # Seasons within series
GET  /api/v1/seasons/:id/episodes     # Episodes within season

GET  /api/v1/genres                   # Available genres
GET  /api/v1/studios                  # Animation studios
```

**Video Streaming:**
```
GET  /api/v1/episodes/:id             # Episode metadata
GET  /api/v1/episodes/:id/stream      # HLS manifest URL
GET  /api/v1/episodes/:id/subtitles   # Available subtitle tracks
GET  /stream/:episodeId/master.m3u8   # HLS master playlist
GET  /stream/:episodeId/:quality/:segment # Video segments
```

**Admin Management:**
```
POST /api/v1/admin/auth/login         # Admin authentication
POST /api/v1/admin/series             # Create new series
PUT  /api/v1/admin/series/:id         # Update series metadata
POST /api/v1/admin/seasons            # Create new season
POST /api/v1/admin/episodes           # Upload episode video
PUT  /api/v1/admin/episodes/:id       # Update episode metadata
GET  /api/v1/admin/processing/status  # Video processing status
```

### Phase 2 Endpoints (User Features)

**Authentication:**
```
POST /api/v1/auth/register           # User registration
POST /api/v1/auth/login              # User login
POST /api/v1/auth/refresh            # Token refresh
POST /api/v1/auth/verify-email       # Email verification
POST /api/v1/auth/forgot-password    # Password reset request
```

**User Management:**
```
GET  /api/v1/user/profile            # User profile
PUT  /api/v1/user/profile            # Update profile
GET  /api/v1/user/watchlist          # Personal watchlist
POST /api/v1/user/watchlist          # Add to watchlist
PUT  /api/v1/user/watch-progress     # Update viewing progress
GET  /api/v1/user/history            # Watch history
```

**Community Features:**
```
GET  /api/v1/comments/:targetType/:id # Get comments
POST /api/v1/comments                # Add comment
PUT  /api/v1/comments/:id            # Edit comment
POST /api/v1/ratings                 # Rate anime/episode
POST /api/v1/subtitles/upload        # User subtitle upload
```

## Frontend Component Architecture

### Application Structure
```
src/
├── components/           # Reusable UI components
│   ├── VideoPlayer/     # HLS player with controls
│   ├── AnimeCard/       # Series display card
│   ├── EpisodeList/     # Episode grid/list
│   ├── SubtitleSelector/ # Subtitle language selection
│   └── SearchBar/       # Anime search interface
├── pages/               # Page-level components
│   ├── HomePage/        # Landing page with featured content
│   ├── SeriesPage/      # Series details with seasons
│   ├── WatchPage/       # Video player page
│   ├── SearchPage/      # Search results
│   └── AdminPanel/      # Content management interface
├── features/            # Feature-specific modules
│   ├── anime-catalog/   # Browse and discovery
│   ├── video-player/    # Streaming functionality
│   ├── user-profile/    # User management (Phase 2)
│   └── admin/           # Admin functionality
├── hooks/               # Custom React hooks
│   ├── useAnimeData/    # Anime content fetching
│   ├── useVideoPlayer/  # Video player state
│   └── useAuth/         # Authentication (Phase 2)
├── services/            # API integration
│   ├── animeApi.ts      # Anime content endpoints
│   ├── streamingApi.ts  # Video streaming
│   └── adminApi.ts      # Admin functionality
└── utils/               # Helper functions
    ├── videoUtils.ts    # Video format handling
    ├── searchUtils.ts   # Search optimization
    └── formatters.ts    # Data formatting
```

### Key Component Specifications

**VideoPlayer Component:**
- HLS.js integration for adaptive streaming
- Quality selector (480p/1080p/Auto)
- Subtitle track selection and styling
- Keyboard shortcuts and accessibility
- Progress tracking and resume functionality
- Mobile-optimized touch controls

**AnimeCard Component:**
- Responsive poster display
- Quick info overlay (genres, rating, year)
- Progress indicators for continuing series
- Hover effects and animations
- Lazy loading for performance

**Search & Filter System:**
- Real-time search suggestions
- Genre and studio filtering
- Year and status filtering
- Sort options (popularity, rating, recent)
- Advanced search with multiple criteria

## Development Phases Timeline

### Phase 1: MVP Development (10 weeks)

**Weeks 1-2: Foundation**
- MongoDB database setup with optimized indexes
- Express.js API server with TypeScript
- Basic authentication for admin panel
- File upload handling with Multer

**Weeks 3-4: Video Processing**
- FFmpeg integration with Docker
- HLS conversion pipeline (480p/1080p)
- Subtitle extraction and conversion
- Job queue system with BullMQ

**Weeks 5-6: Content Management**
- Admin panel for series/season/episode management
- Content upload interface with progress tracking
- Processing status monitoring
- Basic content validation

**Weeks 7-8: Frontend Development**
- React application with Tailwind CSS
- Video player with HLS.js integration
- Content browsing and search interface
- Responsive design for mobile/desktop

**Weeks 9-10: Integration & Testing**
- End-to-end workflow testing
- Performance optimization
- Error handling and user feedback
- Basic analytics and monitoring

### Phase 2: User Features (6-8 weeks)

**Weeks 1-2: Authentication System**
- User registration and login
- Email verification workflow
- JWT token management
- Password reset functionality

**Weeks 3-4: User Features**
- Personal profiles and preferences
- Watchlist and viewing history
- Progress synchronization across devices
- User preference persistence

**Weeks 5-6: Community Features**
- Comment system with moderation
- User-uploaded subtitles
- Rating and review system
- Community interaction features

**Weeks 7-8: Advanced Features**
- Recommendation algorithms
- Advanced search and filtering
- Performance optimization
- Mobile app considerations

## Success Metrics

### Phase 1 KPIs
- Video streaming latency < 2 seconds
- 99% uptime for streaming services
- Support for 100+ concurrent users
- Mobile responsiveness across devices
- Admin panel efficiency for content management

### Phase 2 KPIs
- User registration conversion rate
- Daily/monthly active users
- Content engagement metrics
- Community participation rates
- Performance scaling to 1000+ concurrent users

### Technical Performance
- Database query response < 100ms
- Video segment load time < 500ms
- Mobile streaming optimization
- Search response time < 200ms
- Admin upload processing efficiency

This technical specification provides the foundation for building a production-ready anime streaming platform that can scale from MVP to enterprise-level service while maintaining excellent user experience and video quality.