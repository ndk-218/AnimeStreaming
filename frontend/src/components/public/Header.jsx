import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [genres, setGenres] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const searchRef = useRef(null);
  const genreRef = useRef(null);
  const navigate = useNavigate();
  const debounceTimer = useRef(null);

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search - trigger from first character
  useEffect(() => {
    const query = searchQuery.trim();
    
    if (query.length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    // Show loading immediately when user starts typing
    setIsSearching(true);
    setShowDropdown(true);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer (500ms delay)
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
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#34D0F4] to-[#4DD9FF] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="text-3xl font-bold">
              <span style={{ color: '#FFD700' }}>G</span>
              <span style={{ color: '#FFFFFF' }}>old</span>
            </div>
            <span className="text-sm text-white/90 hidden md:block">
              Classic Anime Treasures
            </span>
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/browse/tv"
              className="text-white/95 hover:text-[#FFD700] font-medium transition-colors"
            >
              Phim Bộ
            </Link>

            <Link
              to="/browse/movie"
              className="text-white/95 hover:text-[#FFD700] font-medium transition-colors"
            >
              Phim Lẻ
            </Link>

            <Link
              to="/browse/ova"
              className="text-white/95 hover:text-[#FFD700] font-medium transition-colors"
            >
              OVA
            </Link>

            {/* Thể Loại Dropdown - Click to toggle */}
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

              {/* Genre Dropdown Menu - Grid layout */}
              {showGenreDropdown && (
                <div className="absolute top-full left-0 mt-2 w-[600px] bg-white rounded-lg shadow-xl border border-gray-200 p-4">
                  {genres.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {genres.map((genre) => (
                        <Link
                          key={genre._id}
                          to={`/genres/${genre.slug}`}
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

          {/* Search Bar */}
          <div className="flex items-center space-x-4">
            <div ref={searchRef} className="relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 px-4 py-2 pr-10 border border-white/30 bg-white/10 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 backdrop-blur-sm"
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
                    // Loading state
                    <div className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#34D0F4] mx-auto mb-2"></div>
                      <p className="text-gray-500 text-sm">Đang tìm kiếm...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    // Results found
                    <div className="py-2">
                      {searchResults.map((series) => (
                        <button
                          key={series._id}
                          onClick={() => handleResultClick(series)}
                          className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left flex items-start space-x-3"
                        >
                          {/* Poster thumbnail */}
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
                            {/* Series Title */}
                            <div className="font-medium text-gray-900 truncate">
                              {series.title}
                            </div>
                            
                            {/* Original Title */}
                            {series.originalTitle && (
                              <div className="text-sm text-gray-500 truncate">
                                {series.originalTitle}
                              </div>
                            )}
                            
                            {/* Latest Season Info */}
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
                    // No results found
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

            {/* Login Button (Disabled) */}
            <button
              disabled
              className="px-4 py-2 bg-white/20 text-white/60 rounded-lg cursor-not-allowed backdrop-blur-sm"
              title="Chức năng đăng nhập sẽ có ở Phase 2"
            >
              Đăng Nhập
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
