const mongoose = require('mongoose');

/**
 * Notification Model
 * 2 types: episode_release, comment_reply
 */
const notificationSchema = new mongoose.Schema({
  // Người nhận thông báo
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Loại thông báo
  type: {
    type: String,
    enum: ['episode_release', 'comment_reply'],
    required: true
  },
  
  // Content references
  seriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Series',
    required: true
  },
  seasonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true
  },
  
  // Episode info (chỉ cho episode_release)
  episodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Episode',
    required: false,
    default: null
  },
  
  // Comment info (chỉ cho comment_reply)
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    required: false,
    default: null
  },
  
  // Người trigger notification (cho comment_reply)
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  
  // Message text
  message: {
    type: String,
    required: true,
    maxlength: 500
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

// Compound indexes để query hiệu quả
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 }); // Get unread notifications
notificationSchema.index({ userId: 1, createdAt: -1 }); // Get all user notifications

// Method để mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  return await this.save();
};

// Static method để mark multiple as read
notificationSchema.statics.markMultipleAsRead = async function(notificationIds, userId) {
  return await this.updateMany(
    { _id: { $in: notificationIds }, userId },
    { $set: { isRead: true } }
  );
};

// Static method để delete old notifications (> 30 days)
notificationSchema.statics.deleteOldNotifications = async function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return await this.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
