const mongoose = require('mongoose');

/**
 * ===== ADMIN NOTIFICATION MODEL =====
 * Thông báo cho admin về các hoạt động trong hệ thống
 * 
 * 2 Types:
 * - activity: Create/Update/Delete Series/Season/Episode
 * - upload: Episode upload/processing status
 */

const adminNotificationSchema = new mongoose.Schema({
  // Admin thực hiện hành động (null nếu system trigger)
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  adminName: {
    type: String,
    required: true
  },
  
  // Type của notification
  type: {
    type: String,
    enum: ['activity', 'upload'],
    required: true,
    index: true
  },
  
  // Action
  action: {
    type: String,
    enum: ['updated', 'deleted'], // "updated" bao gồm cả create & update
    required: true
  },
  
  // Entity type
  entityType: {
    type: String,
    enum: ['series', 'season', 'episode'],
    required: true
  },
  
  // Entity IDs (null nếu đã bị xóa)
  seriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Series',
    default: null
  },
  seasonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    default: null
  },
  episodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Episode',
    default: null
  },
  
  // Entity names (snapshot tại thời điểm tạo notification)
  seriesName: {
    type: String,
    required: true
  },
  seasonTitle: {
    type: String,
    default: null
  },
  episodeTitle: {
    type: String,
    default: null
  },
  episodeNumber: {
    type: Number,
    default: null
  },
  
  // NOTE: Image is NOT stored here - populated dynamically from entity
  // series.bannerImage, season.posterImage, or episode.seasonId.posterImage
  
  // Processing info (chỉ cho type = 'upload')
  processingStatus: {
    type: String,
    enum: ['uploading', 'upscaling', 'converting', 'completed', 'failed'],
    default: null
  },
  processingProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  processingStage: {
    type: String,
    default: null
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// ===== INDEXES =====
adminNotificationSchema.index({ type: 1, createdAt: -1 }); // Get by type
adminNotificationSchema.index({ isRead: 1, createdAt: -1 }); // Get unread
adminNotificationSchema.index({ createdAt: -1 }); // Sort by time
adminNotificationSchema.index({ episodeId: 1, type: 1 }); // Find upload notification by episode

// ===== INSTANCE METHODS =====

/**
 * Mark notification as read
 */
adminNotificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  return await this.save();
};

/**
 * Update processing status (cho upload notifications)
 */
adminNotificationSchema.methods.updateProcessing = async function(status, progress, stage) {
  this.processingStatus = status;
  this.processingProgress = progress || this.processingProgress;
  if (stage) this.processingStage = stage;
  this.updatedAt = new Date();
  return await this.save();
};

// ===== STATIC METHODS =====

/**
 * Mark multiple notifications as read
 */
adminNotificationSchema.statics.markMultipleAsRead = async function(notificationIds) {
  return await this.updateMany(
    { _id: { $in: notificationIds } },
    { $set: { isRead: true } }
  );
};

/**
 * Mark all as read
 */
adminNotificationSchema.statics.markAllAsRead = async function(type = null) {
  const filter = type ? { type, isRead: false } : { isRead: false };
  return await this.updateMany(filter, { $set: { isRead: true } });
};

/**
 * Delete old notifications (> 30 days)
 */
adminNotificationSchema.statics.deleteOldNotifications = async function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await this.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
  console.log(`🗑️ Deleted ${result.deletedCount} old admin notifications (>30 days)`);
  return result;
};

/**
 * Get activity notifications with populated images
 */
adminNotificationSchema.statics.getActivityNotifications = async function(limit = 50) {
  const notifications = await this.find({ type: 'activity' })
    .populate('seriesId', 'title bannerImage posterImage')
    .populate('seasonId', 'title posterImage')
    .populate({
      path: 'episodeId',
      select: 'title episodeNumber',
      populate: {
        path: 'seasonId',
        select: 'posterImage'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  
  // Add computed image field
  return notifications.map(notif => ({
    ...notif,
    image: getImageFromNotification(notif)
  }));
};

/**
 * Get upload notifications with populated images
 */
adminNotificationSchema.statics.getUploadNotifications = async function(limit = 50) {
  const notifications = await this.find({ type: 'upload' })
    .populate('seriesId', 'title bannerImage posterImage')
    .populate('seasonId', 'title posterImage')
    .populate({
      path: 'episodeId',
      select: 'title episodeNumber',
      populate: {
        path: 'seasonId',
        select: 'posterImage'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  
  // Add computed image field
  return notifications.map(notif => ({
    ...notif,
    image: getImageFromNotification(notif)
  }));
};

/**
 * Helper: Get image from populated entities
 */
function getImageFromNotification(notif) {
  // Priority: episode season poster > season poster > series banner > series poster
  if (notif.episodeId?.seasonId?.posterImage) {
    return notif.episodeId.seasonId.posterImage;
  }
  if (notif.seasonId?.posterImage) {
    return notif.seasonId.posterImage;
  }
  if (notif.seriesId?.bannerImage) {
    return notif.seriesId.bannerImage;
  }
  if (notif.seriesId?.posterImage) {
    return notif.seriesId.posterImage;
  }
  return null; // Entity deleted or no image
}

/**
 * Get unread count
 */
adminNotificationSchema.statics.getUnreadCount = async function(type = null) {
  const filter = { isRead: false };
  if (type) filter.type = type;
  return await this.countDocuments(filter);
};

/**
 * Find upload notification by episodeId
 */
adminNotificationSchema.statics.findUploadNotification = async function(episodeId) {
  return await this.findOne({ 
    episodeId, 
    type: 'upload' 
  }).sort({ createdAt: -1 });
};

const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);

module.exports = AdminNotification;
