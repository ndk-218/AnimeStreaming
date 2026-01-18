const Notification = require('../models/Notification');
const User = require('../models/User'); // Use User instead of Favorite
const Comment = require('../models/Comment');
const Episode = require('../models/Episode');
const Season = require('../models/Season');
const Series = require('../models/Series');

class NotificationService {
  /**
   * Tạo thông báo khi episode mới được upload
   * Gửi cho tất cả users đã favorite series này
   */
  async createEpisodeReleaseNotifications(episodeId) {
    try {
      // Get episode info với season details
      const episode = await Episode.findById(episodeId)
        .populate({
          path: 'seasonId',
          select: 'seasonNumber seasonType posterImage'
        })
        .populate('seriesId', 'title');
      
      if (!episode) {
        throw new Error('Episode không tồn tại');
      }

      const series = episode.seriesId;
      const season = episode.seasonId;

      // Get all users who favorited this series (from User.favorites array)
      const users = await User.find({ 
        favorites: series._id
      });

      if (users.length === 0) {
        console.log('📢 No users to notify for episode release');
        return { success: true, count: 0 };
      }

      // Create notification message với season info
      const seasonType = season.seasonType === 'tv' ? 'Phần' : 
                        season.seasonType === 'movie' ? 'Movie' : 'OVA';
      const message = `${series.title} ${seasonType} ${season.seasonNumber} vừa cập nhật Tập ${episode.episodeNumber} (Phụ đề)`;

      // Create notifications for all users who favorited this series
      const notifications = users.map(user => ({
        userId: user._id,
        type: 'episode_release',
        seriesId: series._id,
        seasonId: season._id,
        episodeId: episode._id,
        message,
        isRead: false
      }));

      const result = await Notification.insertMany(notifications);

      console.log(`📢 Created ${result.length} episode release notifications`);
      
      return {
        success: true,
        count: result.length,
        notifications: result
      };
    } catch (error) {
      console.error('Error creating episode release notifications:', error);
      throw error;
    }
  }

  /**
   * Tạo thông báo khi comment được reply
   * Gửi cho người được mention trong reply
   */
  async createCommentReplyNotification(replyId) {
    try {
      // Get reply info
      const reply = await Comment.findById(replyId)
        .populate('userId', 'username displayName')
        .populate('parentCommentId', 'userId depth parentCommentId')
        .populate('seriesId', 'title')
        .populate('seasonId');

      if (!reply || !reply.parentCommentId) {
        // Không phải reply hoặc không có parent comment
        return { success: false, message: 'Not a reply' };
      }

      // Check if has mentioned user
      if (!reply.mentionedUser) {
        console.log('⚠️ No mentioned user in reply');
        return { success: false, message: 'No mentioned user' };
      }

      const parentComment = reply.parentCommentId;
      const actorUser = reply.userId;
      const series = reply.seriesId;
      const season = reply.seasonId;

      // Find user được mention (by displayName hoặc username)
      const mentionedUser = await User.findOne({
        $or: [
          { displayName: reply.mentionedUser },
          { username: reply.mentionedUser }
        ]
      });

      if (!mentionedUser) {
        console.log(`⚠️ Mentioned user not found: ${reply.mentionedUser}`);
        return { success: false, message: 'Mentioned user not found' };
      }

      // Không gửi notification cho chính mình
      if (mentionedUser._id.toString() === actorUser._id.toString()) {
        return { success: false, message: 'Self mention' };
      }

      // Get root comment (depth = 1) để có đúng commentId khi navigate
      let rootComment = parentComment;
      if (parentComment.depth > 1) {
        // Tìm comment gốc
        let currentComment = parentComment;
        while (currentComment.parentCommentId) {
          currentComment = await Comment.findById(currentComment.parentCommentId);
          if (currentComment.depth === 1) {
            rootComment = currentComment;
            break;
          }
        }
      }

      // Create notification message
      const actorName = actorUser.displayName || actorUser.username;
      const message = `${actorName} đã phản hồi bạn tại ${series.title}`;

      // Create notification for mentioned user
      const notification = new Notification({
        userId: mentionedUser._id, // Send to mentioned user, not parent owner
        type: 'comment_reply',
        seriesId: series._id,
        seasonId: season._id,
        commentId: rootComment._id, // Lưu root comment để scroll đến đúng vị trí
        actorId: actorUser._id,
        message,
        isRead: false
      });

      await notification.save();

      console.log(`📢 Created comment reply notification for mentioned user ${mentionedUser.username}`);

      return {
        success: true,
        notification
      };
    } catch (error) {
      console.error('Error creating comment reply notification:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả notifications của user
   */
  async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const notifications = await Notification.find({ userId })
        .populate('seriesId', 'title slug')
        .populate('seasonId', 'seasonNumber seasonType posterImage')
        .populate('episodeId', 'episodeNumber title')
        .populate('commentId', '_id') // Populate commentId for navigation
        .populate('actorId', 'username displayName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments({ userId });
      const unreadCount = await Notification.countDocuments({ userId, isRead: false });

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        unreadCount
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Lấy số lượng unread notifications
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({ 
        userId, 
        isRead: false 
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        userId
      });

      if (!notification) {
        throw new Error('Notification không tồn tại');
      }

      await notification.markAsRead();

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { $set: { isRead: true } }
      );

      return {
        success: true,
        modifiedCount: result.modifiedCount
      };
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        userId
      });

      if (!notification) {
        throw new Error('Notification không tồn tại');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all read notifications
   */
  async deleteAllRead(userId) {
    try {
      const result = await Notification.deleteMany({
        userId,
        isRead: true
      });

      return {
        success: true,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
