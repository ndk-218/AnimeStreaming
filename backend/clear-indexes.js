/**
 * Script to clear and recreate MongoDB indexes
 * Run this if you get duplicate index warnings
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function clearIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully');
    
    const collections = ['series', 'genres', 'studios', 'seasons', 'episodes', 'admins'];
    
    for (const collectionName of collections) {
      try {
        console.log(`🧹 Clearing indexes for ${collectionName}...`);
        const collection = mongoose.connection.db.collection(collectionName);
        
        // Get current indexes
        const indexes = await collection.indexes();
        console.log(`   Found ${indexes.length} indexes`);
        
        // Drop all indexes except _id
        for (const index of indexes) {
          if (index.name !== '_id_') {
            await collection.dropIndex(index.name);
            console.log(`   ✅ Dropped index: ${index.name}`);
          }
        }
        
      } catch (error) {
        if (error.message.includes('ns not found')) {
          console.log(`   ⚠️ Collection ${collectionName} doesn't exist yet`);
        } else {
          console.log(`   ❌ Error with ${collectionName}:`, error.message);
        }
      }
    }
    
    console.log('🎉 All indexes cleared!');
    console.log('📝 Note: Indexes will be recreated when you restart the server');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

clearIndexes();
