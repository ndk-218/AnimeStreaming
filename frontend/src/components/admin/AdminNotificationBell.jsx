import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import adminNotificationService from '../../services/adminNotification.service';

/**
 * Admin Notification Bell - Icon với badge count
 */
const AdminNotificationBell = ({ onOpenPanel }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const response = await adminNotificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={onOpenPanel}
      className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
      aria-label="Thông báo"
    >
      <Bell className="w-5 h-5" />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default AdminNotificationBell;
