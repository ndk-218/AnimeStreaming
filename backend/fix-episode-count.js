// Script để fix episodeCount cho tất cả seasons
const mongoose = require('mongoose');
require('dotenv').config();

const Season = require('./src/models/Season');
const Episode = require('./src/models/Episode');

async function fixEpisodeCounts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all seasons
    const seasons = await Season.find();
    console.log(`📊 Found ${seasons.length} seasons`);

    let fixed = 0;

    for (const season of seasons) {
      // Count ALL episodes (không filter processingStatus)
      const actualCount = await Episode.countDocuments({ 
        seasonId: season._id 
      });

      if (season.episodeCount !== actualCount) {
        console.log(`🔧 Fixing ${season.title}: ${season.episodeCount} → ${actualCount}`);
        
        await Season.findByIdAndUpdate(season._id, {
          episodeCount: actualCount
        });
        
        fixed++;
      }
    }

    console.log(`✅ Fixed ${fixed} seasons`);
    console.log('✅ Done!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEpisodeCounts();
