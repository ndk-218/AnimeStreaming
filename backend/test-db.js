// @ts-nocheck
require('dotenv').config();
const { connectDatabase, DatabaseUtils } = require('./src/models');

async function testConnection() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Connect to database
    await connectDatabase(process.env.MONGODB_URI);
    
    // Get connection status
    const connectionInfo = await DatabaseUtils.checkConnection();
    console.log('📊 Connection info:', connectionInfo);
    
    // Get database stats
    const stats = await DatabaseUtils.getStats();
    console.log('📈 Database stats:', stats);
    
    // Seed admin user
    await DatabaseUtils.seedAdminUser();
    
    console.log('✅ Database connection test successful!');
    
    // Simple test without creating indexes
    console.log('\n🧪 Testing basic CRUD operations...');
    
    const { Series } = require('./src/models');
    
    // Create test series
    const testSeries = await Series.create({
      title: 'Test Anime Connection',
      slug: `test-anime-${Date.now()}`,
      description: 'This is a test anime series for connection',
      status: 'upcoming',
      genres: ['Action', 'Test']
    });
    
    console.log('✅ Test series created:', testSeries.title);
    
    // Find and delete test series
    await Series.findByIdAndDelete(testSeries._id);
    console.log('🗑️ Test series cleaned up');
    
    console.log('\n🎉 All tests passed! Your database is ready!');
    console.log('\n📝 Default admin credentials:');
    console.log('   📧 Email: admin@animestreaming.com');
    console.log('   🔑 Password: admin123456');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n💡 Troubleshooting tips:');
      console.error('1. Check your MONGODB_URI in .env file');
      console.error('2. Ensure MongoDB Atlas IP whitelist includes your IP');
      console.error('3. Verify username/password are correct');
      console.error('4. Check network connectivity');
    }
    
    process.exit(1);
  }
}

testConnection();