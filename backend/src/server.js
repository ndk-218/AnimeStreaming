// @ts-nocheck
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');
const path = require('path');
const fs = require('fs-extra');
const dotenv = require('dotenv');

// Error handling
require('express-async-errors');

// Database
const { connectDatabase, DatabaseUtils } = require('./models');

// Import routes
const apiRoutes = require('./routes');

// Import middleware
const { globalErrorHandler, notFound } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET'
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
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 requests per windowMs
  message: {
    success: false,
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

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = [
    'uploads/videos',
    'uploads/images',
    'uploads/subtitles',
    'temp/videos',
    'temp/subtitles',
    'temp/images'
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(path.join(__dirname, '..', dir));
  }
};

ensureUploadDirs().catch(console.error);

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

// Health check ở root level
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Anime Streaming Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Mount API routes với /api prefix
app.use('/api', apiRoutes);

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

// 404 handler for non-API routes
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

// ===== DATABASE CONNECTION & SERVER START =====

const startServer = async () => {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await connectDatabase(process.env.MONGODB_URI);
    
    // Seed default admin user if needed
    await DatabaseUtils.seedAdminUser();
    
    // Get database stats
    const stats = await DatabaseUtils.getStats();
    console.log('📊 Database stats:', stats);
    
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📺 API endpoints available at http://localhost:${PORT}/api`);
      console.log(`🎬 Video streaming at http://localhost:${PORT}/stream`);
      console.log(`🖼️ Images at http://localhost:${PORT}/images`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  console.log('🔄 Shutting down server...');
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.log('🔄 Shutting down server...');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

// Start the server
startServer();

module.exports = app;