import mongoose from 'mongoose';

// ===== PHASE 1 MODELS (REQUIRED) =====
import { Series } from './Series';
import { Season } from './Season';  
import { Episode } from './Episode';
import { Admin } from './Admin';
import { ProcessingJob } from './ProcessingJob';

// ===== PHASE 2 MODELS (TODO - IMPLEMENT LATER) =====
// import { User } from './User';
// import { Comment } from './Comment';
// import { Rating } from './Rating';

// ===== DATABASE CONNECTION =====

interface DatabaseConfig {
  uri: string;
  options?: mongoose.ConnectOptions;
}

export class Database {
  private static instance: Database;
  
  private constructor() {}
  
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
  
  public async connect(config: DatabaseConfig): Promise<void> {
    try {
      const defaultOptions: mongoose.ConnectOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0
      };
      
      const options = { ...defaultOptions, ...config.options };
      
      await mongoose.connect(config.uri, options);
      
      console.log('✅ Database connected successfully');
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Create indexes
      await this.createIndexes();
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }
  
  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }
  
  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connected to MongoDB');
    });
    
    mongoose.connection.on('error', (error) => {
      console.error('❌ Mongoose connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('📡 Mongoose disconnected from MongoDB');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }
  
  private async createIndexes(): Promise<void> {
    try {
      console.log('🔍 Creating database indexes...');
      
      // Create indexes for all models
      await Promise.all([
        Series.createIndexes(),
        Season.createIndexes(),
        Episode.createIndexes(),
        Admin.createIndexes(),
        ProcessingJob.createIndexes()
      ]);
      
      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Failed to create indexes:', error);
      throw error;
    }
  }
  
  public getConnection(): typeof mongoose {
    return mongoose;
  }
  
  public isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

// ===== HELPER FUNCTIONS =====

export const connectDatabase = async (uri: string, options?: mongoose.ConnectOptions): Promise<void> => {
  const db = Database.getInstance();
  await db.connect({ uri, options });
};

export const disconnectDatabase = async (): Promise<void> => {
  const db = Database.getInstance();
  await db.disconnect();
};

// ===== EXPORT MODELS =====

// Phase 1 Models (Current)
export {
  Series,
  Season,
  Episode,
  Admin,
  ProcessingJob
};

// Re-export types
export type { ISeries } from './Series';
export type { ISeason } from './Season';
export type { IEpisode } from './Episode';
export type { IAdmin } from './Admin';
export type { IProcessingJob } from './ProcessingJob';

// ===== MODEL COLLECTIONS MAP =====
export const ModelCollections = {
  // Phase 1
  series: 'series',
  seasons: 'seasons',
  episodes: 'episodes', 
  admins: 'admins',
  processingJobs: 'processingJobs',
  
  // Phase 2 (TODO)
  // users: 'users',
  // comments: 'comments',
  // ratings: 'ratings'
} as const;

// ===== DATABASE UTILITIES =====

export class DatabaseUtils {
  static async clearCollection(modelName: string): Promise<void> {
    const model = mongoose.model(modelName);
    await model.deleteMany({});
    console.log(`🗑️ Cleared collection: ${modelName}`);
  }
  
  static async seedAdminUser(): Promise<void> {
    const existingAdmin = await Admin.findOne({ email: 'admin@animestreaming.com' });
    
    if (!existingAdmin) {
      const admin = new Admin({
        email: 'admin@animestreaming.com',
        displayName: 'System Administrator',
        role: 'super_admin'
      });
      
      await admin.setPassword('admin123456');
      await admin.save();
      
      console.log('👤 Default admin user created');
      console.log('📧 Email: admin@animestreaming.com');
      console.log('🔑 Password: admin123456');
    }
  }
  
  static async getCollectionStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};
    
    stats.series = await Series.countDocuments();
    stats.seasons = await Season.countDocuments(); 
    stats.episodes = await Episode.countDocuments();
    stats.admins = await Admin.countDocuments();
    stats.processingJobs = await ProcessingJob.countDocuments();
    
    return stats;
  }
  
  static async validateModelReferences(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      // Check seasons reference valid series
      const orphanedSeasons = await Season.find({}).populate('seriesId');
      orphanedSeasons.forEach(season => {
        if (!season.seriesId) {
          issues.push(`Season ${season._id} references non-existent series`);
        }
      });
      
      // Check episodes reference valid seasons and series
      const orphanedEpisodes = await Episode.find({}).populate('seasonId seriesId');
      orphanedEpisodes.forEach(episode => {
        if (!episode.seasonId) {
          issues.push(`Episode ${episode._id} references non-existent season`);
        }
        if (!episode.seriesId) {
          issues.push(`Episode ${episode._id} references non-existent series`);
        }
      });
      
    } catch (error) {
      issues.push(`Validation error: ${error}`);
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// ===== DEVELOPMENT HELPERS =====

export const DevUtils = {
  async resetDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot reset database in production');
    }
    
    console.log('🔄 Resetting database...');
    
    await Promise.all([
      DatabaseUtils.clearCollection('Series'),
      DatabaseUtils.clearCollection('Season'),
      DatabaseUtils.clearCollection('Episode'),
      DatabaseUtils.clearCollection('Admin'),
      DatabaseUtils.clearCollection('ProcessingJob')
    ]);
    
    await DatabaseUtils.seedAdminUser();
    console.log('✅ Database reset complete');
  },
  
  async createSampleData(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot create sample data in production');
    }
    
    // Sample series
    const series = new Series({
      title: {
        english: 'Attack on Titan',
        romaji: 'Shingeki no Kyojin',
        japanese: '進撃の巨人'
      },
      description: 'Humanity fights for survival against giant humanoid Titans.',
      genres: ['Action', 'Drama', 'Fantasy'],
      studio: 'Mappa',
      releaseYear: 2013,
      slug: 'attack-on-titan'
    });
    
    await series.save();
    console.log('📺 Sample series created');
  }
};

export default Database;