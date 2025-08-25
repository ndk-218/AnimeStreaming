// @ts-nocheck
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

/**
 * ===== FILE UPLOAD MIDDLEWARE =====
 * Multer configuration cho video và subtitle uploads
 */

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = [
    'temp/videos',
    'temp/subtitles', 
    'temp/images',
    'uploads/videos',
    'uploads/subtitles',
    'uploads/images'
  ];

  for (const dir of dirs) {
    await fs.ensureDir(path.join(process.cwd(), dir));
  }
};

// Initialize upload directories
ensureUploadDirs().catch(console.error);

/**
 * Storage configuration cho videos
 */
const videoStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'temp', 'videos');
    await fs.ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-uuid-originalname
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    
    const filename = `${timestamp}-${uniqueId}-${nameWithoutExt}${ext}`;
    cb(null, filename);
  }
});

/**
 * Storage configuration cho subtitles
 */
const subtitleStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'temp', 'subtitles');
    await fs.ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    
    const filename = `${timestamp}-${uniqueId}-${nameWithoutExt}${ext}`;
    cb(null, filename);
  }
});

/**
 * Storage configuration cho images (posters, banners)
 */
const imageStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'images');
    await fs.ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8);
    const ext = path.extname(file.originalname);
    
    const filename = `${timestamp}-${uniqueId}${ext}`;
    cb(null, filename);
  }
});

/**
 * File filter cho videos
 */
const videoFileFilter = (req, file, cb) => {
  const allowedFormats = process.env.ALLOWED_VIDEO_FORMATS?.split(',') || ['mp4', 'mkv', 'avi', 'mov'];
  const ext = path.extname(file.originalname).substring(1).toLowerCase();
  
  if (allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported video format: ${ext}. Allowed: ${allowedFormats.join(', ')}`), false);
  }
};

/**
 * File filter cho subtitles
 */
const subtitleFileFilter = (req, file, cb) => {
  const allowedFormats = process.env.ALLOWED_SUBTITLE_FORMATS?.split(',') || ['srt', 'vtt', 'ass'];
  const ext = path.extname(file.originalname).substring(1).toLowerCase();
  
  if (allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported subtitle format: ${ext}. Allowed: ${allowedFormats.join(', ')}`), false);
  }
};

/**
 * File filter cho images
 */
const imageFileFilter = (req, file, cb) => {
  const allowedFormats = ['jpg', 'jpeg', 'png', 'webp'];
  const ext = path.extname(file.originalname).substring(1).toLowerCase();
  
  if (allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported image format: ${ext}. Allowed: ${allowedFormats.join(', ')}`), false);
  }
};

/**
 * Multer configurations
 */
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 * 1024; // 5GB default

// Video upload configuration
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 1 // Only 1 video file per upload
  }
}).single('videoFile'); // Field name: videoFile

// Subtitle upload configuration (multiple files)
const uploadSubtitles = multer({
  storage: subtitleStorage,
  fileFilter: subtitleFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per subtitle file
    files: 10 // Max 10 subtitle files
  }
}).array('subtitleFiles', 10); // Field name: subtitleFiles

// Single subtitle upload
const uploadSubtitle = multer({
  storage: subtitleStorage,
  fileFilter: subtitleFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('subtitleFile'); // Field name: subtitleFile

// Image upload configuration
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per image
    files: 5 // Max 5 images
  }
}).array('imageFiles', 5); // Field name: imageFiles

// Single image upload
const uploadSingleImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('imageFile'); // Field name: imageFile

/**
 * Combined upload for episode creation (video + subtitles)
 */
const uploadEpisode = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'videoFile') {
        cb(null, path.join(process.cwd(), 'temp', 'videos'));
      } else if (file.fieldname === 'subtitleFiles') {
        cb(null, path.join(process.cwd(), 'temp', 'subtitles'));
      } else {
        cb(new Error('Unexpected field name'), null);
      }
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const uniqueId = uuidv4().substring(0, 8);
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      
      const filename = `${timestamp}-${uniqueId}-${nameWithoutExt}${ext}`;
      cb(null, filename);
    }
  }),
  
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'videoFile') {
      videoFileFilter(req, file, cb);
    } else if (file.fieldname === 'subtitleFiles') {
      subtitleFileFilter(req, file, cb);
    } else {
      cb(new Error('Unexpected field name'), false);
    }
  },
  
  limits: {
    fileSize: maxFileSize,
    files: 11 // 1 video + 10 subtitles max
  }
}).fields([
  { name: 'videoFile', maxCount: 1 },
  { name: 'subtitleFiles', maxCount: 10 }
]);

/**
 * Error handling middleware cho multer
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'File too large. Please check file size limits.'
        });
        
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many files. Please check file count limits.'
        });
        
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected field name. Please check upload field names.'
        });
        
      default:
        return res.status(400).json({
          success: false,
          error: `Upload error: ${error.message}`
        });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next();
};

/**
 * Cleanup temp files after processing
 */
const cleanupTempFile = async (filePath) => {
  try {
    if (filePath && await fs.pathExists(filePath)) {
      await fs.unlink(filePath);
      console.log(`🧹 Cleaned up temp file: ${filePath}`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up temp file:', error.message);
  }
};

/**
 * Validate file existence middleware
 */
const validateFileUpload = (fieldName, required = true) => {
  return (req, res, next) => {
    if (required && (!req.file && !req.files)) {
      return res.status(400).json({
        success: false,
        error: `${fieldName} is required`
      });
    }
    
    next();
  };
};

module.exports = {
  uploadVideo,
  uploadSubtitles,
  uploadSubtitle,
  uploadImage,
  uploadSingleImage,
  uploadEpisode,
  handleUploadError,
  cleanupTempFile,
  validateFileUpload,
  ensureUploadDirs
};