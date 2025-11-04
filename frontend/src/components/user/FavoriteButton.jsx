import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import favoritesService from '../../services/favoritesService';

/**
 * FavoriteButton Component
 * Nút yêu thích với animation khi click
 * 
 * Props:
 * - seriesId: ID của series
 * - initialIsFavorite: Trạng thái ban đầu (optional)
 */
const FavoriteButton = ({ seriesId, initialIsFavorite = false }) => {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Get authentication state from authStore
  const { isAuthenticated } = useAuthStore();

  // Check authentication on mount
  useEffect(() => {
    setCheckingAuth(false);
  }, []);

  // Load favorite status ONLY when user is authenticated
  useEffect(() => {
    if (!checkingAuth && isAuthenticated && seriesId) {
      loadFavoriteStatus();
    }
  }, [checkingAuth, isAuthenticated, seriesId]);

  const loadFavoriteStatus = async () => {
    try {
      const response = await favoritesService.checkFavorite(seriesId);
      setIsFavorite(response.data.isFavorite);
      console.log(`✅ Favorite status for ${seriesId}:`, response.data.isFavorite);
    } catch (error) {
      // Silently fail if unauthorized
      if (error.response?.status === 401) {
        console.log('User not authenticated - skipping favorite check');
        return;
      }
      console.error('Failed to load favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!seriesId) {
      console.warn('Cannot toggle favorite: seriesId is missing');
      return;
    }

    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }

    setLoading(true);

    try {
      if (isFavorite) {
        // Remove from favorites
        await favoritesService.removeFavorite(seriesId);
        setIsFavorite(false);
        console.log('✅ Removed from favorites');
      } else {
        // Add to favorites
        await favoritesService.addFavorite(seriesId);
        setIsFavorite(true);
        console.log('✅ Added to favorites');
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      
      // Handle specific error: already in favorites
      if (error.response?.status === 409) {
        setIsFavorite(true);
        alert('Anime này đã có trong danh sách yêu thích!');
      } else if (error.response?.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
      } else {
        alert(error.response?.data?.error || 'Có lỗi xảy ra. Vui lòng thử lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  // Don't render if seriesId is missing OR still checking auth
  if (!seriesId || checkingAuth) {
    return (
      <button
        disabled
        className="px-6 py-3 bg-gray-200 text-gray-400 rounded-lg font-medium cursor-not-allowed"
      >
        <span className="text-sm">Đang tải...</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={loading}
      className={`
        group relative flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium
        transition-all duration-300 transform hover:scale-105
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isFavorite 
          ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white hover:shadow-lg' 
          : 'bg-gradient-to-r from-[#34D0F4] to-[#4DD9FF] text-white hover:shadow-lg'
        }
      `}
    >
      {/* Heart Icon với animation */}
      <Heart 
        className={`
          w-5 h-5 transition-all duration-300
          ${isFavorite ? 'fill-current scale-110' : 'group-hover:scale-110'}
        `}
      />
      
      {/* Text */}
      <span className="text-sm">
        {loading 
          ? 'Đang xử lý...' 
          : isFavorite 
            ? 'Đã yêu thích' 
            : 'Yêu thích'
        }
      </span>

      {/* Ripple effect khi click */}
      {!loading && (
        <span className="absolute inset-0 rounded-lg opacity-0 group-active:opacity-20 bg-white transition-opacity" />
      )}
    </button>
  );
};

export default FavoriteButton;
