const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// ===== USER SCHEMA =====
const userSchema = new mongoose.Schema(
  {
    // Basic Info
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    
    // Avatar
    avatar: {
      type: String,
      default: '/assets/default-avatar.png'
    },
    
    // Gender
    gender: {
      type: String,
      enum: ['Nam', 'Nữ', 'Không xác định'],
      default: 'Không xác định'
    },
    
    // Account Status
    isEmailVerified: {
      type: Boolean,
      default: true  // Changed: User không cần verify email khi đăng ký
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    
    // Premium Status
    isPremium: {
      type: Boolean,
      default: false,
      index: true
    },
    premiumExpiry: {
      type: Date,
      default: null
    },
    
    // Email Verification
    verificationToken: {
      type: String,
      default: null,
      index: true
    },
    verificationTokenExpiry: {
      type: Date,
      default: null
    },
    
    // Password Reset
    resetPasswordToken: {
      type: String,
      default: null,
      index: true
    },
    resetPasswordExpiry: {
      type: Date,
      default: null
    },
    
    // Refresh Token (for JWT)
    refreshToken: {
      type: String,
      default: null
    },
    
    // Activity
    lastLogin: Date,
    
    // Favorites (Series IDs)
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Series'
    }],
    
    // Watch History - Episode-based with timestamp
    watchHistory: [{
      seriesId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Series',
        required: true
      },
      seasonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Season',
        required: true
      },
      episodeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Episode',
        required: true
      },
      episodeNumber: {
        type: Number,
        required: true
      },
      watchedDuration: {
        type: Number,  // seconds
        required: true,
        default: 0
      }
    }]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ===== PRE-SAVE HOOK - Auto hash password =====
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// ===== PASSWORD METHODS =====
userSchema.methods.setPassword = async function(password) {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.password = await bcrypt.hash(password, saltRounds);
};

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// ===== PREMIUM METHODS =====
userSchema.methods.isPremiumActive = function() {
  if (!this.isPremium) return false;
  if (!this.premiumExpiry) return false;
  return new Date() < this.premiumExpiry;
};

userSchema.methods.setPremium = function(months = 1) {
  this.isPremium = true;
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);
  this.premiumExpiry = expiry;
};

userSchema.methods.removePremium = function() {
  this.isPremium = false;
  this.premiumExpiry = null;
};

// ===== FAVORITES METHODS =====
userSchema.methods.addFavorite = async function(seriesId) {
  if (!this.favorites.includes(seriesId)) {
    this.favorites.push(seriesId);
    await this.save();
  }
};

userSchema.methods.removeFavorite = async function(seriesId) {
  this.favorites = this.favorites.filter(
    id => id.toString() !== seriesId.toString()
  );
  await this.save();
};

userSchema.methods.isFavorite = function(seriesId) {
  return this.favorites.some(
    id => id.toString() === seriesId.toString()
  );
};

// ===== WATCH HISTORY METHODS =====
userSchema.methods.updateWatchHistory = async function(seriesId, seasonId, episodeId, episodeNumber, watchedDuration) {
  // Find existing history for this series
  const existingIndex = this.watchHistory.findIndex(
    h => h.seriesId.toString() === seriesId.toString()
  );
  
  if (existingIndex >= 0) {
    // Only update if new episode number is greater OR same episode with different duration
    const existing = this.watchHistory[existingIndex];
    if (episodeNumber > existing.episodeNumber || 
        (episodeNumber === existing.episodeNumber && episodeId.toString() === existing.episodeId.toString())) {
      this.watchHistory[existingIndex] = {
        seriesId,
        seasonId,
        episodeId,
        episodeNumber,
        watchedDuration
      };
    }
  } else {
    // Add new history
    this.watchHistory.push({
      seriesId,
      seasonId,
      episodeId,
      episodeNumber,
      watchedDuration
    });
  }
  
  await this.save();
};

userSchema.methods.getWatchHistory = function(seriesId) {
  return this.watchHistory.find(
    h => h.seriesId.toString() === seriesId.toString()
  );
};

// ===== HIDE SENSITIVE DATA IN JSON =====
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  delete user.verificationTokenExpiry;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpiry;
  delete user.refreshToken;
  return user;
};

module.exports = mongoose.model('User', userSchema);
