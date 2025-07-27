# API Endpoints - Anime Streaming Platform

## API Overview

This document defines the complete RESTful API for the Anime Streaming Platform, organized by development phases and functional areas. The API supports anonymous content streaming (Phase 1) and authenticated user features (Phase 2).

**Base URL**: `https://api.animestreaming.com/v1`  
**Content-Type**: `application/json`  
**Authentication**: JWT Bearer tokens (where required)

## Phase 1: Anonymous Streaming & Admin Management

### Content Discovery & Browsing

#### GET /series
Browse anime series with pagination and filtering.

**Query Parameters:**
- `page` (number, default: 1): Page number for pagination
- `limit` (number, default: 20, max: 50): Items per page
- `genre` (string): Filter by genre slug
- `status` (string): Filter by series status
- `year` (number): Filter by release year
- `studio` (string): Filter by animation studio
- `sort` (string): Sort order ('popularity', 'rating', 'recent', 'alphabetical')

**Response:**
```json
{
  "success": true,
  "data": {
    "series": [
      {
        "id": "series_123",
        "title": {
          "english": "Attack on Titan",
          "romaji": "Shingeki no Kyojin",
          "japanese": "進撃の巨人"
        },
        "description": "Humanity fights for survival against giant humanoid Titans...",
        "genres": ["Action", "Drama", "Fantasy"],
        "studio": "Mappa",
        "releaseYear": 2013,
        "status": "completed",
        "rating": "R",
        "images": {
          "poster": "/images/aot-poster.jpg",
          "banner": "/images/aot-banner.jpg",
          "thumbnail": "/images/aot-thumb.jpg"
        },
        "stats": {
          "totalSeasons": 4,
          "totalEpisodes": 75,
          "averageRating": 9.2,
          "viewCount": 150000
        },
        "slug": "attack-on-titan"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 25,
      "totalItems": 500,
      "hasNext": true,
      "hasPrev": false
    },
            "filters": {
      "availableGenres": ["Action", "Adventure", "Comedy", "Drama"],
      "availableStudios": ["Mappa", "Toei Animation", "Madhouse"],
      "yearRange": { "min": 1990, "max": 2024 }
    }
  }
}
```

#### GET /series/trending
Get currently trending anime series.

**Query Parameters:**
- `timeframe` (string): 'day', 'week', 'month' (default: 'week')
- `limit` (number, default: 10, max: 20): Number of results

**Response:**
```json
{
  "success": true,
  "data": {
    "trending": [
      {
        "id": "series_456",
        "title": { "english": "Demon Slayer" },
        "trendingRank": 1,
        "trendingScore": 98.5,
        "stats": {
          "viewCount": 50000,
          "weeklyViews": 15000,
          "averageRating": 8.8
        }
      }
    ],
    "timeframe": "week",
    "lastUpdated": "2024-01-25T10:00:00Z"
  }
}
```

#### GET /series/search
Search anime series with advanced filtering.

