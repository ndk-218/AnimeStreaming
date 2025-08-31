/**
 * Simple script to add sample data directly to MongoDB
 * No auth required - just direct database connection
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models directly
const Genre = require('./src/models/Genre');
const Studio = require('./src/models/Studio');

// Sample data
const genresData = [
  { name: 'Action', description: 'Fast-paced stories with physical conflict and excitement' },
  { name: 'Adventure', description: 'Stories involving journeys and exploration' },
  { name: 'Comedy', description: 'Humorous and light-hearted stories' },
  { name: 'Drama', description: 'Serious stories focusing on character development' },
  { name: 'Fantasy', description: 'Stories with magical or supernatural elements' },
  { name: 'Romance', description: 'Stories focused on romantic relationships' },
  { name: 'Slice of Life', description: 'Realistic stories about everyday life' },
  { name: 'Shounen', description: 'Target audience: young males (action, adventure)' },
  { name: 'Shoujo', description: 'Target audience: young females (romance, drama)' },
  { name: 'Isekai', description: 'Stories about being transported to another world' }
];

const studiosData = [
  { name: 'Mappa', description: 'Known for Attack on Titan, Jujutsu Kaisen, Chainsaw Man' },
  { name: 'Studio Pierrot', description: 'Known for Naruto, Bleach, Tokyo Ghoul' },
  { name: 'Madhouse', description: 'Known for One Punch Man, Death Note, Hunter x Hunter' },
  { name: 'Wit Studio', description: 'Known for Attack on Titan, Vinland Saga, Spy x Family' },
  { name: 'Bones', description: 'Known for My Hero Academia, Fullmetal Alchemist' },
  { name: 'Toei Animation', description: 'Known for Dragon Ball, One Piece, Sailor Moon' },
  { name: 'A-1 Pictures', description: 'Known for Sword Art Online, Your Lie in April' },
  { name: 'Ufotable', description: 'Known for Demon Slayer, Fate series' },
  { name: 'Kyoto Animation', description: 'Known for K-On!, Violet Evergarden, A Silent Voice' }
];

async function addSampleData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully');
    
    console.log('🗑️ Clearing existing data...');
    await Genre.deleteMany({});
    await Studio.deleteMany({});
    
    console.log('🎭 Adding genres...');
    const genres = await Genre.insertMany(genresData);
    console.log(`✅ Added ${genres.length} genres`);
    
    console.log('🎬 Adding studios...');
    const studios = await Studio.insertMany(studiosData);
    console.log(`✅ Added ${studios.length} studios`);
    
    console.log('\n📊 Final counts:');
    console.log(`   Genres: ${await Genre.countDocuments()}`);
    console.log(`   Studios: ${await Studio.countDocuments()}`);
    
    console.log('\n🎉 Sample data added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

addSampleData();
