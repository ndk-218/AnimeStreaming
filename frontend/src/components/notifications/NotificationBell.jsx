import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import PropTypes from 'prop-types';
import NotificationPanel from './NotificationPanel';
import notificationService from '../../services/notification.service';

/**
 * Notification Bell với badge count
 * Hiển thị ở Header
 */
const NotificationBell = ({ isAuthenticated }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // Fetch unread count khi component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      
      // Poll mỗi 30 giây để cập nhật count
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Close panel khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowPanel(false);
      }
    };

    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPanel]);

  const fetchUnreadCount = async () => {
    try {
      const result = await notificationService.getUnreadCount();
      setUnreadCount(result.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleTogglePanel = () => {
    setShowPanel(!showPanel);
  };

  const handleCountUpdate = (newCount) => {
    setUnreadCount(newCount);
  };

  // Không hiển thị nếu chưa login
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={handleTogglePanel}
        className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        
        {/* Badge - Unread count */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div ref={panelRef}>
          <NotificationPanel
            onClose={() => setShowPanel(false)}
            onCountUpdate={handleCountUpdate}
          />
        </div>
      )}
    </div>
  );
};

NotificationBell.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired
};

export default NotificationBell;
