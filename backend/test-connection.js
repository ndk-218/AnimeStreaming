// @ts-nocheck
require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🧪 Testing MongoDB connection...');
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    
    // Check if MONGODB_URI exists
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    // Hide credentials for logging
    const safeUri = process.env.MONGODB_URI.replace(/\/\/[^:]*:[^@]*@/, '//***:***@');
    console.log('🔗 Connecting to:', safeUri);
    
    // Connection options
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('✅ Connected to MongoDB successfully!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌍 Host:', `${mongoose.connection.host}:${mongoose.connection.port}`);
    
    // Test basic operation
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({ 
      test: 'connection', 
      timestamp: new Date(),
      message: 'Connection test successful' 
    });
    
    console.log('✅ Test document inserted');
    
    // Clean up test document
    await testCollection.deleteOne({ test: 'connection' });
    console.log('🗑️ Test document cleaned up');
    
    console.log('\n🎉 Database connection test PASSED!');
    console.log('💡 You can now run: npm run dev');
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Connection closed gracefully');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Database connection test FAILED!');
    console.error('💥 Error:', error.message);
    
    // Specific error handling
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check username/password in MONGODB_URI');
      console.error('   - Verify database name is correct');
    } else if (error.message.includes('network') || error.name === 'MongooseServerSelectionError') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check internet connection');
      console.error('   - Verify MongoDB Atlas IP whitelist includes your IP');
      console.error('   - Check if MongoDB Atlas cluster is active');
    } else if (error.message.includes('MONGODB_URI not found')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Ensure .env file exists in backend/ directory');
      console.error('   - Check MONGODB_URI is properly set in .env file');
    }
    
    process.exit(1);
  }
}

// Run the test
testConnection();
