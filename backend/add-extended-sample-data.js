/**
 * Extended sample data for Genres and Studios
 * More comprehensive data for testing
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models directly
const Genre = require('./src/models/Genre');
const Studio = require('./src/models/Studio');

// Extended Genres Data (24 genres)
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

// Extended Studios Data (20 studios)
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
  { name: 'TMS Entertainment', description: 'Known for Dr. Stone, Fruits Basket, Detective Conan' },
  { name: 'Studio Deen', description: 'Known for Konosuba, Sakura Trick, Log Horizon' },
  { name: 'White Fox', description: 'Known for Steins;Gate, Re:Zero, The Devil is a Part-Timer!' },
  { name: 'J.C.Staff', description: 'Known for Food Wars, Railgun, Toradora!' },
  { name: 'Sunrise', description: 'Known for Gundam series, Code Geass, Cowboy Bebop' },
  { name: 'Studio Bind', description: 'Known for Mushoku Tensei' }
];

async function addExtendedSampleData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully');
    
    console.log('🗑️ Clearing existing data...');
    await Genre.deleteMany({});
    await Studio.deleteMany({});
    
    console.log('🎭 Adding extended genres...');
    const genres = await Genre.insertMany(genresData);
    console.log(`✅ Added ${genres.length} genres`);
    
    console.log('🎬 Adding extended studios...');
    const studios = await Studio.insertMany(studiosData);
    console.log(`✅ Added ${studios.length} studios`);
    
    console.log('\n📊 Final counts:');
    console.log(`   Genres: ${await Genre.countDocuments()}`);
    console.log(`   Studios: ${await Studio.countDocuments()}`);
    
    // Display some samples
    console.log('\n🎭 Sample Genres:');
    const sampleGenres = await Genre.find().limit(5).select('name description');
    sampleGenres.forEach(genre => {
      console.log(`   - ${genre.name}: ${genre.description.substring(0, 50)}...`);
    });
    
    console.log('\n🎬 Sample Studios:');
    const sampleStudios = await Studio.find().limit(5).select('name description');
    sampleStudios.forEach(studio => {
      console.log(`   - ${studio.name}: ${studio.description.substring(0, 50)}...`);
    });
    
    console.log('\n🎉 Extended sample data added successfully!');
    console.log('💡 You can now use these in your frontend upload forms');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

addExtendedSampleData();