**Query Parameters:**
- `q` (string, required): Search query
- `genres` (string): Comma-separated genre slugs
- `year_min` (number): Minimum release year
- `year_max` (number): Maximum release year
- `status` (string): Series status filter
- `rating_min` (number): Minimum user rating (1-10)
- `sort` (string): Sort order
- `page` (number): Page number
- `limit` (number): Results per page

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "series_789",
        "title": { "english": "One Piece" },
        "relevanceScore": 95.2,
        "matchType": "title_exact",
        "highlightedText": "<mark>One Piece</mark>"
      }
    ],
    "searchMeta": {
      "query": "one piece",
      "totalResults": 1,
      "searchTime": "12ms",
      "suggestions": ["One Punch Man", "One Piece Film"]
    }
  }
}
```

#### GET /series/:id
Get detailed information about a specific anime series.

**Path Parameters:**
- `id` (string): Series ID or slug

**Response:**
```json
{
  "success": true,
  "data": {
    "series": {
      "id": "series_123",
      "title": {
        "english": "Attack on Titan",
        "romaji": "Shingeki no Kyojin",
        "japanese": "進撃の巨人",
        "synonyms": ["AoT", "SnK"]
      },
      "description": "Centuries ago, mankind was slaughtered to near extinction...",
      "genres": ["Action", "Drama", "Fantasy", "Military"],
      "tags": ["Titans", "Survival", "Military", "Dark"],
      "studio": "Mappa",
      "director": "Tetsuro Araki",
      "source": "manga",
      "status": "completed",
      "releaseYear": 2013,
      "rating": "R",
      "contentWarnings": ["Violence", "Gore", "Dark Themes"],
      "images": {
        "poster": "/images/aot-poster-hd.jpg",
        "banner": "/images/aot-banner-hd.jpg",
        "screenshots": ["/images/aot-ss1.jpg", "/images/aot-ss2.jpg"]
      },
      "externalLinks": {
        "malId": 16498,
        "anilistId": 16498,
        "officialSite": "https://shingeki.tv/"
      },
      "stats": {
        "totalSeasons": 4,
        "totalEpisodes": 75,
        "averageRating": 9.2,
        "totalRatings": 25000,
        "viewCount": 150000,
        "favoriteCount": 30000
      },
      "lastUpdated": "2024-01-20T15:30:00Z"
    }
  }
}
```

#### GET /series/:id/seasons
Get all seasons for a specific anime series.

**Path Parameters:**
- `id` (string): Series ID

**Response:**
```json
{
  "success": true,
  "data": {
    "seasons": [
      {
        "id": "season_101",
        "seriesId": "series_123",
        "title": "Season 1",
        "seasonNumber": 1,
        "seasonType": "tv",
        "description": "The story begins in the town of Shiganshina...",
        "episodeCount": 25,
        "airingStatus": "finished_airing",
        "airedFrom": "2013-04-07",
        "airedTo": "2013-09-28",
        "images": {
          "poster": "/images/aot-s1-poster.jpg",
          "banner": "/images/aot-s1-banner.jpg"
        },
        "stats": {
          "viewCount": 120000,
          "averageRating": 8.9,
          "completionRate": 85.2
        }
      },
      {
        "id": "season_105",
        "title": "Movie 2015",
        "seasonType": "movie",
        "releaseYear": 2015,
        "episodeCount": 1
      },
      {
        "id": "season_106",
        "title": "OVA",
        "seasonType": "ova",
        "episodeCount": 8
      }
    ],
    "totalSeasons": 6,
    "seriesTitle": "Attack on Titan"
  }
}
```

### Episode Management & Streaming

#### GET /seasons/:id/episodes
Get all episodes within a specific season.

**Path Parameters:**
- `id` (string): Season ID

**Query Parameters:**
- `sort` (string): 'episode_number', 'air_date', 'duration'
- `include_metadata` (boolean): Include detailed episode metadata

**Response:**
```json
{
  "success": true,
  "data": {
    "episodes": [
      {
        "id": "episode_501",
        "seasonId": "season_101",
        "seriesId": "series_123",
        "episodeNumber": 1,
        "title": {
          "english": "To You, in 2000 Years",
          "japanese": "二千年後の君へ"
        },
        "description": "A young boy named Eren Yeager lives in District...",
        "duration": 1440,
        "airDate": "2013-04-07",
        "thumbnail": "/images/aot-s1e1-thumb.jpg",
        "availableQualities": ["480p", "1080p"],
        "hasSubtitles": true,
        "availableSubtitles": ["en", "ja", "es", "fr"],
        "isFiller": false,
        "isRecap": false,
        "hasPostCredits": false,
        "stats": {
          "viewCount": 85000,
          "averageRating": 8.7,
          "completionRate": 92.3
        }
      }
    ],
    "seasonInfo": {
      "title": "Season 1",
      "totalEpisodes": 25,
      "seriesTitle": "Attack on Titan"
    }
  }
}
```

#### GET /episodes/:id
Get detailed episode information and streaming metadata.

**Path Parameters:**
- `id` (string): Episode ID

**Response:**
```json
{
  "success": true,
  "data": {
    "episode": {
      "id": "episode_501",
      "seriesId": "series_123",
      "seasonId": "season_101",
      "episodeNumber": 1,
      "title": {
        "english": "To You, in 2000 Years",
        "romaji": "Nisen-nen Go no Kimi e",
        "japanese": "二千年後の君へ"
      },
      "description": "A young boy named Eren Yeager lives in District Shiganshina...",
      "duration": 1440,
      "airDate": "2013-04-07",
      "thumbnail": "/images/aot-s1e1-thumb.jpg",
      "timelineThumbnails": "/images/aot-s1e1-timeline.vtt",
      
      // Streaming Information
      "streaming": {
        "hlsManifest": "/stream/episode_501/master.m3u8",
        "availableQualities": [
          {
            "quality": "1080p",
            "bandwidth": 5000000,
            "resolution": "1920x1080",
            "manifestUrl": "/stream/episode_501/1080p/playlist.m3u8"
          },
          {
            "quality": "480p", 
            "bandwidth": 1200000,
            "resolution": "854x480",
            "manifestUrl": "/stream/episode_501/480p/playlist.m3u8"
          }
        ]
      },
      
      // Subtitle Information
      "subtitles": [
        {
          "id": "sub_101",
          "language": "en",
          "languageName": "English",
          "type": "admin_uploaded",
          "format": "vtt",
          "fileUrl": "/stream/episode_501/subtitles/en.vtt",
          "isDefault": true,
          "qualityScore": 9.5
        },
        {
          "id": "sub_102", 
          "language": "ja",
          "languageName": "Japanese",
          "type": "embedded",
          "format": "vtt",
          "fileUrl": "/stream/episode_501/subtitles/ja.vtt",
          "qualityScore": 10.0
        }
      ],
      
      // Navigation
      "navigation": {
        "previousEpisode": null,
        "nextEpisode": {
          "id": "episode_502",
          "title": "That Day",
          "episodeNumber": 2
        },
        "season": {
          "id": "season_101",
          "title": "Season 1"
        },
        "series": {
          "id": "series_123",
          "title": "Attack on Titan"
        }
      },
      
      "flags": {
        "isFiller": false,
        "isRecap": false,
        "hasPostCredits": false,
        "isProcessing": false
      },
      
      "stats": {
        "viewCount": 85000,
        "averageRating": 8.7,
        "totalRatings": 1250,
        "completionRate": 92.3,
        "averageWatchTime": 1380
      }
    }
  }
}
```

### Video Streaming Endpoints

#### GET /stream/:episodeId/master.m3u8
Get HLS master playlist for adaptive streaming.

**Path Parameters:**
- `episodeId` (string): Episode ID

**Headers:**
- `Range` (optional): For partial content requests
- `User-Agent`: For analytics and compatibility

**Response:** HLS Master Playlist
```
#EXTM3U
#EXT-X-VERSION:6
#EXT-X-INDEPENDENT-SEGMENTS

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.64002a,mp4a.40.2"
1080p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=854x480,CODECS="avc1.64001e,mp4a.40.2"
480p/playlist.m3u8
```

#### GET /stream/:episodeId/:quality/playlist.m3u8
Get quality-specific HLS playlist.

**Path Parameters:**
- `episodeId` (string): Episode ID
- `quality` (string): Video quality ('480p', '1080p')

**Response:** HLS Media Playlist
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-PLAYLIST-TYPE:VOD

#EXTINF:6.0,
segment_001.ts
#EXTINF:6.0,
segment_002.ts
#EXTINF:4.5,
segment_003.ts
#EXT-X-ENDLIST
```

