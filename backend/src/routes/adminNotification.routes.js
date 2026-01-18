// @ts-nocheck
const express = require('express');
const router = express.Router();
const adminNotificationController = require('../controllers/adminNotification.controller');
const { adminAuth, catchAsync } = require('../middleware');

/**
 * ===== ADMIN NOTIFICATION ROUTES =====
 * Tất cả routes yêu cầu admin authentication
 */

// Get activity notifications (tab "Thông báo")
// GET /api/admin/notifications/activity?limit=50
router.get('/activity',
  adminAuth,
  catchAsync(adminNotificationController.getActivityNotifications)
);

// Get upload notifications (tab "Upload")
// GET /api/admin/notifications/upload?limit=50
router.get('/upload',
  adminAuth,
  catchAsync(adminNotificationController.getUploadNotifications)
);

// Get unread count
// GET /api/admin/notifications/unread-count
router.get('/unread-count',
  adminAuth,
  catchAsync(adminNotificationController.getUnreadCount)
);

// Mark all as read
// PUT /api/admin/notifications/read-all?type=activity
router.put('/read-all',
  adminAuth,
  catchAsync(adminNotificationController.markAllAsRead)
);

// Mark multiple as read
// PUT /api/admin/notifications/read-multiple
// Body: { notificationIds: [...] }
router.put('/read-multiple',
  adminAuth,
  catchAsync(adminNotificationController.markMultipleAsRead)
);

// Cleanup old notifications
// POST /api/admin/notifications/cleanup
router.post('/cleanup',
  adminAuth,
  catchAsync(adminNotificationController.cleanupOldNotifications)
);

// Mark single as read
// PUT /api/admin/notifications/:id/read
router.put('/:id/read',
  adminAuth,
  catchAsync(adminNotificationController.markAsRead)
);

// Delete notification
// DELETE /api/admin/notifications/:id
router.delete('/:id',
  adminAuth,
  catchAsync(adminNotificationController.deleteNotification)
);

module.exports = router;
