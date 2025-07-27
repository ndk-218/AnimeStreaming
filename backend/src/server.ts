import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = createServer(app);

// Socket.IO setup for real-time video processing updates
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Environment variables with defaults
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// ===== MIDDLEWARE STACK =====

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow video streaming
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      mediaSrc: ["'self'", "blob:", "data:"], // Allow video/audio
      connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket
    },
  },
}));

// CORS configuration for frontend
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 1000, // requests per window
  message: {
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Upload specific rate limit (more restrictive)
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 uploads per minute
  message: {
    error: 'Upload limit exceeded, please wait before uploading again',
  },
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static file serving for HLS streams
app.use('/stream', express.static(path.join(__dirname, '../uploads/videos'), {
  setHeaders: (res, filePath) => {
    // Set proper MIME types for HLS files
    if (filePath.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));

// ===== API ROUTES =====

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0',
    services: {
      server: 'running',
      database: 'pending', // Will update after DB connection
      storage: 'available'
    }
  });
});

// API version endpoint
app.get('/api/version', (req, res) => {
  res.json({
    name: 'HLS Video Streaming API',
    version: '1.0.0',
    description: 'Backend API for HLS video processing and streaming',
    endpoints: {
      upload: '/api/videos/upload',
      videos: '/api/videos',
      stream: '/stream/:videoId',
      health: '/api/health'
    }
  });
});

// Video routes placeholder (will implement later)
app.use('/api/videos', uploadLimiter);
app.get('/api/videos', (req, res) => {
  res.json({
    message: 'Video API endpoint - Implementation coming soon',
    available_soon: [
      'GET /api/videos - List videos',
      'POST /api/videos/upload - Upload video',
      'GET /api/videos/:id - Get video details',
      'DELETE /api/videos/:id - Delete video'
    ]
  });
});

// Upload endpoint placeholder
app.post('/api/videos/upload', (req, res) => {
  res.json({
    message: 'Upload endpoint - Implementation coming soon',
    status: 'pending',
    next_steps: [
      'Implement Multer file upload',
      'Add FFmpeg video processing',
      'Generate HLS streams'
    ]
  });
});

// ===== SOCKET.IO REAL-TIME EVENTS =====

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Client joins video processing room
  socket.on('join_video_room', (data) => {
    const { videoId } = data;
    socket.join(`video_${videoId}`);
    console.log(`📺 Client ${socket.id} joined video room: ${videoId}`);
    
    socket.emit('joined_room', {
      videoId,
      message: 'Successfully joined video processing room'
    });
  });

  // Leave video room
  socket.on('leave_video_room', (data) => {
    const { videoId } = data;
    socket.leave(`video_${videoId}`);
    console.log(`📺 Client ${socket.id} left video room: ${videoId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ===== ERROR HANDLING =====

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
    available_endpoints: [
      'GET /api/health',
      'GET /api/version', 
      'GET /api/videos',
      'POST /api/videos/upload'
    ]
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 Server Error:', error);
  
  res.status(error.status || 500).json({
    error: NODE_ENV === 'development' ? error.message : 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: error.stack }),
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// ===== SERVER STARTUP =====

// Graceful shutdown handler
const gracefulShutdown = () => {
  console.log('\n🛑 Received shutdown signal, closing server gracefully...');
  
  server.close(() => {
    console.log('📴 HTTP server closed');
    
    // Close database connections here when implemented
    // await mongoose.connection.close();
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  });

  // Force close after timeout
  setTimeout(() => {
    console.log('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
server.listen(PORT, () => {
  console.log('\n🚀 HLS Video Streaming Server Started!');
  console.log('=====================================');
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📍 API Base: http://localhost:${PORT}/api`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Frontend CORS: ${CORS_ORIGIN}`);
  console.log('=====================================');
  console.log('🎬 Ready for HLS video processing!');
  console.log('📝 Next: Implement database connection & upload logic\n');
});

// Export app and io for testing
export { app, io, server };