const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { userAuth } = require('../middleware/userAuth');
const { adminAuth } = require('../middleware/auth'); // Correct path

/**
 * Tất cả routes yêu cầu authentication
 */

// GET /api/notifications - Lấy danh sách notifications
router.get('/', userAuth, notificationController.getNotifications);

// GET /api/notifications/unread-count - Lấy số lượng unread
router.get('/unread-count', userAuth, notificationController.getUnreadCount);

// PATCH /api/notifications/read-all - Mark tất cả as read
router.patch('/read-all', userAuth, notificationController.markAllAsRead);

// DELETE /api/notifications/read - Xóa tất cả read notifications
router.delete('/read', userAuth, notificationController.deleteAllRead);

// PATCH /api/notifications/:notificationId/read - Mark 1 notification as read
router.patch('/:notificationId/read', userAuth, notificationController.markAsRead);

// DELETE /api/notifications/:notificationId - Xóa 1 notification
router.delete('/:notificationId', userAuth, notificationController.deleteNotification);

// POST /api/notifications/trigger/episode/:episodeId - ADMIN: Manual trigger
router.post('/trigger/episode/:episodeId', adminAuth, notificationController.triggerEpisodeNotification);

module.exports = router;
