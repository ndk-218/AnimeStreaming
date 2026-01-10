import api from './api';

/**
 * Admin Notification Service
 * API calls for admin notifications
 */

const adminNotificationService = {
  /**
   * Get activity notifications (Tab "Thông báo")
   * @param {number} limit - Number of notifications to fetch
   */
  async getActivityNotifications(limit = 50) {
    try {
      const response = await api.get(`/admin/notifications/activity?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Get activity notifications error:', error);
      throw error;
    }
  },

  /**
   * Get upload notifications (Tab "Upload")
   * @param {number} limit - Number of notifications to fetch
   */
  async getUploadNotifications(limit = 50) {
    try {
      const response = await api.get(`/admin/notifications/upload?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Get upload notifications error:', error);
      throw error;
    }
  },

  /**
   * Get unread count
   */
  async getUnreadCount() {
    try {
      const response = await api.get('/admin/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  },

  /**
   * Mark single notification as read
   * @param {string} notificationId
   */
  async markAsRead(notificationId) {
    try {
      const response = await api.put(`/admin/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  },

  /**
   * Mark multiple notifications as read
   * @param {string[]} notificationIds
   */
  async markMultipleAsRead(notificationIds) {
    try {
      const response = await api.put('/admin/notifications/read-multiple', {
        notificationIds
      });
      return response.data;
    } catch (error) {
      console.error('Mark multiple as read error:', error);
      throw error;
    }
  },

  /**
   * Mark all as read
   * @param {string} type - 'activity' | 'upload' | null (all)
   */
  async markAllAsRead(type = null) {
    try {
      const url = type 
        ? `/admin/notifications/read-all?type=${type}`
        : '/admin/notifications/read-all';
      const response = await api.put(url);
      return response.data;
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  },

  /**
   * Delete notification
   * @param {string} notificationId
   */
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/admin/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  },

  /**
   * Cancel episode processing
   * @param {string} episodeId
   */
  async cancelProcessing(episodeId) {
    try {
      const response = await api.post(`/episodes/admin/${episodeId}/cancel-processing`);
      return response.data;
    } catch (error) {
      console.error('Cancel processing error:', error);
      throw error;
    }
  },

  /**
   * Cleanup old notifications (>30 days)
   */
  async cleanupOldNotifications() {
    try {
      const response = await api.post('/admin/notifications/cleanup');
      return response.data;
    } catch (error) {
      console.error('Cleanup notifications error:', error);
      throw error;
    }
  }
};

export default adminNotificationService;
