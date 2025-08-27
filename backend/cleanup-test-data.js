// @ts-nocheck
require('dotenv').config();
const { connectDatabase } = require('./src/models');
const Series = require('./src/models/Series');
const Season = require('./src/models/Season');
const Episode = require('./src/models/Episode');

async function cleanupTestData() {
  try {
    console.log('🧹 Starting test data cleanup...');
    
    // Connect to database
    await connectDatabase(process.env.MONGODB_URI);
    
    // Remove all test episodes
    const deletedEpisodes = await Episode.deleteMany({});
    console.log(`🗑️ Removed ${deletedEpisodes.deletedCount} test episodes`);
    
    // Remove all test seasons  
    const deletedSeasons = await Season.deleteMany({});
    console.log(`🗑️ Removed ${deletedSeasons.deletedCount} test seasons`);
    
    // Remove all test series
    const deletedSeries = await Series.deleteMany({});
    console.log(`🗑️ Removed ${deletedSeries.deletedCount} test series`);
    
    console.log('✅ Test data cleanup completed!');
    console.log('📊 Database is now clean and ready for frontend development');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

cleanupTestData();
