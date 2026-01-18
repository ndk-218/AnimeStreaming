// @ts-nocheck
const AdminNotification = require('../models/AdminNotification');
const Series = require('../models/Series');
const Season = require('../models/Season');
const Episode = require('../models/Episode');

/**
 * ===== ADMIN NOTIFICATION SERVICE =====
 * Quản lý thông báo cho admin về các hoạt động trong hệ thống
 */

class AdminNotificationService {
  
  /**
   * Tạo activity notification (create/update/delete)
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async createActivityNotification(data) {
    const {
      adminId,
      adminName,
      action,        // 'updated' | 'deleted'
      entityType,    // 'series' | 'season' | 'episode'
      entityId,
      seriesName,
      seasonTitle = null,
      episodeTitle = null,
      episodeNumber = null
      // NOTE: No image field - will be populated dynamically
    } = data;

    try {
      const notification = await AdminNotification.create({
        adminId,
        adminName,
        type: 'activity',
        action,
        entityType,
        seriesId: entityType === 'series' ? entityId : null,
        seasonId: entityType === 'season' ? entityId : null,
        episodeId: entityType === 'episode' ? entityId : null,
        seriesName,
        seasonTitle,
        episodeTitle,
        episodeNumber,
        isRead: false
        // NOTE: No image field - populated from entity
      });

      console.log(`📢 Admin notification created: ${adminName} ${action} ${entityType} "${seriesName}"`);
      return notification;

    } catch (error) {
      console.error('❌ Error creating activity notification:', error);
      throw error;
    }
  }

  /**
   * Tạo upload notification khi bắt đầu upload episode
   * @param {Object} data - Upload notification data
   * @returns {Promise<Object>} Created notification
   */
  async createUploadNotification(data) {
    const {
      adminId,
      adminName,
      episodeId,
      seriesName,
      seasonTitle,
      episodeTitle,
      episodeNumber
      // NOTE: No image field - will be populated dynamically
    } = data;

    try {
      const notification = await AdminNotification.create({
        adminId,
        adminName,
        type: 'upload',
        action: 'updated',
        entityType: 'episode',
        episodeId,
        seriesName,
        seasonTitle,
        episodeTitle,
        episodeNumber,
        processingStatus: 'uploading',
        processingProgress: 0,
        processingStage: 'Uploading video...',
        isRead: false
        // NOTE: No image field - populated from episode.seasonId
      });

      console.log(`📤 Upload notification created for episode: ${episodeTitle}`);
      return notification;

    } catch (error) {
      console.error('❌ Error creating upload notification:', error);
      throw error;
    }
  }

  /**
   * Update processing status cho upload notification
   * @param {string} episodeId - Episode ID
   * @param {string} status - Processing status
   * @param {number} progress - Progress percentage
   * @param {string} stage - Current stage
   */
  async updateUploadProgress(episodeId, status, progress, stage) {
    try {
      const notification = await AdminNotification.findUploadNotification(episodeId);
      
      if (!notification) {
        console.warn(`⚠️ Upload notification not found for episode: ${episodeId}`);
        return null;
      }

      await notification.updateProcessing(status, progress, stage);
      console.log(`📊 Upload progress updated: ${status} ${progress}%`);

      // Nếu completed → tạo activity notification
      if (status === 'completed') {
        await this.createActivityNotification({
          adminId: notification.adminId,
          adminName: notification.adminName,
          action: 'updated',
          entityType: 'episode',
          entityId: episodeId,
          seriesName: notification.seriesName,
          seasonTitle: notification.seasonTitle,
          episodeTitle: notification.episodeTitle,
          episodeNumber: notification.episodeNumber
          // NOTE: No image - populated from episode.seasonId
        });
      }

      return notification;

    } catch (error) {
      console.error('❌ Error updating upload progress:', error);
      throw error;
    }
  }

