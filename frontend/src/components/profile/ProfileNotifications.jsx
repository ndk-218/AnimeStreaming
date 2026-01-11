import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import notificationService from '../../services/notification.service';

/**
 * Profile Notifications Tab
 * Hiển thị danh sách thông báo với pagination (10 items/page)
 */
const ProfileNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('phim'); // 'phim' | 'cong_dong'

  useEffect(() => {
    loadNotifications(page);
  }, [page]);

  const loadNotifications = async (pageNum) => {
    try {
      setLoading(true);
      const result = await notificationService.getNotifications(pageNum, 10);
      
      setNotifications(result.data);
      setPagination(result.pagination);
      setUnreadCount(result.unreadCount);
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
        setUnreadCount(unreadCount - 1);
      }

      // Navigate to series
      const seriesSlug = notification.seriesId?.slug;
      const seasonNumber = notification.seasonId?.seasonNumber;
      const commentId = notification.commentId?._id || notification.commentId;
      
      if (seriesSlug && seasonNumber) {
        if (commentId) {
          // Comment reply: navigate with commentId query param
          navigate(`/series/${seriesSlug}?season=${seasonNumber}&commentId=${commentId}`);
        } else {
          // Episode release
          navigate(`/series/${seriesSlug}?season=${seasonNumber}`);
        }
      }
    } catch (error) {
      console.error('Failed to handle notification:', error);
    }
  };

  const handleMarkAsRead = async (e, notificationId) => {
    e.stopPropagation();
    
    try {
      await notificationService.markAsRead(notificationId);
      
      console.log('Marked as read:', notificationId);
      
      // Reload to ensure sync
      await loadNotifications(page);
    } catch (error) {
      console.error('Failed to mark as read:', error);
      alert('Không thể đánh dấu đã đọc. Vui lòng thử lại.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead();
      
      console.log('Mark all as read result:', result);
      
      // Reload notifications from server to ensure sync
      await loadNotifications(page);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      alert('Không thể đánh dấu tất cả. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    
    try {
      await notificationService.deleteNotification(notificationId);
      
      const notification = notifications.find(n => n._id === notificationId);
      setNotifications(notifications.filter(n => n._id !== notificationId));
      
      if (notification && !notification.isRead) {
        setUnreadCount(unreadCount - 1);
      }
      
      // Reload if page becomes empty
      if (notifications.length === 1 && page > 1) {
        setPage(page - 1);
      } else if (notifications.length === 1) {
        loadNotifications(1);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const parseNotificationMessage = (notification) => {
    const seriesTitle = notification.seriesId?.title || '';
    const episodeNumber = notification.episodeId?.episodeNumber || '';
    
    return {
      seriesTitle,
      episodeNumber
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

  const getNotificationIcon = (type) => {
    if (type === 'episode_release') return '🎬';
    if (type === 'comment_reply') return '💬';
    return '🔔';
  };

  const formatTime = (date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: vi
    });
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#34D0F4]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="text-[#34D0F4]" size={24} />
            Thông báo
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>

          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-[#34D0F4] hover:bg-[#FA7299] text-white rounded-lg transition-colors"
              title="Đánh dấu tất cả đã đọc"
            >
              <CheckCheck size={18} />
              <span className="text-sm font-medium">Đánh dấu tất cả đã đọc</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 -mb-px">
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
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có thông báo nào
            </h3>
            <p className="text-gray-500">
              Các thông báo sẽ xuất hiện ở đây
            </p>
          </div>
        ) : (
          (() => {
            // Filter notifications by active tab
            const filteredNotifications = notifications.filter(n => {
              if (activeTab === 'phim') {
                return n.type === 'episode_release';
              } else {
                return n.type === 'comment_reply';
              }
            });

            if (filteredNotifications.length === 0) {
              return (
                <div className="p-12 text-center">
                  <Bell size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Chưa có thông báo nào
                  </h3>
                  <p className="text-gray-500">
                    {activeTab === 'phim' 
                      ? 'Chưa có thông báo về phim mới'
                      : 'Chưa có thông báo về bình luận'
                    }
                  </p>
                </div>
              );
            }

            return filteredNotifications.map((notification) => {
              // Parse notification data based on type
              const isCommentReply = notification.type === 'comment_reply';
              
              let mainMessage = '';
              let infoLine = '';
              
              if (isCommentReply) {
                // Comment reply notification
                const actorName = notification.actorId?.displayName || notification.actorId?.username || 'Ai đó';
                const seriesTitle = notification.seriesId?.title || '';
                
                mainMessage = (
                  <>
                    <span className="text-[#FA7299] font-semibold">{actorName}</span>
                    <span className="text-gray-600"> đã phản hồi bạn tại </span>
                    <span className="text-[#FA7299] font-semibold">{seriesTitle}</span>
                  </>
                );
                
                // Season info only (no episode)
                const season = notification.seasonId;
                let seasonName = '';
                if (season) {
                  if (season.seasonType === 'tv') {
                    seasonName = `Phần ${season.seasonNumber}`;
                  } else if (season.seasonType === 'movie') {
                    seasonName = `Movie ${season.seasonNumber}`;
                  } else {
                    seasonName = 'OVA';
                  }
                }
                
                infoLine = (
                  <span className="px-2.5 py-1 bg-[#34D0F4]/10 text-[#34D0F4] text-sm font-medium rounded">
                    {seasonName}
                  </span>
                );
              } else {
                // Episode release notification
                const { seriesTitle, episodeNumber } = parseNotificationMessage(notification);
                const seasonDisplayName = getSeasonDisplayName(notification);
                const episodeTitle = getEpisodeTitle(notification);
                
                mainMessage = (
                  <>
                    <span className="text-[#FA7299] font-semibold">{seriesTitle}</span>
                    <span className="text-gray-600"> vừa cập nhật </span>
                    <span className="text-[#FA7299] font-semibold">Tập {episodeNumber}</span>
                  </>
                );
                
                infoLine = (
                  <>
                    <span className="px-2.5 py-1 bg-[#34D0F4]/10 text-[#34D0F4] text-sm font-medium rounded">
                      {seasonDisplayName}
                    </span>
                    <span className="text-gray-400 text-sm">•</span>
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                      {episodeTitle}
                    </span>
                  </>
                );
              }
              
              return (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    relative p-6 cursor-pointer transition-colors
                    ${
                      notification.isRead
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-gradient-to-r from-[#34D0F4]/5 to-[#FA7299]/5 hover:bg-gray-50'
                    }
                  `}
                >
                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#FA7299] rounded-full"></div>
                  )}

                  <div className="flex gap-4 ml-4">
                    {/* Poster */}
                    {notification.seasonId?.posterImage ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}/${notification.seasonId.posterImage}`}
                        alt={notification.seriesId?.title || 'Anime'}
                        className="w-16 h-20 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/64x80?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-20 bg-gradient-to-br from-[#34D0F4] to-[#FA7299] rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Main message - 2 lines with highlights (ALWAYS highlighted) */}
                      <div className="text-base leading-relaxed mb-2" style={{ minHeight: '3rem' }}>
                        {mainMessage}
                      </div>

                      {/* Season + Episode info with boxes */}
                      <div className="flex items-center gap-2 mb-2">
                        {infoLine}
                      </div>

                      {/* Time */}
                      <p className="text-sm text-gray-400">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-start gap-2 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, notification._id)}
                          className="p-2 text-[#34D0F4] hover:text-[#FA7299] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Đánh dấu đã đọc"
                        >
                          <Check size={20} />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDelete(e, notification._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Xóa thông báo"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Trang {pagination.page} / {pagination.totalPages} ({pagination.total} thông báo)
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                ← Trước
              </button>

              {/* Page numbers */}
              <div className="flex gap-1">
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      page === i + 1
                        ? 'bg-[#34D0F4] text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                Sau →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileNotifications;
