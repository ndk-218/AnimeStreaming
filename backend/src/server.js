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
const { connectDatabase } = require('./models');

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

app.set("trust proxy", true);

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
      mediaSrc: ["'self'", "blob:", "data:", "http:", "https:"],
      connectSrc: ["'self'", "http:", "https:"],
      imgSrc: ["'self'", "data:", "blob:", "http:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));

// CORS
const allowedOrigins = [
  "https://golden-anime.online",
  "https://www.golden-anime.online",
  "http://localhost:5173"
];

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép curl / postman / server-to-server
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Range',
    'X-Request-ID',
    'x-request-id'
  ]
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

// Body parsing với timeout cao hơn cho large uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ===== INCREASE TIMEOUT FOR LARGE FILE UPLOADS =====
// Timeout cho requests (30 phút cho file 1-2GB)
app.use((req, res, next) => {
  req.setTimeout(30 * 60 * 1000); // 30 minutes
  res.setTimeout(30 * 60 * 1000); // 30 minutes
  next();
});

// Static file serving cho HLS streaming
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ===== SOCKET.IO SETUP =====
io.on('connection', (socket) => {
  console.log('📱 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('📱 Client disconnected:', socket.id);
  });
  
  // Join room cho video processing updates
  socket.on('join-processing', (episodeId) => {
    socket.join(`processing-${episodeId}`);
    console.log(`📱 Client joined processing room: ${episodeId}`);
  });
});

// Make io available to controllers
app.set('socketio', io);

// ===== ROUTES SETUP =====
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎌 Anime Streaming Platform API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      api: '/api',
      health: '/api/health',
      series: '/api/series',
      seasons: '/api/seasons',
      episodes: '/api/episodes',
      admin: '/api/admin'
    }
  });
});

// ===== ERROR HANDLING =====
app.use(notFound);
app.use(globalErrorHandler);

// ===== GRACEFUL SHUTDOWN =====
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 ${signal} signal received. Starting graceful shutdown...`);
  
  try {
    // Close server
    server.close(() => {
      console.log('🔒 HTTP server closed');
    });
    
    // Close socket.io
    io.close();
    console.log('🔒 Socket.IO server closed');
    
    // Close database connection (if needed)
    // await mongoose.connection.close();
    // console.log('🔒 Database connection closed');
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database with URI from environment
    await connectDatabase(process.env.MONGODB_URI);
    console.log('✅ Database connected successfully');
    
    // Ensure upload directories exist
    const { ensureUploadDirs } = require('./middleware/upload');
    await ensureUploadDirs();
    console.log('✅ Upload directories initialized');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`
🚀 =================================
   🎌 ANIME STREAMING API STARTED
   📍 Environment: ${process.env.NODE_ENV || 'development'}
   🌐 Server running on port: ${PORT}
   🔗 URL: http://localhost:${PORT}
   📊 Health check: http://localhost:${PORT}/api/health
   🎯 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
🚀 =================================
      `);
    });
    
    // ===== SET SERVER TIMEOUTS FOR LARGE FILE UPLOADS =====
    server.timeout = 30 * 60 * 1000; // 30 minutes
    server.keepAliveTimeout = 30 * 60 * 1000; // 30 minutes
    server.headersTimeout = 30 * 60 * 1000 + 5000; // Slightly higher than keepAlive
    
    console.log('✅ Server timeouts configured for large file uploads (30 min)');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();