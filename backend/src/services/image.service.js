// @ts-nocheck
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

/**
 * ===== IMAGE SERVICE - JAVASCRIPT VERSION =====
 * Xử lý upload và optimize images cho Series và Seasons
 */

// Image type configurations
const IMAGE_CONFIGS = {
  seriesBanner: {
    width: 1920,
    height: 1080,
    quality: 85,
    format: 'jpeg'
  },
  seriesPoster: {
    width: 680,
    height: 1000,
    quality: 85,
    format: 'jpeg'
  },
  seasonPoster: {
    width: 600,      // Changed: Perfect 2:3 ratio
    height: 900,     // 600 * 1.5 = 900
    quality: 90,     // Higher quality for posters
    format: 'jpeg'
  }
};

class ImageService {
  /**
   * Process và save image với Sharp
   * @param {string} tempFilePath - Path to temp uploaded file
   * @param {string} destinationDir - Final destination directory
   * @param {string} fileName - Final filename
   * @param {string} imageType - Type: 'seriesBanner' | 'seasonPoster'
   * @returns {Promise<string>} - Relative path to saved image
   */
  static async processAndSaveImage(tempFilePath, destinationDir, fileName, imageType) {
    try {
      const config = IMAGE_CONFIGS[imageType];
      
      if (!config) {
        throw new Error(`Invalid image type: ${imageType}`);
      }

      // Ensure destination directory exists
      await fs.ensureDir(destinationDir);
      
      const finalPath = path.join(destinationDir, fileName);
      
      console.log(`📸 Processing ${imageType}...`);
      console.log(`   Source: ${tempFilePath}`);
      console.log(`   Destination: ${finalPath}`);
      
      // Process image with Sharp
      await sharp(tempFilePath)
        .resize(config.width, config.height, {
          fit: 'cover',        // Crop to fill, no letterbox
          position: 'center',  // Center crop
          withoutEnlargement: false  // Allow upscaling if needed
        })
        .jpeg({ 
          quality: config.quality,
          progressive: true,    // Progressive JPEG for better loading
          mozjpeg: true         // Use mozjpeg for better compression
        })
        .toFile(finalPath);
      
      // Delete temp file after processing
      await fs.unlink(tempFilePath);
      
      console.log(`✅ Image processed successfully: ${fileName}`);
      
      // ✅ FIXED: Convert to relative path from project root
      const relativePath = path.relative(process.cwd(), finalPath).replace(/\\/g, '/');
      console.log(`📁 Relative path saved to DB: ${relativePath}`);
      return relativePath;
      
    } catch (error) {
      console.error('❌ Image processing error:', error.message);
      
      // Cleanup temp file on error
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup temp file:', cleanupError.message);
      }
      
      throw new Error(`Failed to process image: ${error.message}`);
    }
}

  /**
   * Delete old image file
   * @param {string} imagePath - Path to image file to delete
   */
  static async deleteImage(imagePath) {
    try {
      if (!imagePath) {
        return;
      }

      const fullPath = path.isAbsolute(imagePath) 
        ? imagePath 
        : path.join(process.cwd(), imagePath);

      if (await fs.pathExists(fullPath)) {
        await fs.unlink(fullPath);
        console.log(`🗑️  Deleted old image: ${imagePath}`);
      }
    } catch (error) {
      console.error('❌ Error deleting image:', error.message);
      // Don't throw - it's OK if old file doesn't exist
    }
  }

  /**
   * Process Series Banner
   * @param {string} tempFilePath - Temp file path
   * @param {string} seriesId - Series ID
   * @returns {Promise<string>} - Relative path to saved banner
   */
  static async processSeriesBanner(tempFilePath, seriesId) {
    const destinationDir = path.join(process.cwd(), 'uploads', 'images', 'series', seriesId);
    const fileName = 'banner.jpg';
    
    return await this.processAndSaveImage(
      tempFilePath,
      destinationDir,
      fileName,
      'seriesBanner'
    );
  }

  /**
   * Process Series Poster
   * @param {string} tempFilePath - Temp file path
   * @param {string} seriesId - Series ID
   * @returns {Promise<string>} - Relative path to saved poster
   */
  static async processSeriesPoster(tempFilePath, seriesId) {
    const destinationDir = path.join(process.cwd(), 'uploads', 'images', 'series', seriesId);
    const fileName = 'poster.jpg';
    
    return await this.processAndSaveImage(
      tempFilePath,
      destinationDir,
      fileName,
      'seriesPoster'
    );
  }

  /**
   * Process Season Poster
   * @param {string} tempFilePath - Temp file path
   * @param {string} seasonId - Season ID
   * @returns {Promise<string>} - Relative path to saved poster
   */
  static async processSeasonPoster(tempFilePath, seasonId) {
    const destinationDir = path.join(process.cwd(), 'uploads', 'images', 'seasons', seasonId);
    const fileName = 'poster.jpg';
    
    return await this.processAndSaveImage(
      tempFilePath,
      destinationDir,
      fileName,
      'seasonPoster'
    );
  }

  /**
   * Validate image file
   * @param {Object} file - Multer file object
   * @param {number} maxSizeMB - Max file size in MB
   * @returns {Object} - { valid: boolean, error: string }
   */
  static validateImageFile(file, maxSizeMB = 10) {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return { 
        valid: false, 
        error: `File size exceeds ${maxSizeMB}MB limit` 
      };
    }

    // Check file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return { 
        valid: false, 
        error: 'Invalid file type. Only JPG, PNG, and WebP are allowed' 
      };
    }

    return { valid: true, error: null };
  }

  /**
   * Get image dimensions
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Object>} - { width, height, format }
   */
  static async getImageInfo(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size
      };
    } catch (error) {
      console.error('Error getting image info:', error.message);
      throw error;
    }
  }

  /**
   * Cleanup old images in directory
   * @param {string} directoryPath - Directory to clean
   */
  static async cleanupDirectory(directoryPath) {
    try {
      if (await fs.pathExists(directoryPath)) {
        await fs.emptyDir(directoryPath);
        console.log(`🧹 Cleaned directory: ${directoryPath}`);
      }
    } catch (error) {
      console.error('Error cleaning directory:', error.message);
    }
  }
}

module.exports = ImageService;
