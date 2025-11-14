import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, Settings, LogOut, Crown } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import AuthModal from '../common/AuthModal';
import authService from '../../services/authService';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [genres, setGenres] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const searchRef = useRef(null);
  const genreRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const debounceTimer = useRef(null);

  // Auth store
  const { isAuthenticated, user, logout } = useAuthStore();

  // Fetch genres on mount
  useEffect(() => {
    fetchGenres();
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (genreRef.current && !genreRef.current.contains(event.target)) {
        setShowGenreDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const query = searchQuery.trim();
    
    if (query.length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  const fetchGenres = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/content/genres');
      const data = await response.json();
      if (data.success) {
        setGenres(data.data);
      }
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const performSearch = async (query) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/series/search?q=${encodeURIComponent(query)}&limit=10`
      );
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
      setSearchQuery('');
    }
  };

  const handleResultClick = (series) => {
    navigate(`/series/${series.slug}`);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      setShowUserMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
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

  return (
    <>
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#34D0F4] to-[#4DD9FF] shadow-lg">
        <div className="max-w-[1700px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Side: Logo + Search Bar + Navigation Buttons */}
            <div className="flex items-center space-x-6">
              {/* Logo */}
              <Link to="/" className="flex items-center pl-6">
                <div className="text-3xl font-bold">
                  <span style={{ color: '#FFD700' }}>G</span>
                  <span style={{ color: '#FFFFFF' }}>old</span>
                  <span style={{ color: '#FFD700' }}>en</span>
                </div>
              </Link>

              {/* Search Bar */}
              <div ref={searchRef} className="relative">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm anime..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-96 px-4 py-2 pr-10 border border-white/30 bg-white/10 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 backdrop-blur-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white"
                  >
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    )}
                  </button>
                </form>

                {/* Search Dropdown */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
                    {isSearching ? (
                      <div className="py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#34D0F4] mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Đang tìm kiếm...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((series) => (
                          <button
                            key={series._id}
                            onClick={() => handleResultClick(series)}
                            className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left flex items-start space-x-3"
                          >
                            {series.latestSeason?.posterImage && (
                              <img
                                src={`http://localhost:5000/${series.latestSeason.posterImage}`}
                                alt={series.title}
                                className="w-12 h-16 object-cover rounded"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/48x64?text=No+Image';
                                }}
                              />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {series.title}
                              </div>
                              
                              {series.originalTitle && (
                                <div className="text-sm text-gray-500 truncate">
                                  {series.originalTitle}
                                </div>
                              )}
                              
                              {series.latestSeason && (
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs bg-blue-100 text-[#34D0F4] px-2 py-0.5 rounded font-medium">
                                    {getSeasonTypeLabel(series.latestSeason.seasonType)} {series.latestSeason.seasonNumber}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    • Tập {series.latestSeason.maxEpisode}
                                  </span>
                                  {series.latestSeason.releaseYear && (
                                    <span className="text-xs text-gray-500">
                                      • {series.latestSeason.releaseYear}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <svg 
                          className="w-12 h-12 text-gray-400 mx-auto mb-2" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                          />
                        </svg>
                        <p className="text-gray-600 font-medium">Không tìm thấy kết quả</p>
                        <p className="text-gray-500 text-sm mt-1">
                          Thử tìm với từ khóa khác: "{searchQuery}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Menu - Moved to Left Block */}
              <nav className="flex items-center space-x-6">
                <Link
                  to="/search?seasonType=tv"
                  className="text-white/95 hover:text-[#FFD700] font-medium transition-colors"
                >
                  Phim Bộ
                </Link>

                <Link
                  to="/search?seasonType=movie"
                  className="text-white/95 hover:text-[#FFD700] font-medium transition-colors"
                >
                  Phim Lẻ
                </Link>

                {/* Thể Loại Dropdown */}
                <div ref={genreRef} className="relative">
                  <button 
                    onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                    className="text-white/95 hover:text-[#FFD700] font-medium transition-colors flex items-center"
                  >
                    Thể Loại
                    <svg
                      className={`ml-1 w-4 h-4 transition-transform ${showGenreDropdown ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showGenreDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-[600px] bg-white rounded-lg shadow-xl border border-gray-200 p-4">
                      {genres.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {genres.map((genre) => (
                            <Link
                              key={genre._id}
                              to={`/search?genre=${encodeURIComponent(genre.name)}`}
                              onClick={() => setShowGenreDropdown(false)}
                              className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#34D0F4] rounded transition-colors text-center"
                            >
                              {genre.name}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-gray-500 text-sm text-center">
                          Đang tải thể loại...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Link
                  to="/search"
                  className="text-white/95 hover:text-[#FFD700] font-medium transition-colors"
                >
                  Tìm Kiếm Nâng Cao
                </Link>
              </nav>
            </div>

            {/* Right Side: User Menu */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  {/* Notification Bell */}
                  <button className="relative p-2 text-white/90 hover:text-white transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>

                  {/* User Menu */}
                  <div ref={userMenuRef} className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={
                          user.avatar?.startsWith('/assets') 
                            ? user.avatar 
                            : user.avatar 
                              ? `http://localhost:5000${user.avatar}` 
                              : 'https://via.placeholder.com/40'
                        }
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full border-2 border-white/50 object-cover"
                      />
                      <svg
                        className={`w-4 h-4 text-white transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="font-semibold text-gray-900">{user.displayName}</p>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          {user.isPremium && (
                            <div className="mt-2 inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                              <Crown size={12} className="mr-1" />
                              Premium
                            </div>
                          )}
                        </div>

                        {/* Menu Items */}
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User size={18} className="mr-3" />
                          Trang cá nhân
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings size={18} className="mr-3" />
                          Cài đặt
                        </Link>

                        <div className="border-t border-gray-200 my-1"></div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={18} className="mr-3" />
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Login Button */
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg backdrop-blur-sm transition-colors"
                >
                  Đăng Nhập
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default Header;
