import api from './api';

/**
 * Notification Service
 * Quản lý API calls cho notifications
 */
class NotificationService {
  /**
   * Lấy danh sách notifications
   */
  async getNotifications(page = 1, limit = 20) {
    try {
      const response = await api.get('/notifications', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  }

  /**
   * Lấy số lượng unread notifications
   */
  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await api.patch('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  }

  /**
   * Delete all read notifications
   */
  async deleteAllRead() {
    try {
      const response = await api.delete('/notifications/read');
      return response.data;
    } catch (error) {
      console.error('Delete all read error:', error);
      throw error;
    }
  }
}

export default new NotificationService();