  /**
   * Get activity notifications (tab "Thông báo")
   * @param {number} limit - Max notifications
   * @returns {Promise<Array>} Notifications
   */
  async getActivityNotifications(limit = 50) {
    try {
      return await AdminNotification.getActivityNotifications(limit);
    } catch (error) {
      console.error('❌ Error getting activity notifications:', error);
      throw error;
    }
  }

  /**
   * Get upload notifications (tab "Upload")
   * @param {number} limit - Max notifications
   * @returns {Promise<Array>} Notifications
   */
  async getUploadNotifications(limit = 50) {
    try {
      return await AdminNotification.getUploadNotifications(limit);
    } catch (error) {
      console.error('❌ Error getting upload notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread counts
   * @returns {Promise<Object>} { activity: number, upload: number, total: number }
   */
  async getUnreadCounts() {
    try {
      const [activityCount, uploadCount] = await Promise.all([
        AdminNotification.getUnreadCount('activity'),
        AdminNotification.getUnreadCount('upload')
      ]);

      return {
        activity: activityCount,
        upload: uploadCount,
        total: activityCount + uploadCount
      };
    } catch (error) {
      console.error('❌ Error getting unread counts:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  async markAsRead(notificationId) {
    try {
      const notification = await AdminNotification.findById(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }
      return await notification.markAsRead();
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark multiple notifications as read
   * @param {Array<string>} notificationIds - Array of notification IDs
   */
  async markMultipleAsRead(notificationIds) {
    try {
      return await AdminNotification.markMultipleAsRead(notificationIds);
    } catch (error) {
      console.error('❌ Error marking multiple as read:', error);
      throw error;
    }
  }

  /**
   * Mark all as read
   * @param {string} type - 'activity' | 'upload' | null (all)
   */
  async markAllAsRead(type = null) {
    try {
      return await AdminNotification.markAllAsRead(type);
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   */
  async deleteNotification(notificationId) {
    try {
      const notification = await AdminNotification.findByIdAndDelete(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }
      console.log(`🗑️ Notification deleted: ${notificationId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete old notifications (>30 days)
   */
  async cleanupOldNotifications() {
    try {
      return await AdminNotification.deleteOldNotifications();
    } catch (error) {
      console.error('❌ Error cleaning up old notifications:', error);
      throw error;
    }
  }

  /**
   * Helper: Lấy thông tin đầy đủ của entity để tạo notification
   * @param {string} entityType - 'series' | 'season' | 'episode'
   * @param {string} entityId - Entity ID
   * @returns {Promise<Object>} Entity info for notification
   */
  async getEntityInfoForNotification(entityType, entityId) {
    try {
      let series, season, episode;
      let result = {
        seriesName: '',
        seasonTitle: null,
        episodeTitle: null,
        episodeNumber: null,
        image: null
      };

      switch (entityType) {
        case 'series':
          series = await Series.findById(entityId);
          if (series) {
            result.seriesName = series.title;
            result.image = series.bannerImage || series.posterImage;
          }
          break;

        case 'season':
          season = await Season.findById(entityId).populate('seriesId');
          if (season) {
            result.seriesName = season.seriesId?.title || 'Unknown Series';
            result.seasonTitle = season.title;
            result.image = season.posterImage;
          }
          break;

        case 'episode':
          episode = await Episode.findById(entityId)
            .populate('seriesId')
            .populate('seasonId');
          if (episode) {
            result.seriesName = episode.seriesId?.title || 'Unknown Series';
            result.seasonTitle = episode.seasonId?.title || 'Unknown Season';
            result.episodeTitle = episode.title;
            result.episodeNumber = episode.episodeNumber;
            result.image = episode.seasonId?.posterImage || episode.thumbnail;
          }
          break;
      }

      return result;

    } catch (error) {
      console.error('❌ Error getting entity info:', error);
      return {
        seriesName: 'Unknown',
        seasonTitle: null,
        episodeTitle: null,
        episodeNumber: null,
        image: null
      };
    }
  }
}

module.exports = new AdminNotificationService();