#### GET /stream/:episodeId/:quality/:segment
Serve individual video segments.

**Path Parameters:**
- `episodeId` (string): Episode ID
- `quality` (string): Video quality
- `segment` (string): Segment filename

**Headers:**
- `Range` (optional): Byte range requests
- `Cache-Control`: `public, max-age=86400`

**Response:** Binary video segment (MPEG-TS format)

#### GET /stream/:episodeId/subtitles/:language.vtt
Serve subtitle files in WebVTT format.

**Path Parameters:**
- `episodeId` (string): Episode ID
- `language` (string): Language code ('en', 'ja', 'es')

**Response:** WebVTT Subtitle File
```
WEBVTT

00:00:01.000 --> 00:00:04.000
That day, humanity received a grim reminder...

00:00:05.000 --> 00:00:08.000
We lived in fear of the Titans...
```

### Content Management (Admin Only)

#### POST /admin/auth/login
Authenticate admin users.

**Request Body:**
```json
{
  "email": "admin@animestreaming.com",
  "password": "securePassword123",
  "rememberMe": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "def502004a8b7f...",
    "expiresIn": 3600,
    "user": {
      "id": "admin_1",
      "email": "admin@animestreaming.com",
      "role": "admin",
      "permissions": ["content_upload", "content_edit", "user_management"]
    }
  }
}
```

