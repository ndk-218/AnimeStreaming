// ===== API ROUTES =====

// Import main routes
const apiRoutes = require('./routes');

// Mount API routes với /api prefix
app.use('/api', apiRoutes);

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