// Migration script to add gender field to existing users
// Run: node backend/src/migrations/add-gender-field.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const addGenderField = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔄 Finding users without gender field...');
    
    // Find all users where gender field doesn't exist or is null
    const usersWithoutGender = await User.find({
      $or: [
        { gender: { $exists: false } },
        { gender: null }
      ]
    });

    console.log(`📊 Found ${usersWithoutGender.length} users without gender field`);

    if (usersWithoutGender.length === 0) {
      console.log('✅ All users already have gender field');
      process.exit(0);
    }

    console.log('\n🔄 Updating users...');
    
    // Update each user
    for (const user of usersWithoutGender) {
      user.gender = 'Không xác định'; // Default value
      await user.save();
      console.log(`✅ Updated user: ${user.email} - gender: ${user.gender}`);
    }

    console.log(`\n✅ Successfully updated ${usersWithoutGender.length} users`);
    
    // Verify
    console.log('\n🔍 Verifying...');
    const remainingUsers = await User.find({
      $or: [
        { gender: { $exists: false } },
        { gender: null }
      ]
    });
    
    console.log(`📊 Users still without gender: ${remainingUsers.length}`);
    
    if (remainingUsers.length === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️ Some users still need migration');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
};

// Run migration
addGenderField();