#### POST /admin/series
Create a new anime series.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "title": {
    "english": "Jujutsu Kaisen",
    "romaji": "Jujutsu Kaisen",
    "japanese": "呪術廻戦"
  },
  "description": "Yuji Itadori is a boy with tremendous physical strength...",
  "genres": ["Action", "School", "Shounen", "Supernatural"],
  "tags": ["Curses", "Magic", "High School"],
  "studio": "Mappa",
  "director": "Sunghoo Park",
  "source": "manga",
  "releaseYear": 2020,
  "status": "ongoing",
  "rating": "PG-13",
  "malId": 40748,
  "images": {
    "posterUrl": "https://cdn.example.com/jjk-poster.jpg",
    "bannerUrl": "https://cdn.example.com/jjk-banner.jpg"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "series": {
      "id": "series_890",
      "slug": "jujutsu-kaisen",
      "createdAt": "2024-01-25T10:15:00Z",
      "createdBy": "admin_1"
    }
  }
}
```

#### PUT /admin/series/:id
Update anime series metadata.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Path Parameters:**
- `id` (string): Series ID

**Request Body:** Same as POST /admin/series (partial updates allowed)

#### POST /admin/seasons
Create a new season within a series.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "seriesId": "series_890",
  "title": "Season 1",
  "seasonNumber": 1,
  "seasonType": "tv",
  "description": "First season of Jujutsu Kaisen...",
  "airingStatus": "finished_airing",
  "airedFrom": "2020-10-03",
  "airedTo": "2021-03-27",
  "images": {
    "posterUrl": "https://cdn.example.com/jjk-s1-poster.jpg"
  }
}
```

#### POST /admin/episodes/upload
Upload and process a new episode.

**Headers:**
- `Authorization: Bearer {accessToken}`
- `Content-Type: multipart/form-data`

**Form Data:**
- `videoFile` (file): Video file (MP4/MKV)
- `seriesId` (string): Parent series ID
- `seasonId` (string): Parent season ID
- `episodeNumber` (number): Episode number
- `title` (string): Episode title (JSON string)
- `description` (string): Episode description
- `airDate` (date): Original air date
- `subtitleFiles` (files, optional): Subtitle files

**Response:**
```json
{
  "success": true,
  "data": {
    "episode": {
      "id": "episode_1001",
      "processingJobId": "job_456",
      "processingStatus": "queued",
      "estimatedProcessingTime": "15-20 minutes"
    },
    "message": "Episode uploaded successfully. Processing has started."
  }
}
```

#### GET /admin/processing/jobs
Monitor video processing status.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `status` (string): Filter by job status
- `page` (number): Page number
- `limit` (number): Results per page

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_456",
        "episodeId": "episode_1001",
        "status": "processing",
        "progress": 65,
        "currentStep": "Generating 1080p HLS segments",
        "startedAt": "2024-01-25T10:30:00Z",
        "estimatedCompletion": "2024-01-25T10:45:00Z",
        "outputFiles": {
          "1080p": "/stream/episode_1001/1080p/playlist.m3u8",
          "480p": "/stream/episode_1001/480p/playlist.m3u8"
        }
      }
    ],
    "summary": {
      "total": 25,
      "queued": 3,
      "processing": 2,
      "completed": 18,
      "failed": 2
    }
  }
}
```

### Utility Endpoints

#### GET /genres
Get all available anime genres.

**Response:**
```json
{
  "success": true,
  "data": {
    "genres": [
      {
        "slug": "action",
        "name": "Action",
        "description": "High-energy sequences with combat and excitement",
        "seriesCount": 450,
        "color": "#FF6B6B"
      },
      {
        "slug": "romance",
        "name": "Romance", 
        "description": "Stories focused on romantic relationships",
        "seriesCount": 230,
        "color": "#FF69B4"
      }
    ]
  }
}
```

#### GET /studios
Get all animation studios.

**Response:**
```json
{
  "success": true,
  "data": {
    "studios": [
      {
        "slug": "mappa",
        "name": "Mappa",
        "founded": 2011,
        "seriesCount": 25,
        "popularSeries": ["Attack on Titan", "Jujutsu Kaisen", "Chainsaw Man"]
      }
    ]
  }
}
```

#### GET /health
System health check endpoint.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-25T10:45:00Z",
    "requestId": "req_abc123"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400): Invalid request parameters
- `UNAUTHORIZED` (401): Authentication required or invalid token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource already exists or conflict
- `RATE_LIMITED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error
- `SERVICE_UNAVAILABLE` (503): Service temporarily unavailable

