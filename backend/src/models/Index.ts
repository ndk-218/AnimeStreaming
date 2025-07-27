import mongoose from 'mongoose';

// ===== EXPORT MODELS =====
export { Series } from './Series';
export { Season } from './Season';  
export { Episode } from './Episode';
export { Admin } from './Admin';
export { ProcessingJob } from './ProcessingJob';

// ===== EXPORT TYPES =====
export type { ISeries } from './Series';
export type { ISeason } from './Season';
export type { IEpisode } from './Episode';
export type { IAdmin } from './Admin';
export type { IProcessingJob } from './ProcessingJob';

// ===== DATABASE CONNECTION ĐƠN GIẢN =====

export const connectDatabase = async (uri: string): Promise<void> => {
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    console.log('✅ Database connected successfully');
    
    // Setup event listeners
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

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log('✅ Database disconnected');
};

// ===== UTILITIES ĐƠN GIẢN =====

export class DatabaseUtils {
  static async seedAdminUser(): Promise<void> {
    try {
      const { Admin } = await import('./Admin');
      
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
  }
  
  static async getStats(): Promise<Record<string, number>> {
    try {
      const { Series, Season, Episode, Admin, ProcessingJob } = await import('./index');
      
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
}

export default mongoose;