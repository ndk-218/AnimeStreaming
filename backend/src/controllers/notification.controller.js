const notificationService = require('../services/notification.service');

class NotificationController {
  /**
   * GET /api/notifications
   * Lấy danh sách notifications của user
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await notificationService.getUserNotifications(userId, page, limit);

      res.json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Lấy số lượng unread notifications
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user._id;
      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        count
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PATCH /api/notifications/:notificationId/read
   * Mark notification as read
   */
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user._id;

      const notification = await notificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user._id;
      const result = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/notifications/:notificationId
   * Delete notification
   */
  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user._id;

      await notificationService.deleteNotification(notificationId, userId);

      res.json({
        success: true,
        message: 'Đã xóa thông báo'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/notifications/read
   * Delete all read notifications
   */
  async deleteAllRead(req, res) {
    try {
      const userId = req.user._id;
      const result = await notificationService.deleteAllRead(userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Delete all read error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/notifications/trigger/episode/:episodeId
   * ADMIN ONLY: Manually trigger episode release notification
   * Dùng cho episodes đã completed nhưng chưa có notification
   */
  async triggerEpisodeNotification(req, res) {
    try {
      const { episodeId } = req.params;
      
      const result = await notificationService.createEpisodeReleaseNotifications(episodeId);

      res.json({
        success: true,
        message: `Đã gửi ${result.count} thông báo`,
        data: result
      });
    } catch (error) {
      console.error('Trigger episode notification error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new NotificationController();
