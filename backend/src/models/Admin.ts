import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

// ===== INTERFACE ĐƠN GIẢN =====
export interface IAdmin extends Document {
  email: string;
  password: string;
  displayName: string;
  isActive: boolean;
  lastLoginAt?: Date;
}

// ===== SCHEMA ĐƠN GIẢN =====
const adminSchema = new Schema<IAdmin>(
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
    versionKey: false // Disable __v
  }
);

// ===== INDEX CƠ BẢN =====
adminSchema.index({ email: 1 });

// ===== METHODS ĐƠN GIẢN =====
adminSchema.methods.setPassword = async function(password: string) {
  this.password = await bcrypt.hash(password, 10);
  return this;
};

adminSchema.methods.checkPassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

adminSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);