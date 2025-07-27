// @ts-nocheck
const mongoose = require('mongoose');

// ===== IMPORT MODELS =====
const Series = require('./Series');
const Season = require('./Season');  
const Episode = require('./Episode');
const Admin = require('./Admin');
const ProcessingJob = require('./ProcessingJob');

// ===== EXPORT MODELS =====
module.exports = {
  Series,
  Season,
  Episode,
  Admin,
  ProcessingJob
};

// ===== SIMPLE DATABASE CONNECTION =====
const connectDatabase = async (uri) => {
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    console.log('✅ Database connected successfully');
    
    // Basic event listeners
    mongoose.connection.on('error', (error) => {
      console.error('❌ Database error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('📡 Database disconnected');
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

const disconnectDatabase = async () => {
  await mongoose.disconnect();
  console.log('✅ Database disconnected');
};

// ===== SIMPLE UTILITIES =====
const DatabaseUtils = {
  async seedAdminUser() {
    try {
      const existingAdmin = await Admin.findOne({ email: 'admin@animestreaming.com' });
      
      if (!existingAdmin) {
        const admin = new Admin({
          email: 'admin@animestreaming.com',
          displayName: 'System Administrator'
        });
        
        await admin.setPassword('admin123456');
        await admin.save();
        
        console.log('👤 Default admin user created');
        console.log('📧 Email: admin@animestreaming.com');
        console.log('🔑 Password: admin123456');
      }
    } catch (error) {
      console.error('❌ Failed to seed admin user:', error);
    }
  },
  
  async getStats() {
    try {
      return {
        series: await Series.countDocuments(),
        seasons: await Season.countDocuments(), 
        episodes: await Episode.countDocuments(),
        admins: await Admin.countDocuments(),
        processingJobs: await ProcessingJob.countDocuments()
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {};
    }
  }
};

// ===== EXPORT FUNCTIONS =====
module.exports.connectDatabase = connectDatabase;
module.exports.disconnectDatabase = disconnectDatabase;
module.exports.DatabaseUtils = DatabaseUtils;