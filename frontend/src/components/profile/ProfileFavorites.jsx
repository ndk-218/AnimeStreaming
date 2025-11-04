import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import favoritesService from '../../services/favoritesService';

const BACKEND_URL = 'http://localhost:5000';

const ProfileFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const result = await favoritesService.getFavorites();
      setFavorites(result.data || []);
    } catch (err) {
      setError(err.error || 'Không thể tải danh sách yêu thích');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (seriesId, seriesTitle) => {
    if (!confirm(`Bạn có chắc muốn xóa "${seriesTitle}" khỏi danh sách yêu thích?`)) {
      return;
    }

    try {
      await favoritesService.removeFavorite(seriesId);
      setFavorites(favorites.filter(s => s._id !== seriesId));
    } catch (err) {
      alert(err.error || 'Không thể xóa khỏi yêu thích');
    }
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

  if (favorites.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <Heart size={64} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Chưa có anime yêu thích
        </h3>
        <p className="text-gray-600 mb-6">
          Thêm anime vào danh sách yêu thích để xem lại sau
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Khám phá anime
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Anime yêu thích ({favorites.length})
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {favorites.map((series) => (
          <div
            key={series._id}
            className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <Link to={`/series/${series.slug}`}>
              {series.latestSeason?.posterImage ? (
                <img
                  src={`${BACKEND_URL}/${series.latestSeason.posterImage}`}
                  alt={series.title}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x300?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}

              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                  {series.title}
                </h3>
                
                {series.latestSeason && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">
                      {getSeasonTypeLabel(series.latestSeason.seasonType)} {series.latestSeason.seasonNumber}
                    </span>
                  </div>
                )}
              </div>
            </Link>

            {/* Remove button */}
            <button
              onClick={() => handleRemoveFavorite(series._id, series.title)}
              className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              title="Xóa khỏi yêu thích"
            >
              <Trash2 size={16} />
            </button>

            {/* Favorite badge */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded flex items-center gap-1">
              <Heart size={12} fill="white" />
              Yêu thích
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileFavorites;
