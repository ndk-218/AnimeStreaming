// @ts-nocheck
require('dotenv').config();
const mongoose = require('mongoose');

async function simpleTest() {
  try {
    console.log('🧪 Simple MongoDB connection test...');
    
    // Basic connection
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ Connected to MongoDB successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌍 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    // Test basic operation
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({ test: 'connection', timestamp: new Date() });
    
    console.log('✅ Test document inserted');
    
    // Clean up test document
    await testCollection.deleteOne({ test: 'connection' });
    console.log('🗑️ Test document cleaned up');
    
    console.log('\n🎉 Database is working perfectly!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('💡 Check your username/password in connection string');
    } else if (error.message.includes('network')) {
      console.error('💡 Check your internet connection and MongoDB Atlas IP whitelist');
    }
    
    process.exit(1);
  }
}

simpleTest();