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

// ===== ENHANCED DATABASE CONNECTION =====
const connectDatabase = async (uri) => {
  try {
    // Check if URI is provided
    if (!uri) {
      throw new Error('MongoDB URI is required');
    }
    
    console.log('🔌 Connecting to MongoDB...');
    console.log(`📍 Database URI: ${uri.replace(/\/\/[^:]*:[^@]*@/, '//***:***@')}`); // Hide credentials
    
    // Connection options (Simplified for compatibility)
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    await mongoose.connect(uri, options);
    
    console.log('✅ Database connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌍 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    // Setup event listeners
    mongoose.connection.on('error', (error) => {
      console.error('❌ Database error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('📡 Database disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Database reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('✅ Database connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing database connection:', error);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Detailed error logging
    if (error.name === 'MongooseServerSelectionError') {
      console.error('💡 Connection tips:');
      console.error('   - Check if MongoDB URI is correct');
      console.error('   - Verify network access (MongoDB Atlas whitelist)');
      console.error('   - Ensure MongoDB service is running (local setup)');
    }
    
    throw error;
  }
};

const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting database:', error);
  }
};

// ===== ENHANCED UTILITIES =====
const DatabaseUtils = {
  async seedAdminUser() {
    try {
      console.log('👤 Checking for admin user...');
      
      const existingAdmin = await Admin.findOne({ email: 'admin@animestreaming.com' });
      
      if (!existingAdmin) {
        const admin = new Admin({
          email: 'admin@animestreaming.com',
          displayName: 'System Administrator',
          role: 'super_admin',
          isActive: true
        });
        
        await admin.setPassword('admin123456');
        await admin.save();
        
        console.log('👤 Default admin user created:');
        console.log('   📧 Email: admin@animestreaming.com');
        console.log('   🔑 Password: admin123456');
        console.log('   ⚠️  Please change password after first login!');
      } else {
        console.log('👤 Admin user already exists');
      }
    } catch (error) {
      console.error('❌ Failed to seed admin user:', error.message);
    }
  },
  
  async getStats() {
    try {
      const stats = await Promise.all([
        Series.countDocuments(),
        Season.countDocuments(), 
        Episode.countDocuments(),
        Admin.countDocuments(),
        ProcessingJob.countDocuments()
      ]);

      return {
        series: stats[0],
        seasons: stats[1],
        episodes: stats[2],
        admins: stats[3],
        processingJobs: stats[4]
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        series: 0,
        seasons: 0,
        episodes: 0,
        admins: 0,
        processingJobs: 0
      };
    }
  },

  async checkConnection() {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected', 
        2: 'connecting',
        3: 'disconnecting'
      };
      
      return {
        status: states[state],
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  },

  async createIndexes() {
    try {
      console.log('📊 Creating database indexes...');
      
      // Create text indexes for search
      await Series.createIndexes();
      await Season.createIndexes();
      await Episode.createIndexes();
      await Admin.createIndexes();
      
      console.log('✅ Database indexes created');
    } catch (error) {
      console.error('❌ Failed to create indexes:', error.message);
    }
  }
};

// ===== EXPORT FUNCTIONS =====
module.exports.connectDatabase = connectDatabase;
module.exports.disconnectDatabase = disconnectDatabase;
module.exports.DatabaseUtils = DatabaseUtils;