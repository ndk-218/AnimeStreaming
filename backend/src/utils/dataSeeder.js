/**
 * Data seeding script for Studios and Genres
 * Run this to populate the database with initial data for testing
 */

const Studio = require('../models/Studio');
const Genre = require('../models/Genre');

// Sample Studio data
const studiosData = [
  { name: 'Mappa', description: 'Known for Attack on Titan, Jujutsu Kaisen, Chainsaw Man' },
  { name: 'Studio Pierrot', description: 'Known for Naruto, Bleach, Tokyo Ghoul' },
  { name: 'Madhouse', description: 'Known for One Punch Man, Death Note, Hunter x Hunter' },
  { name: 'Wit Studio', description: 'Known for Attack on Titan, Vinland Saga, Spy x Family' },
  { name: 'Bones', description: 'Known for My Hero Academia, Fullmetal Alchemist, Mob Psycho 100' },
  { name: 'Toei Animation', description: 'Known for Dragon Ball, One Piece, Sailor Moon' },
  { name: 'Studio Ghibli', description: 'Known for Spirited Away, My Neighbor Totoro, Princess Mononoke' },
  { name: 'A-1 Pictures', description: 'Known for Sword Art Online, Your Lie in April, Fairy Tail' },
  { name: 'CloverWorks', description: 'Known for Spy x Family, The Promised Neverland, Horimiya' },
  { name: 'Ufotable', description: 'Known for Demon Slayer, Fate series, Tales of series' },
  { name: 'Studio Trigger', description: 'Known for Kill la Kill, Little Witch Academia, Promare' },
  { name: 'Kyoto Animation', description: 'Known for K-On!, Violet Evergarden, A Silent Voice' },
  { name: 'Production I.G', description: 'Known for Ghost in the Shell, Haikyuu, Psycho-Pass' },
  { name: 'Shaft', description: 'Known for Monogatari series, March Comes in Like a Lion' },
  { name: 'TMS Entertainment', description: 'Known for Dr. Stone, Fruits Basket, Detective Conan' }
];

// Sample Genre data
const genresData = [
  { name: 'Action', description: 'Fast-paced stories with physical conflict and excitement' },
  { name: 'Adventure', description: 'Stories involving journeys and exploration' },
  { name: 'Comedy', description: 'Humorous and light-hearted stories' },
  { name: 'Drama', description: 'Serious stories focusing on character development' },
  { name: 'Fantasy', description: 'Stories with magical or supernatural elements' },
  { name: 'Romance', description: 'Stories focused on romantic relationships' },
  { name: 'Slice of Life', description: 'Realistic stories about everyday life' },
  { name: 'Thriller', description: 'Suspenseful stories with tension and excitement' },
  { name: 'Horror', description: 'Stories designed to frighten and create suspense' },
  { name: 'Mystery', description: 'Stories involving puzzles and unknown elements' },
  { name: 'Sci-Fi', description: 'Science fiction stories with futuristic elements' },
  { name: 'Supernatural', description: 'Stories with paranormal or otherworldly elements' },
  { name: 'Psychological', description: 'Stories exploring mental and emotional states' },
  { name: 'Historical', description: 'Stories set in the past' },
  { name: 'Military', description: 'Stories involving armed forces and warfare' },
  { name: 'Sports', description: 'Stories centered around athletic competition' },
  { name: 'Music', description: 'Stories focused on musical themes' },
  { name: 'School', description: 'Stories set in educational environments' },
  { name: 'Shounen', description: 'Target audience: young males (action, adventure)' },
  { name: 'Shoujo', description: 'Target audience: young females (romance, drama)' },
  { name: 'Seinen', description: 'Target audience: adult males (mature themes)' },
  { name: 'Josei', description: 'Target audience: adult females (realistic romance)' },
  { name: 'Mecha', description: 'Stories featuring giant robots or mechanical suits' },
  { name: 'Isekai', description: 'Stories about being transported to another world' }
];

class DataSeeder {
  static async seedStudios() {
    try {
      console.log('🎬 Seeding Studios...');
      
      // Clear existing studios
      await Studio.deleteMany({});
      
      // Insert sample studios
      const studios = await Studio.insertMany(studiosData);
      
      console.log(`✅ Created ${studios.length} studios`);
      return studios;
    } catch (error) {
      console.error('❌ Error seeding studios:', error);
      throw error;
    }
  }
  
  static async seedGenres() {
    try {
      console.log('🎭 Seeding Genres...');
      
      // Clear existing genres
      await Genre.deleteMany({});
      
      // Insert sample genres
      const genres = await Genre.insertMany(genresData);
      
      console.log(`✅ Created ${genres.length} genres`);
      return genres;
    } catch (error) {
      console.error('❌ Error seeding genres:', error);
      throw error;
    }
  }
  
  static async seedAll() {
    try {
      console.log('🌱 Starting data seeding...');
      
      await this.seedStudios();
      await this.seedGenres();
      
      console.log('🎉 All data seeded successfully!');
    } catch (error) {
      console.error('❌ Data seeding failed:', error);
      throw error;
    }
  }
}

module.exports = DataSeeder;

// Run seeding if called directly
if (require.main === module) {
  // Load environment variables first
  require('dotenv').config();
  
  const { connectDatabase } = require('../models');
  
  async function runSeeder() {
    try {
      console.log('🔧 Loading environment variables...');
      
      // Check if MONGODB_URI exists
      if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI not found in environment variables');
        console.log('💡 Make sure .env file exists in backend/ directory');
        process.exit(1);
      }
      
      console.log('🔗 Connecting to database...');
      await connectDatabase(process.env.MONGODB_URI);
      console.log('✅ Connected to database');
      
      console.log('🌱 Starting data seeding...');
      await DataSeeder.seedAll();
      
      console.log('🎉 Data seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    }
  }
  
  runSeeder();
}
