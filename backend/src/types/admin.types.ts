import { Document } from 'mongoose';

// Base interface
export interface IAdminBase {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'moderator';
  isActive: boolean;
  lastLogin?: Date;
}

// Document interface
export interface IAdminDocument extends IAdminBase, Document {
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Input interface (for registration)
export interface IAdminInput {
  username: string;
  email: string;
  password: string;
  role?: 'admin' | 'moderator';
}

// Login interface
export interface IAdminLogin {
  email: string;
  password: string;
}