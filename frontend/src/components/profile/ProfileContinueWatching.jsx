import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Play } from 'lucide-react';
import watchHistoryService from '../../services/watchHistoryService';

const BACKEND_URL = import.meta.env.VITE_API_URL;

/**
 * ProfileContinueWatching Component
 * Hiển thị danh sách anime đang xem dở với poster cards
 */
const ProfileContinueWatching = () => {
  const navigate = useNavigate();
  const [watchHistory, setWatchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWatchHistory();
  }, []);

  const loadWatchHistory = async () => {
    try {
      setIsLoading(true);
      const result = await watchHistoryService.getWatchHistory();
      setWatchHistory(result.data || []);
    } catch (err) {
      console.error('Load watch history error:', err);
      setError(err.response?.data?.error || 'Không thể tải danh sách xem tiếp');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (episodeId, watchedDuration) => {
    // Navigate to watch page với timestamp để resume
    navigate(`/watch/${episodeId}?t=${watchedDuration}`);
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const getSeasonTypeLabel = (type) => {
    const labels = {
      tv: 'Phần',
      movie: 'Movie',
      ova: 'OVA',
      special: 'Special'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  if (watchHistory.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <Clock size={64} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Chưa có lịch sử xem
        </h3>
        <p className="text-gray-600 mb-6">
          Bắt đầu xem anime để lưu lại tiến trình
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Khám phá anime
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Xem tiếp ({watchHistory.length})
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {watchHistory.map((item) => (
          <div
            key={item.episodeId}
            className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleCardClick(item.episodeId, item.watchedDuration)}
          >
            {/* Poster Image */}
            <div className="relative aspect-[2/3]">
              {item.season?.posterImage ? (
                <img
                  src={`${BACKEND_URL}/${item.season.posterImage}`}
                  alt={item.series?.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x300?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}

              {/* Play Overlay on Hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play size={48} className="text-white" fill="white" />
              </div>

              {/* Continue Watching Badge */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded flex items-center gap-1">
                <Clock size={12} />
                Xem tiếp
              </div>

              {/* Watched Duration Badge */}
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-semibold rounded">
                {formatDuration(item.watchedDuration)}
              </div>
            </div>

            {/* Info Bar */}
            <div className="p-3 bg-white">
              <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                {item.series?.title}
              </h3>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">
                  {getSeasonTypeLabel(item.season?.seasonType)} {item.season?.seasonNumber}
                </span>
                <span>•</span>
                <span>Tập {item.episodeNumber}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileContinueWatching;