## WebSocket Events (Real-time Features)

### Connection Endpoint
`wss://api.animestreaming.com/v1/ws`

### Authentication
```javascript
socket.emit('auth', {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
});
```

### Video Processing Updates
```javascript
// Admin subscribes to processing updates
socket.emit('join_processing_room', {
  jobId: 'job_456'
});

// Server sends processing updates
socket.on('processing_progress', {
  jobId: 'job_456',
  episodeId: 'episode_1001',
  status: 'processing',
  progress: 75,
  currentStep: 'Generating thumbnails',
  estimatedCompletion: '2024-01-25T10:45:00Z'
});

socket.on('processing_complete', {
  jobId: 'job_456',
  episodeId: 'episode_1001',
  status: 'completed',
  outputFiles: {
    '1080p': '/stream/episode_1001/1080p/playlist.m3u8',
    '480p': '/stream/episode_1001/480p/playlist.m3u8',
    'thumbnails': '/images/episode_1001/thumbnail.jpg'
  }
});
```

### Watch Progress Sync (Phase 2)
```javascript
// User joins their personal room
socket.emit('join_user_room', {
  userId: 'user_501'
});

// Sync watch progress across devices
socket.emit('update_watch_progress', {
  episodeId: 'episode_501',
  progress: 850,
  timestamp: '2024-01-25T10:30:00Z'
});

// Receive progress updates from other devices
socket.on('progress_synced', {
  episodeId: 'episode_501',
  progress: 850,
  deviceId: 'mobile_device_123'
});
```

### Live Comments (Phase 2)
```javascript
// Join episode discussion room
socket.emit('join_episode_room', {
  episodeId: 'episode_501'
});

// Receive new comments in real-time
socket.on('new_comment', {
  commentId: 'comment_402',
  episodeId: 'episode_501',
  user: {
    displayName: 'Anime Fan',
    avatar: '/avatars/user_502.jpg'
  },
  content: 'This scene is incredible!',
  timestamp: '2024-01-25T10:32:00Z'
});

// Comment reactions
socket.on('comment_liked', {
  commentId: 'comment_402',
  likesCount: 16,
  userId: 'user_503'
});
```

## Rate Limiting

### General API Limits
- **Anonymous Users**: 100 requests/hour per IP
- **Authenticated Users**: 1000 requests/hour per user
- **Admin Users**: 5000 requests/hour per user

