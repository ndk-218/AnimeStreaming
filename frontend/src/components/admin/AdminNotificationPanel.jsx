import { useState, useEffect, useRef } from 'react';
import { X, Check, Trash2, AlertCircle, XCircle } from 'lucide-react';
import adminNotificationService from '../../services/adminNotification.service';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Admin Notification Panel
 * 2 tabs: "Thông báo" (Activity) và "Upload" (Processing)
 */
const AdminNotificationPanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('activity'); // 'activity' | 'upload'
  const [activityNotifications, setActivityNotifications] = useState([]);
  const [uploadNotifications, setUploadNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef(null);

  // Fetch notifications on mount and tab change
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'activity') {
        fetchActivityNotifications();
      } else {
        fetchUploadNotifications();
        
        // Poll upload tab every 5 seconds
        const interval = setInterval(fetchUploadNotifications, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, activeTab]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

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

  if (!isOpen) return null;

  const notifications = activeTab === 'activity' ? activityNotifications : uploadNotifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end pt-16 pr-4">
      <div
        ref={panelRef}
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">🔔</span> Thông báo
              {unreadCount > 0 && (
                <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                title="Đánh dấu tất cả đã đọc"
              >
                <Check className="w-3 h-3" />
                Đọc tất cả
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'activity'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-gray-800/50'
                : 'text-gray-400 hover:text-gray-300'
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
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-gray-800/50'
                : 'text-gray-400 hover:text-gray-300'
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

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Đang tải...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Không có thông báo</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {notifications.map((notification) => (
                <NotificationItem
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
    </div>
  );
};

/**
 * Single Notification Item Component
 */
const NotificationItem = ({ notification, type, onMarkAsRead, onDelete, onCancelProcessing }) => {
  const isProcessing = notification.processingStatus && 
    notification.processingStatus !== 'completed' && 
    notification.processingStatus !== 'failed';

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'upscaling': return 'text-purple-400';
      case 'converting': return 'text-blue-400';
      default: return 'text-yellow-400';
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
      className={`p-4 hover:bg-gray-800/50 transition-colors relative ${
        !notification.isRead ? 'bg-gray-800/30' : ''
      }`}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-pink-500 rounded-full" />
      )}

      <div className="flex gap-3 ml-4">
        {/* Image */}
        <div className="flex-shrink-0">
          {notification.image ? (
            <img
              src={`${import.meta.env.VITE_API_URL}/${notification.image}`}
              alt={notification.seriesName}
              className="w-16 h-20 object-cover rounded"
              onError={(e) => {
                e.target.src = '/placeholder-anime.jpg';
              }}
            />
          ) : (
            <div className="w-16 h-20 bg-gray-700 rounded flex items-center justify-center">
              <span className="text-gray-500 text-2xl">🗑️</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm text-gray-300 mb-1">
            <span className="font-semibold text-white">{notification.adminName}</span>
            {' '}
            {notification.action === 'deleted' ? 'đã xóa' : 'vừa cập nhật'}
            {' '}
            <span className="font-semibold text-cyan-400">{notification.seriesName}</span>
          </p>

          {/* Season & Episode boxes */}
          <div className="flex flex-wrap gap-2 mb-2">
            {notification.seasonTitle && (
              <span className="inline-block px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded border border-cyan-500/30">
                {notification.seasonTitle}
              </span>
            )}
            {notification.episodeTitle && (
              <span className="inline-block px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs rounded border border-pink-500/30">
                Tập {notification.episodeNumber}: {notification.episodeTitle}
              </span>
            )}
          </div>

          {/* Processing status (Upload tab only) */}
          {type === 'upload' && notification.processingStatus && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${getStatusColor(notification.processingStatus)}`}>
                  {getStatusText(notification.processingStatus)}
                </span>
                <span className="text-xs text-gray-400">
                  {notification.processingProgress}%
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    notification.processingStatus === 'completed' ? 'bg-green-500' :
                    notification.processingStatus === 'failed' ? 'bg-red-500' :
                    'bg-cyan-500'
                  }`}
                  style={{ width: `${notification.processingProgress}%` }}
                />
              </div>

              {notification.processingStage && (
                <p className="text-xs text-gray-400 mt-1">
                  {notification.processingStage}
                </p>
              )}
            </div>
          )}

          {/* Time */}
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: vi
            })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {!notification.isRead && (
            <button
              onClick={() => onMarkAsRead(notification._id)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
              title="Đánh dấu đã đọc"
            >
              <Check className="w-4 h-4" />
            </button>
          )}

          {/* Cancel button (only for processing uploads) */}
          {type === 'upload' && isProcessing && (
            <button
              onClick={() => onCancelProcessing(notification.episodeId, notification._id)}
              className="text-red-400 hover:text-red-300 transition-colors"
              title="Hủy xử lý"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onDelete(notification._id)}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="Xóa thông báo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationPanel;
