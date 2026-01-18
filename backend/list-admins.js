// @ts-nocheck
/**
 * ===== LIST ALL ADMINS SCRIPT =====
 * Hiển thị danh sách tất cả admin trong database
 * 
 * Usage:
 * node list-admins.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./src/models/Admin');

async function listAdmins() {
  try {
    console.log('\n🔄 Connecting to database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get all admins
    const admins = await Admin.find({}).select('email displayName role isActive createdAt lastLogin');

    if (admins.length === 0) {
      console.log('⚠️  No admins found in database\n');
      process.exit(0);
    }

    console.log(`📋 Found ${admins.length} admin(s):\n`);
    console.log('═══════════════════════════════════════════════════════════════════════');
    
    admins.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.displayName}`);
      console.log(`   Email:       ${admin.email}`);
      console.log(`   Role:        ${admin.role}`);
      console.log(`   Status:      ${admin.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   Created:     ${admin.createdAt.toLocaleString()}`);
      console.log(`   Last Login:  ${admin.lastLogin ? admin.lastLogin.toLocaleString() : 'Never'}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════════════');
    console.log('\n💡 To reset password: node reset-admin-password.js <email> <new-password>\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run script
listAdmins();
