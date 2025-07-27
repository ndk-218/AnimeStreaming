import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';

// Error handling
import 'express-async-errors';

// Database
import { connectDatabase, DatabaseUtils } from './models';

// Routes (will create these)
// import seriesRoutes from './routes/series';
// import seasonRoutes from './routes/seasons';
// import episodeRoutes from './routes/episodes';
// import adminRoutes from './routes/admin';
// import streamingRoutes from './routes/streaming';

// Middleware
// import { errorHandler } from './middleware/errorHandler';
// import { notFound } from './middleware/notFound';

// Services
// import { VideoProcessingService } from './services/videoProcessing';
// import { SocketService } from './services/socketService';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'REDIS_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Create Express app
const app = express();
const server = createServer(app);

// Create Socket.IO instance
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ===== MIDDLEWARE SETUP =====

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      mediaSrc: ["'self'", "blob:", "data:"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"]
    }
  },
  crossOriginEmbedderPolicy: false // Allow video streaming
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Compression
app.use(compression());

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== STATIC FILE SERVING =====

// Serve HLS video files with proper headers
app.use('/stream', express.static(path.join(__dirname, '../uploads/videos'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath);
    
    if (ext === '.m3u8') {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (ext === '.ts') {
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
    
    // Enable range requests for video streaming
    res.setHeader('Accept-Ranges', 'bytes');
  }
}));

// Serve uploaded images/thumbnails
app.use('/images', express.static(path.join(__dirname, '../uploads/images'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
  }
}));

// ===== API ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Anime Streaming API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API routes (will uncomment when routes are created)
// app.use('/api/series', seriesRoutes);
// app.use('/api/seasons', seasonRoutes);
// app.use('/api/episodes', episodeRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/stream', streamingRoutes);

// ===== SOCKET.IO SETUP =====

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  // Handle admin authentication for processing updates
  socket.on('admin_auth', (data) => {
    // TODO: Verify admin JWT token
    socket.join('admin_room');
    console.log(`👤 Admin joined: ${socket.id}`);
  });
  
  // Handle video processing room join
  socket.on('join_processing_room', (data) => {
    const { jobId } = data;
    socket.join(`processing_${jobId}`);
    console.log(`📺 Joined processing room: ${jobId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// ===== ERROR HANDLING =====

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    }
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', error);
  
  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
});

// ===== STARTUP FUNCTION =====

async function startServer() {
  try {
    console.log('🚀 Starting Anime Streaming Platform...');
    
    // Ensure upload directories exist
    const uploadDirs = [
      'uploads/videos',
      'uploads/images', 
      'uploads/temp',
      'logs'
    ];
    
    for (const dir of uploadDirs) {
      const fullPath = path.join(__dirname, '..', dir);
      await fs.ensureDir(fullPath);
      console.log(`📁 Ensured directory: ${dir}`);
    }
    
    // Connect to database
    await connectDatabase(process.env.MONGODB_URI!);
    
    // Create default admin user
    await DatabaseUtils.seedAdminUser();
    
    // Get database stats
    const stats = await DatabaseUtils.getCollectionStats();
    console.log('📊 Database stats:', stats);
    
    // Start server
    const PORT = process.env.PORT || 5000;
    
    server.listen(PORT, () => {
      console.log('');
      console.log('🎯 ================================');
      console.log(`🎬 ANIME STREAMING PLATFORM`);
      console.log('🎯 ================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 API: http://localhost:${PORT}/api`);
      console.log(`📺 Streaming: http://localhost:${PORT}/stream`);
      console.log(`🔌 Socket.IO: ws://localhost:${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/api/health`);
      console.log('🎯 ================================');
      console.log('');
      
      // Log admin credentials
      console.log('👤 Default Admin Credentials:');
      console.log('📧 Email: admin@animestreaming.com');
      console.log('🔑 Password: admin123456');
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ===== GRACEFUL SHUTDOWN =====

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

// Export for testing
export { app, server, io };