// @ts-nocheck
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
      required: true,
      minlength: 6
    },
    displayName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    lastLoginAt: Date
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ===== BASIC INDEXES =====
adminSchema.index({ email: 1 });

// ===== ESSENTIAL METHODS ONLY =====
adminSchema.methods.setPassword = async function(password) {
  this.password = await bcrypt.hash(password, 10);
  return this;
};

adminSchema.methods.checkPassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Hide password in JSON
adminSchema.methods.toJSON = function() {
  const admin = this.toObject();
  delete admin.password;
  return admin;
};

module.exports = mongoose.model('Admin', adminSchema);