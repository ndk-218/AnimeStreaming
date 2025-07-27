import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// ===== INTERFACES =====

interface IAdmin extends Document {
  email: string;
  password: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  
  // Basic info
  displayName: string;
  lastLoginAt?: Date;
  isActive: boolean;
  
  // Security
  loginAttempts: number;
  lockUntil?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ===== SCHEMA =====

const AdminSchema = new Schema<IAdmin>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: { 
    type: String, 
    required: true,
    minlength: 8
  },
  role: { 
    type: String, 
    enum: ['admin', 'super_admin'],
    default: 'admin'
  },
  permissions: [{ 
    type: String,
    enum: [
      'content_upload',
      'content_edit', 
      'content_delete',
      'user_management',
      'system_settings'
    ]
  }],
  
  displayName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  lastLoginAt: { type: Date },
  isActive: { type: Boolean, default: true },
  
  // Security
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date }
}, {
  timestamps: true
});

// ===== INDEXES =====
AdminSchema.index({ email: 1 }, { unique: true });
AdminSchema.index({ isActive: 1 });

// ===== VIRTUAL FIELDS =====
AdminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ===== METHODS =====

AdminSchema.methods.setPassword = async function(password: string) {
  this.password = await bcrypt.hash(password, 12);
  return this;
};

AdminSchema.methods.checkPassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

AdminSchema.methods.hasPermission = function(permission: string): boolean {
  return this.permissions.includes(permission) || this.role === 'super_admin';
};

AdminSchema.methods.incLoginAttempts = function() {
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

AdminSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLoginAt: new Date() }
  });
};

// ===== PRE HOOKS =====
AdminSchema.pre('save', function(next) {
  // Set default permissions based on role
  if (this.role === 'admin' && this.permissions.length === 0) {
    this.permissions = ['content_upload', 'content_edit'];
  } else if (this.role === 'super_admin') {
    this.permissions = [
      'content_upload', 
      'content_edit', 
      'content_delete',
      'user_management',
      'system_settings'
    ];
  }
  
  next();
});

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
export type { IAdmin };