import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import PropTypes from 'prop-types';
import notificationService from '../../services/notification.service';

/**
 * Notification Panel Dropdown
 * RoPhim-style với tabs: Phim + Cộng đồng
 */
const NotificationPanel = ({ onClose, onCountUpdate }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('phim'); // 'phim' | 'cong_dong'
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  const loadNotifications = async (pageNum = 1) => {
    try {
      setLoading(true);
      const result = await notificationService.getNotifications(pageNum, 20);
      
      // Filter by tab
      const filtered = result.data.filter(n => {
        if (activeTab === 'phim') {
          return n.type === 'episode_release';
        } else {
          return n.type === 'comment_reply';
        }
      });
      
      if (pageNum === 1) {
        setNotifications(filtered);
      } else {
        setNotifications([...notifications, ...filtered]);
      }
      
      setPage(pageNum);
      setHasMore(result.pagination.page < result.pagination.totalPages);
      onCountUpdate(result.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await notificationService.markAsRead(notification._id);
        setNotifications(notifications.map(n => 
          n._id === notification._id ? { ...n, isRead: true } : n
        ));
        const unreadCount = notifications.filter(n => !n.isRead).length - 1;
        onCountUpdate(unreadCount);
      }

      // Navigate
      const seriesSlug = notification.seriesId?.slug;
      const seasonNumber = notification.seasonId?.seasonNumber;
      const commentId = notification.commentId?._id || notification.commentId;
      
      if (seriesSlug && seasonNumber) {
        if (commentId) {
          // Comment reply: navigate with commentId
          navigate(`/series/${seriesSlug}?season=${seasonNumber}&commentId=${commentId}`);
        } else {
          // Episode release
          navigate(`/series/${seriesSlug}?season=${seasonNumber}`);
        }
        onClose();
      }
    } catch (error) {
      console.error('Failed to handle notification click:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      onCountUpdate(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    
    try {
      await notificationService.deleteNotification(notificationId);
      const notification = notifications.find(n => n._id === notificationId);
      setNotifications(notifications.filter(n => n._id !== notificationId));
      
      if (notification && !notification.isRead) {
        const unreadCount = notifications.filter(n => !n.isRead).length - 1;
        onCountUpdate(unreadCount);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const parseEpisodeNotification = (notification) => {
    return {
      seriesTitle: notification.seriesId?.title || '',
      episodeNumber: notification.episodeId?.episodeNumber || ''
    };
  };

  const parseCommentNotification = (notification) => {
    return {
      actorName: notification.actorId?.displayName || notification.actorId?.username || 'Ai đó',
      seriesTitle: notification.seriesId?.title || ''
    };
  };

  const getSeasonDisplayName = (notification) => {
    const season = notification.seasonId;
    if (!season) return '';
    
    if (season.seasonType === 'tv') {
      return `Phần ${season.seasonNumber}`;
    } else if (season.seasonType === 'movie') {
      return `Movie ${season.seasonNumber}`;
    } else {
      return 'OVA';
    }
  };

  const getEpisodeTitle = (notification) => {
    const episodeNumber = notification.episodeId?.episodeNumber || '';
    const episodeTitle = notification.episodeId?.title || '';
    return episodeTitle ? `Tập ${episodeNumber}: ${episodeTitle}` : `Tập ${episodeNumber}`;
  };

  const formatTime = (date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: vi
    });
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border-2 border-[#34D0F4] z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-[#34D0F4]" />
          <span className="font-semibold text-gray-900">Thông báo</span>
        </div>
        
        <div className="flex items-center gap-2">
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-[#34D0F4] hover:text-[#FA7299] transition-colors"
              title="Đánh dấu tất cả đã đọc"
            >
              <Check size={16} />
            </button>
          )}
          
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('phim')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'phim'
              ? 'text-[#34D0F4] border-b-2 border-[#34D0F4]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Phim
        </button>
        <button
          onClick={() => setActiveTab('cong_dong')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'cong_dong'
              ? 'text-[#34D0F4] border-b-2 border-[#34D0F4]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Cộng đồng
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-[500px] overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#34D0F4] mx-auto mb-2"></div>
            <p className="text-sm">Đang tải...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Bell size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">Chưa có thông báo nào</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => {
              const isEpisode = notification.type === 'episode_release';
              const seasonName = getSeasonDisplayName(notification);
              
              if (isEpisode) {
                const { seriesTitle, episodeNumber } = parseEpisodeNotification(notification);
                const episodeTitle = getEpisodeTitle(notification);
                
                return (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`relative p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                      notification.isRead ? 'bg-white hover:bg-gray-50' : 'bg-gradient-to-r from-[#34D0F4]/10 to-[#FA7299]/10 hover:bg-gray-50'
                    }`}
                  >
                    {!notification.isRead && (
                      <div className="absolute left-2 top-4 w-2 h-2 bg-[#FA7299] rounded-full"></div>
                    )}

                    <div className="flex gap-3 ml-2">
                      {notification.seasonId?.posterImage ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL}/${notification.seasonId.posterImage}`}
                          alt={seriesTitle}
                          className="w-12 h-16 object-cover rounded flex-shrink-0"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/48x64?text=No+Image'; }}
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gradient-to-br from-[#34D0F4] to-[#FA7299] rounded flex items-center justify-center text-2xl flex-shrink-0">
                          🎬
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="text-sm leading-relaxed mb-1" style={{ minHeight: '2.5rem' }}>
                          <span className="text-[#FA7299] font-semibold">{seriesTitle}</span>
                          <span className="text-gray-600"> vừa cập nhật </span>
                          <span className="text-[#FA7299] font-semibold">Tập {episodeNumber}</span>
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-[#34D0F4]/10 text-[#34D0F4] text-xs font-medium rounded">
                            {seasonName}
                          </span>
                          <span className="text-gray-400 text-xs">•</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {episodeTitle}
                          </span>
                        </div>

                        <p className="text-xs text-gray-400">{formatTime(notification.createdAt)}</p>
                      </div>

                      <button
                        onClick={(e) => handleDeleteNotification(e, notification._id)}
                        className="flex-shrink-0 text-gray-400 hover:text-[#FA7299] transition-colors self-start"
                        title="Xóa thông báo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              } else {
                // Comment reply notification
                const { actorName, seriesTitle } = parseCommentNotification(notification);
                
                return (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`relative p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                      notification.isRead ? 'bg-white hover:bg-gray-50' : 'bg-gradient-to-r from-[#34D0F4]/10 to-[#FA7299]/10 hover:bg-gray-50'
                    }`}
                  >
                    {!notification.isRead && (
                      <div className="absolute left-2 top-4 w-2 h-2 bg-[#FA7299] rounded-full"></div>
                    )}

                    <div className="flex gap-3 ml-2">
                      {notification.seasonId?.posterImage ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL}/${notification.seasonId.posterImage}`}
                          alt={seriesTitle}
                          className="w-12 h-16 object-cover rounded flex-shrink-0"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/48x64?text=No+Image'; }}
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gradient-to-br from-[#34D0F4] to-[#FA7299] rounded flex items-center justify-center text-2xl flex-shrink-0">
                          💬
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="text-sm leading-relaxed mb-1" style={{ minHeight: '2.5rem' }}>
                          <span className="text-[#FA7299] font-semibold">{actorName}</span>
                          <span className="text-gray-600"> đã phản hồi bạn tại </span>
                          <span className="text-[#FA7299] font-semibold">{seriesTitle}</span>
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-[#34D0F4]/10 text-[#34D0F4] text-xs font-medium rounded">
                            {seasonName}
                          </span>
                        </div>

                        <p className="text-xs text-gray-400">{formatTime(notification.createdAt)}</p>
                      </div>

                      <button
                        onClick={(e) => handleDeleteNotification(e, notification._id)}
                        className="flex-shrink-0 text-gray-400 hover:text-[#FA7299] transition-colors self-start"
                        title="Xóa thông báo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              }
            })}

            {hasMore && (
              <button
                onClick={() => loadNotifications(page + 1)}
                disabled={loading}
                className="w-full p-3 text-sm text-[#34D0F4] hover:text-[#FA7299] hover:bg-gray-50 transition-colors"
              >
                {loading ? 'Đang tải...' : 'Xem thêm'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 text-center">
          <button
            onClick={() => {
              navigate('/profile?tab=notifications');
              onClose();
            }}
            className="text-sm text-[#34D0F4] hover:text-[#FA7299] transition-colors font-medium"
          >
            Xem tất cả thông báo
          </button>
        </div>
      )}
    </div>
  );
};

NotificationPanel.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCountUpdate: PropTypes.func.isRequired
};

export default NotificationPanel;
