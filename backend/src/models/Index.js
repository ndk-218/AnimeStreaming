const mongoose = require('mongoose');

// Import models
const Series = require('./Series');
const Season = require('./Season');
const Episode = require('./Episode');
const Admin = require('./Admin');
const Studio = require('./Studio');
const Genre = require('./Genre');
const User = require('./User');
const ChatConversation = require('./ChatConversation');

// Database connection function
const connectDatabase = async (mongoUri) => {
  try {
    // Simplified connection options for newer MongoDB driver
    const connectionOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    await mongoose.connect(mongoUri, connectionOptions);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

module.exports = {
  connectDatabase,
  Series,
  Season,
  Episode,
  Admin,
  Studio,
  Genre,
  User,
  ChatConversation
};