### Specific Endpoint Limits
- **Search API**: 30 requests/minute per user
- **Video Streaming**: No limit (handled by CDN)
- **Upload API**: 5 uploads/hour per admin
- **Comment API**: 10 comments/minute per user

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 985
X-RateLimit-Reset: 1706169600
Retry-After: 3600
```

## Caching Strategy

### CDN Caching (CloudFront)
- **Video Segments (.ts)**: Cache for 7 days
- **Playlists (.m3u8)**: Cache for 1 hour
- **Images**: Cache for 30 days
- **API Responses**: Cache for 5 minutes (varies by endpoint)

### Redis Caching
- **Series/Episode Metadata**: 1 hour TTL
- **Search Results**: 15 minutes TTL
- **User Sessions**: 24 hours TTL
- **Processing Jobs**: 5 minutes TTL

### Browser Caching
```
Cache-Control: public, max-age=3600, stale-while-revalidate=86400
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Wed, 25 Jan 2024 10:00:00 GMT
```

## API Versioning

### Version Format
- Current Version: `v1`
- URL Format: `/api/v1/endpoint`
- Header Format: `Accept: application/vnd.animestreaming.v1+json`

### Version Lifecycle
- **v1**: Current stable version
- **v2**: Beta version (when available)
- **Deprecation Notice**: 6 months advance notice
- **Sunset Period**: 12 months support after deprecation

### Backward Compatibility
- **Breaking Changes**: New major version required
- **Non-breaking Changes**: Same version with optional parameters
- **Bug Fixes**: Patch updates within same version

## Security Considerations

### Authentication
- **JWT Tokens**: RS256 algorithm with key rotation
- **Token Expiry**: 1 hour access tokens, 30 day refresh tokens
- **Refresh Token Rotation**: New refresh token issued on each use

### Input Validation
- **Request Size Limits**: 10MB for uploads, 1MB for JSON
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Prevention**: Input sanitization and CSP headers
- **File Upload Security**: MIME type validation, virus scanning

### API Security Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; media-src *; img-src *
```

### CORS Configuration
```
Access-Control-Allow-Origin: https://animestreaming.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

This comprehensive API documentation provides the complete interface for the Anime Streaming Platform, supporting both anonymous content consumption and full user community features with robust security, performance, and scalability considerations.T10:45:00Z",
    "version": "1.0.0",
    "services": {
      "database": "connected",
      "redis": "connected",
      "fileStorage": "available",
      "videoProcessing": "operational"
    },
    "stats": {
      "totalSeries": 500,
      "totalEpisodes": 12000,
      "activeUsers": 1250,
      "processingJobs": 5
    }
  }
}
```

## Phase 2: User Management & Community Features

### User Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "animeweeb123",
  "email": "user@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123",
  "acceptTerms": true,
  "preferences": {
    "defaultQuality": "1080p",
    "defaultSubtitleLang": "en"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_501",
      "username": "animeweeb123",
      "email": "user@example.com",
      "emailVerified": false,
      "profile": {
        "displayName": "animeweeb123",
        "avatar": "/avatars/default.jpg",
        "joinDate": "2024-01-25"
      }
    },
    "message": "Registration successful. Please check your email for verification."
  }
}
```

#### POST /auth/login
User authentication.

**Request Body:**
```json
{
  "login": "user@example.com",
  "password": "securePassword123",
  "rememberMe": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "def502004a8b7f...",
    "expiresIn": 3600,
    "user": {
      "id": "user_501",
      "username": "animeweeb123",
      "email": "user@example.com",
      "role": "user",
      "profile": {
        "displayName": "animeweeb123",
        "avatar": "/avatars/user_501.jpg",
        "preferences": {
          "defaultQuality": "1080p",
          "defaultSubtitleLang": "en",
          "autoplay": true,
          "darkMode": true
        }
      }
    }
  }
}
```

### User Profile Management

#### GET /user/profile
Get current user profile.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "user_501",
      "username": "animeweeb123",
      "email": "user@example.com",
      "displayName": "Anime Enthusiast",
      "bio": "Love watching shounen anime!",
      "avatar": "/avatars/user_501.jpg",
      "joinDate": "2024-01-25",
      "stats": {
        "totalWatchTime": 45000,
        "episodesWatched": 1250,
        "seriesCompleted": 45,
        "commentsPosted": 127
      },
      "preferences": {
        "defaultQuality": "1080p",
        "defaultSubtitleLang": "en",
        "autoplay": true,
        "darkMode": true,
        "emailNotifications": true
      }
    }
  }
}
```

