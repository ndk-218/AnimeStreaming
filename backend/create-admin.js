// @ts-nocheck
require('dotenv').config();
const { connectDatabase, DatabaseUtils } = require('./src/models');

async function createDefaultAdmin() {
  try {
    console.log('👤 Creating default admin user...');
    
    // Connect to database
    await connectDatabase(process.env.MONGODB_URI);
    
    // Seed admin user
    await DatabaseUtils.seedAdminUser();
    
    console.log('\n✅ Default admin created successfully!');
    console.log('\n📝 Default admin credentials:');
    console.log('   📧 Email: admin@animestreaming.com');
    console.log('   🔑 Password: admin123456');
    console.log('\n💡 You can now test admin login with these credentials');
    console.log('\n🔐 IMPORTANT: Change password after first login!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to create admin:', error.message);
    process.exit(1);
  }
}

createDefaultAdmin();
