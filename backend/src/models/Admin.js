const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// ===== SIMPLE ADMIN SCHEMA =====
const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'super_admin'],
      default: 'admin'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: Date
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ===== INDEXES =====
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });

// ===== PRE-SAVE HOOK - Auto hash password =====
adminSchema.pre('save', async function(next) {
  // Only hash password if it's modified or new
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
adminSchema.methods.setPassword = async function(password) {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.password = await bcrypt.hash(password, saltRounds);
};

adminSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// ===== HIDE PASSWORD IN JSON =====
adminSchema.methods.toJSON = function() {
  const admin = this.toObject();
  delete admin.password;
  return admin;
};

module.exports = mongoose.model('Admin', adminSchema);
