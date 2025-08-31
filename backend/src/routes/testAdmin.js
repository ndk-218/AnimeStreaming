const express = require('express');
const router = express.Router();

// Simple test routes without middleware
router.post('/series', (req, res) => {
  res.json({
    success: true,
    message: 'Series endpoint working',
    data: req.body
  });
});

router.post('/seasons', (req, res) => {
  res.json({
    success: true,
    message: 'Seasons endpoint working', 
    data: req.body
  });
});

router.get('/studios/search', (req, res) => {
  const { q } = req.query;
  const mockStudios = [
    { name: 'Mappa', count: 15 },
    { name: 'Studio Pierrot', count: 12 },
    { name: 'Madhouse', count: 20 },
    { name: 'Wit Studio', count: 8 },
    { name: 'Bones', count: 10 },
    { name: 'Toei Animation', count: 25 },
    { name: 'Studio Ghibli', count: 18 },
    { name: 'Production I.G', count: 14 },
    { name: 'Sunrise', count: 16 },
    { name: 'A-1 Pictures', count: 13 }
  ].filter(studio => 
    studio.name.toLowerCase().includes((q || '').toLowerCase())
  );
  
  res.json({
    success: true,
    data: mockStudios
  });
});

router.post('/episodes', (req, res) => {
  // Mock episode creation response
  const { seriesId, seasonId, title, episodeNumber } = req.body;
  
  res.json({
    success: true,
    message: 'Episode upload endpoint working',
    data: {
      _id: '64f1a2b3c4d5e6f7a8b9c0d1',
      seriesId,
      seasonId, 
      title,
      episodeNumber: parseInt(episodeNumber),
      processingStatus: 'pending',
      createdAt: new Date()
    },
    processingId: 'proc_' + Date.now()
  });
});

router.get('/episodes/season/:seasonId', (req, res) => {
  // Mock episodes for season
  const mockEpisodes = [
    {
      _id: '64f1a2b3c4d5e6f7a8b9c0d1',
      episodeNumber: 1,
      title: 'Episode 1',
      duration: 1440, // 24 minutes
      processingStatus: 'completed'
    },
    {
      _id: '64f1a2b3c4d5e6f7a8b9c0d2', 
      episodeNumber: 2,
      title: 'Episode 2',
      duration: 1380,
      processingStatus: 'processing'
    }
  ];
  
  res.json({
    success: true,
    data: mockEpisodes
  });
});

router.get('/genres/search', (req, res) => {
  const { q } = req.query;
  const mockGenres = [
    { name: 'Action', count: 45 },
    { name: 'Adventure', count: 32 },
    { name: 'Comedy', count: 28 },
    { name: 'Drama', count: 38 },
    { name: 'Fantasy', count: 24 },
    { name: 'Romance', count: 22 },
    { name: 'Sci-Fi', count: 18 },
    { name: 'Thriller', count: 15 },
    { name: 'Horror', count: 12 },
    { name: 'Mystery', count: 16 },
    { name: 'Slice of Life', count: 20 },
    { name: 'Sports', count: 14 },
    { name: 'Supernatural', count: 19 },
    { name: 'Mecha', count: 11 },
    { name: 'School', count: 25 },
    { name: 'Military', count: 8 },
    { name: 'Historical', count: 13 },
    { name: 'Psychological', count: 10 },
    { name: 'Shounen', count: 35 },
    { name: 'Shoujo', count: 18 },
    { name: 'Seinen', count: 22 },
    { name: 'Josei', count: 12 }
  ].filter(genre => 
    genre.name.toLowerCase().includes((q || '').toLowerCase())
  );
  
  res.json({
    success: true,
    data: mockGenres
  });
});

module.exports = router;
