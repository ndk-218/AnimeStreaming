import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Trash2, AlertCircle, XCircle } from 'lucide-react';
import adminNotificationService from '../../services/adminNotification.service';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import AdminHeader from '../../components/admin/AdminHeader';

/**
 * Admin Notifications Page - Full page view
 * Route: /admin/notifications
 */
export default function AdminNotifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('activity'); // 'activity' | 'upload'
  const [activityNotifications, setActivityNotifications] = useState([]);
  const [uploadNotifications, setUploadNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications on mount and tab change
  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivityNotifications();
    } else {
      fetchUploadNotifications();
      
      // Poll upload tab every 5 seconds
      const interval = setInterval(fetchUploadNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const fetchActivityNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await adminNotificationService.getActivityNotifications(50);
      if (response.success) {
        setActivityNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch activity notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUploadNotifications = async () => {
    try {
      const response = await adminNotificationService.getUploadNotifications(50);
      if (response.success) {
        setUploadNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch upload notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await adminNotificationService.markAsRead(notificationId);
      
      // Update local state
      if (activeTab === 'activity') {
        setActivityNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
      } else {
        setUploadNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await adminNotificationService.markAllAsRead(activeTab);
      
      // Update local state
      if (activeTab === 'activity') {
        setActivityNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } else {
        setUploadNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    
    try {
      await adminNotificationService.deleteNotification(notificationId);
      
      // Update local state
      if (activeTab === 'activity') {
        setActivityNotifications(prev => prev.filter(n => n._id !== notificationId));
      } else {
        setUploadNotifications(prev => prev.filter(n => n._id !== notificationId));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      alert('Xóa thông báo thất bại');
    }
  };

  const handleCancelProcessing = async (episodeId, notificationId) => {
    if (!confirm('Hủy xử lý video sẽ xóa episode này. Bạn có chắc chắn?')) return;
    
    try {
      await adminNotificationService.cancelProcessing(episodeId);
      
      // Remove notification from list
      setUploadNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      alert('Đã hủy xử lý video thành công');
    } catch (error) {
      console.error('Failed to cancel processing:', error);
      alert('Hủy xử lý thất bại: ' + error.message);
    }
  };

  const notifications = activeTab === 'activity' ? activityNotifications : uploadNotifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <AdminHeader />
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🔔</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Thông báo
                  {unreadCount > 0 && (
                    <span className="bg-pink-500 text-white text-sm px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h1>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-cyan-500 hover:text-cyan-600 flex items-center gap-1 font-medium"
              >
                <Check className="w-4 h-4" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'activity'
                  ? 'text-cyan-500 border-b-2 border-cyan-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Thông báo
              {activityNotifications.filter(n => !n.isRead).length > 0 && (
                <span className="ml-2 bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {activityNotifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'upload'
                  ? 'text-cyan-500 border-b-2 border-cyan-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload
              {uploadNotifications.filter(n => !n.isRead).length > 0 && (
                <span className="ml-2 bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {uploadNotifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading && notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 text-lg">Không có thông báo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                type={activeTab}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDeleteNotification}
                onCancelProcessing={handleCancelProcessing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Notification Card Component
 */
function NotificationCard({ notification, type, onMarkAsRead, onDelete, onCancelProcessing }) {
  const isProcessing = notification.processingStatus && 
    notification.processingStatus !== 'completed' && 
    notification.processingStatus !== 'failed';

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'upscaling': return 'text-purple-500';
      case 'converting': return 'text-blue-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'uploading': return 'Đang tải lên';
      case 'upscaling': return 'Đang upscale';
      case 'converting': return 'Đang chuyển đổi';
      case 'completed': return 'Hoàn thành';
      case 'failed': return 'Thất bại';
      default: return status;
    }
  };

  return (
    <div
      className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative ${
        !notification.isRead ? 'border-l-4 border-cyan-500' : 'border-l-4 border-transparent'
      }`}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-4 left-0 w-1 h-16 bg-cyan-500 rounded-r"></div>
      )}

      <div className="flex gap-4 ml-2">
        {/* Image */}
        <div className="flex-shrink-0">
          {notification.image ? (
            <img
              src={`http://localhost:5000/${notification.image}`}
              alt={notification.seriesName}
              className="w-20 h-28 object-cover rounded-lg"
              onError={(e) => {
                e.target.src = '/placeholder-anime.jpg';
              }}
            />
          ) : (
            <div className="w-20 h-28 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-3xl">🗑️</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-semibold text-gray-900">Admin</span>
            {' '}
            {notification.action === 'deleted' ? 'đã xóa' : 'vừa cập nhật'}
            {' '}
            <span className="font-semibold text-cyan-500">{notification.seriesName}</span>
          </p>

          {/* Season & Episode boxes */}
          <div className="flex flex-wrap gap-2 mb-3">
            {notification.seasonTitle && (
              <span className="inline-block px-3 py-1 bg-cyan-50 text-cyan-600 text-xs font-medium rounded-full border border-cyan-200">
                {notification.seasonTitle}
              </span>
            )}
            {notification.episodeTitle && (
              <span className="inline-block px-3 py-1 bg-pink-50 text-pink-600 text-xs font-medium rounded-full border border-pink-200">
                Tập {notification.episodeNumber}: {notification.episodeTitle}
              </span>
            )}
          </div>

          {/* Processing status (Upload tab only) */}
          {type === 'upload' && notification.processingStatus && (
            <div className="mb-3 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold ${getStatusColor(notification.processingStatus)}`}>
                  {getStatusText(notification.processingStatus)}
                </span>
                <span className="text-sm text-gray-600 font-medium">
                  {notification.processingProgress}%
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-300 ${
                    notification.processingStatus === 'completed' ? 'bg-green-500' :
                    notification.processingStatus === 'failed' ? 'bg-red-500' :
                    'bg-gradient-to-r from-cyan-500 to-pink-500'
                  }`}
                  style={{ width: `${notification.processingProgress}%` }}
                />
              </div>

              {notification.processingStage && (
                <p className="text-xs text-gray-600">
                  {notification.processingStage}
                </p>
              )}
            </div>
          )}

          {/* Time and Actions */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: vi
              })}
            </p>

            <div className="flex items-center gap-2">
              {!notification.isRead && (
                <button
                  onClick={() => onMarkAsRead(notification._id)}
                  className="text-cyan-500 hover:text-cyan-600 transition-colors p-1"
                  title="Đánh dấu đã đọc"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}

              {/* Cancel button (only for processing uploads) */}
              {type === 'upload' && isProcessing && (
                <button
                  onClick={() => onCancelProcessing(notification.episodeId, notification._id)}
                  className="text-red-500 hover:text-red-600 transition-colors p-1"
                  title="Hủy xử lý"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onDelete(notification._id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Xóa thông báo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
