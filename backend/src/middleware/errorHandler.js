// @ts-nocheck

/**
 * ===== GLOBAL ERROR HANDLER MIDDLEWARE =====
 * Centralized error handling cho toàn application
 */

/**
 * Development error handler - show full error details
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message,
      name: err.name,
      stack: err.stack,
      statusCode: err.statusCode,
      code: err.code
    }
  });
};

/**
 * Production error handler - hide sensitive details
 */
const sendErrorProd = (err, res) => {
  // Operational errors (known errors) - safe to send to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: {
        message: err.message,
        code: err.code || 'UNKNOWN_ERROR'
      }
    });
  } else {
    // Programming errors - log error but don't expose details
    console.error('❌ Programming Error:', err);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Something went wrong on our end. Please try again later.',
        code: 'INTERNAL_SERVER_ERROR'
      }
    });
  }
};

/**
 * Handle MongoDB Cast Error (Invalid ObjectId)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  const error = new Error(message);
  error.statusCode = 400;
  error.isOperational = true;
  error.code = 'INVALID_ID';
  return error;
};

/**
 * Handle MongoDB Duplicate Key Error
 */
const handleDuplicateFieldsDB = (err) => {
  const duplicateFields = Object.keys(err.keyValue);
  const message = `Duplicate field(s): ${duplicateFields.join(', ')}. Please use different values.`;
  
  const error = new Error(message);
  error.statusCode = 400;
  error.isOperational = true;
  error.code = 'DUPLICATE_FIELD';
  return error;
};

/**
 * Handle MongoDB Validation Error
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(val => val.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  
  const error = new Error(message);
  error.statusCode = 400;
  error.isOperational = true;
  error.code = 'VALIDATION_ERROR';
  return error;
};

/**
 * Handle JWT Invalid Token Error
 */
const handleJWTError = () => {
  const error = new Error('Invalid token. Please login again.');
  error.statusCode = 401;
  error.isOperational = true;
  error.code = 'INVALID_TOKEN';
  return error;
};

/**
 * Handle JWT Expired Token Error
 */
const handleJWTExpiredError = () => {
  const error = new Error('Your token has expired. Please login again.');
  error.statusCode = 401;
  error.isOperational = true;
  error.code = 'EXPIRED_TOKEN';
  return error;
};

/**
 * Handle file upload errors
 */
const handleFileUploadError = (err) => {
  let message = 'File upload error';
  let code = 'UPLOAD_ERROR';
  
  if (err.message.includes('File too large')) {
    message = 'File size exceeds the allowed limit';
    code = 'FILE_TOO_LARGE';
  } else if (err.message.includes('Unsupported')) {
    message = err.message;
    code = 'UNSUPPORTED_FORMAT';
  }
  
  const error = new Error(message);
  error.statusCode = 400;
  error.isOperational = true;
  error.code = code;
  return error;
};

/**
 * Handle video processing errors
 */
const handleVideoProcessingError = (err) => {
  const message = 'Video processing failed. Please check the file format and try again.';
  const error = new Error(message);
  error.statusCode = 422;
  error.isOperational = true;
  error.code = 'VIDEO_PROCESSING_ERROR';
  return error;
};

/**
 * Main error handler middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  // Set default error properties
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Log error for debugging
  console.error(`❌ Error occurred on ${req.method} ${req.originalUrl}:`);
  console.error(err);
  
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;

  // Handle specific error types
  if (error.name === 'CastError') {
    error = handleCastErrorDB(error);
  }
  
  if (error.code === 11000) {
    error = handleDuplicateFieldsDB(error);
  }
  
  if (error.name === 'ValidationError') {
    error = handleValidationErrorDB(error);
  }
  
  if (error.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }
  
  if (error.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }
  
  if (error.message && error.message.includes('upload')) {
    error = handleFileUploadError(error);
  }
  
  if (error.message && error.message.includes('ffmpeg')) {
    error = handleVideoProcessingError(error);
  }

  // Send appropriate response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * Handle unhandled routes (404)
 */
const notFound = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found on this server`;
  const error = new Error(message);
  error.statusCode = 404;
  error.isOperational = true;
  error.code = 'ROUTE_NOT_FOUND';
  
  next(error);
};

/**
 * Create operational error (known errors that are safe to show to users)
 */
const createOperationalError = (message, statusCode = 500, code = 'UNKNOWN_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  error.code = code;
  return error;
};

/**
 * Async error handler wrapper để catch lỗi từ async functions
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Validation error handler
 */
const handleValidationErrors = (errors) => {
  const messages = errors.map(error => error.msg || error.message);
  const message = `Validation failed: ${messages.join(', ')}`;
  
  const error = new Error(message);
  error.statusCode = 400;
  error.isOperational = true;
  error.code = 'VALIDATION_FAILED';
  return error;
};

/**
 * Handle database connection errors
 */
const handleDatabaseError = (err) => {
  let message = 'Database connection error';
  let code = 'DATABASE_ERROR';
  
  if (err.message.includes('ECONNREFUSED')) {
    message = 'Unable to connect to database. Please try again later.';
    code = 'DATABASE_CONNECTION_REFUSED';
  } else if (err.message.includes('authentication failed')) {
    message = 'Database authentication failed';
    code = 'DATABASE_AUTH_FAILED';
  }
  
  const error = new Error(message);
  error.statusCode = 503;
  error.isOperational = true;
  error.code = code;
  return error;
};

module.exports = {
  globalErrorHandler,
  notFound,
  createOperationalError,
  catchAsync,
  handleValidationErrors,
  handleDatabaseError
};