#### PUT /user/profile
Update user profile.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "displayName": "Ultimate Anime Fan",
  "bio": "Passionate about anime since 2010",
  "preferences": {
    "defaultQuality": "auto",
    "defaultSubtitleLang": "ja",
    "autoplay": false
  }
}
```

### Watchlist Management

#### GET /user/watchlist
Get user's personal watchlist.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `status` (string): Filter by watch status
- `sort` (string): Sort order
- `page` (number): Page number

**Response:**
```json
{
  "success": true,
  "data": {
    "watchlist": [
      {
        "id": "watchlist_101",
        "animeId": "series_123",
        "addedAt": "2024-01-20T14:30:00Z",
        "status": "watching",
        "priority": 1,
        "personalRating": 9,
        "notes": "Amazing series!",
        "progress": {
          "currentSeason": 2,
          "currentEpisode": 15,
          "totalEpisodes": 75,
          "completionPercentage": 67.3
        },
        "anime": {
          "title": "Attack on Titan",
          "poster": "/images/aot-poster.jpg",
          "genres": ["Action", "Drama"],
          "status": "completed"
        }
      }
    ],
    "summary": {
      "total": 25,
      "watching": 8,
      "planToWatch": 12,
      "completed": 4,
      "dropped": 1
    }
  }
}
```

#### POST /user/watchlist
Add anime to watchlist.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "animeId": "series_456",
  "status": "plan_to_watch",
  "priority": 2,
  "notes": "Looks interesting!"
}
```

### Watch History & Progress

#### GET /user/history
Get user's watch history.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `days` (number): History timeframe (default: 30)
- `page` (number): Page number
- `limit` (number): Results per page

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "history_201",
        "episodeId": "episode_501",
        "watchedAt": "2024-01-25T09:30:00Z",
        "progress": 1380,
        "duration": 1440,
        "completed": true,
        "episode": {
          "title": "To You, in 2000 Years",
          "episodeNumber": 1,
          "thumbnail": "/images/aot-s1e1-thumb.jpg",
          "series": {
            "title": "Attack on Titan",
            "season": "Season 1"
          }
        }
      }
    ],
    "stats": {
      "totalWatchTime": 45000,
      "episodesWatched": 312,
      "averageSessionTime": 1680
    }
  }
}
```

#### PUT /user/watch-progress
Update viewing progress for an episode.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "episodeId": "episode_502",
  "progress": 850,
  "duration": 1440,
  "completed": false,
  "quality": "1080p",
  "subtitleLang": "en"
}
```

### Community Features

#### GET /comments/:targetType/:targetId
Get comments for series, season, or episode.

**Path Parameters:**
- `targetType` (string): 'series', 'season', 'episode'
- `targetId` (string): Target ID

**Query Parameters:**
- `sort` (string): 'newest', 'oldest', 'most_liked'
- `page` (number): Page number
- `limit` (number): Comments per page

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment_301",
        "userId": "user_501",
        "userDisplayName": "Anime Enthusiast",
        "userAvatar": "/avatars/user_501.jpg",
        "content": "This episode was absolutely mind-blowing! The animation quality is incredible.",
        "createdAt": "2024-01-25T10:15:00Z",
        "isEdited": false,
        "parentCommentId": null,
        "threadDepth": 0,
        "likesCount": 15,
        "dislikesCount": 1,
        "repliesCount": 3,
        "isHidden": false,
        "userLikeStatus": "liked"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalComments": 98
    }
  }
}
```

#### POST /comments
Add a new comment.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "targetType": "episode",
  "targetId": "episode_501",
  "content": "This episode gave me goosebumps! Amazing storytelling.",
  "parentCommentId": null
}
```

### Rating System

#### POST /ratings
Rate an anime series or episode.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "targetType": "series",
  "targetId": "series_123",
  "rating": 9,
  "review": "One of the best anime series ever created. Incredible plot and character development."
}
```

### Subtitle Contributions

#### POST /subtitles/upload
Upload user-contributed subtitles.

**Headers:**
- `Authorization: Bearer {accessToken}`
- `Content-Type: multipart/form-data`

**Form Data:**
- `episodeId` (string): Target episode
- `language` (string): Subtitle language code
- `subtitleFile` (file): Subtitle file (.srt, .vtt, .ass)
- `description` (string): Subtitle description

**Response:**
```json
{
  "success": true,
  "data": {
    "subtitle": {
      "id": "subtitle_401",
      "episodeId": "episode_501",
      "language": "es",
      "uploadedBy": "user_501",
      "moderationStatus": "pending",
      "message": "Subtitle uploaded successfully. It will be reviewed by moderators."
    }
  }
}
```

## Error Responses

All endpoints use consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Valid email address required"
      }
    ],
    "timestamp": "2024-01-25