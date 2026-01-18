// @ts-nocheck
const adminNotificationService = require('../services/adminNotification.service');

/**
 * ===== ADMIN NOTIFICATION CONTROLLER =====
 * Xử lý HTTP requests cho admin notifications
 */

class AdminNotificationController {
  
  /**
   * GET /api/admin/notifications/activity
   * Lấy danh sách activity notifications (tab "Thông báo")
   */
  async getActivityNotifications(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      
      const notifications = await adminNotificationService.getActivityNotifications(limit);
      
      return res.status(200).json({
        success: true,
        data: notifications
      });
      
    } catch (error) {
      console.error('❌ Get activity notifications error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get activity notifications'
      });
    }
  }

  /**
   * GET /api/admin/notifications/upload
   * Lấy danh sách upload notifications (tab "Upload")
   */
  async getUploadNotifications(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      
      const notifications = await adminNotificationService.getUploadNotifications(limit);
      
      return res.status(200).json({
        success: true,
        data: notifications
      });
      
    } catch (error) {
      console.error('❌ Get upload notifications error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get upload notifications'
      });
    }
  }

  /**
   * GET /api/admin/notifications/unread-count
   * Lấy số lượng notifications chưa đọc
   */
  async getUnreadCount(req, res) {
    try {
      const counts = await adminNotificationService.getUnreadCounts();
      
      return res.status(200).json({
        success: true,
        data: counts
      });
      
    } catch (error) {
      console.error('❌ Get unread count error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get unread count'
      });
    }
  }

  /**
   * PUT /api/admin/notifications/:id/read
   * Đánh dấu notification đã đọc
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      
      const notification = await adminNotificationService.markAsRead(id);
      
      return res.status(200).json({
        success: true,
        data: notification
      });
      
    } catch (error) {
      console.error('❌ Mark as read error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to mark notification as read'
      });
    }
  }

  /**
   * PUT /api/admin/notifications/read-multiple
   * Đánh dấu nhiều notifications đã đọc
   */
  async markMultipleAsRead(req, res) {
    try {
      const { notificationIds } = req.body;
      
      if (!Array.isArray(notificationIds)) {
        return res.status(400).json({
          success: false,
          error: 'notificationIds must be an array'
        });
      }
      
      const result = await adminNotificationService.markMultipleAsRead(notificationIds);
      
      return res.status(200).json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount
        }
      });
      
    } catch (error) {
      console.error('❌ Mark multiple as read error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to mark notifications as read'
      });
    }
  }

  /**
   * PUT /api/admin/notifications/read-all
   * Đánh dấu tất cả đã đọc
   */
  async markAllAsRead(req, res) {
    try {
      const { type } = req.query; // 'activity' | 'upload' | null
      
      const result = await adminNotificationService.markAllAsRead(type);
      
      return res.status(200).json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount
        }
      });
      
    } catch (error) {
      console.error('❌ Mark all as read error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to mark all as read'
      });
    }
  }

  /**
   * DELETE /api/admin/notifications/:id
   * Xóa notification
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      
      await adminNotificationService.deleteNotification(id);
      
      return res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
      
    } catch (error) {
      console.error('❌ Delete notification error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete notification'
      });
    }
  }

  /**
   * POST /api/admin/notifications/cleanup
   * Xóa notifications cũ (>30 days)
   */
  async cleanupOldNotifications(req, res) {
    try {
      const result = await adminNotificationService.cleanupOldNotifications();
      
      return res.status(200).json({
        success: true,
        data: {
          deletedCount: result.deletedCount
        }
      });
      
    } catch (error) {
      console.error('❌ Cleanup notifications error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to cleanup old notifications'
      });
    }
  }
}

module.exports = new AdminNotificationController();
