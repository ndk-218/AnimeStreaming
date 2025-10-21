import React, { useState, useEffect } from 'react';
import searchService from '../../services/search.service';

const SearchFilters = ({ onSearch, onClose }) => {
  // Filter states với 3 giá trị: null (default), 'include' (xanh), 'optional' (vàng), 'exclude' (đỏ)
  const [seasonTypeFilters, setSeasonTypeFilters] = useState({});
  const [genreFilters, setGenreFilters] = useState({});
  const [studioFilters, setStudioFilters] = useState({});
  const [yearFilters, setYearFilters] = useState({});
  const [yearStart, setYearStart] = useState('');
  const [yearEnd, setYearEnd] = useState('');

  const [genres, setGenres] = useState([]);
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch genres và studios
  useEffect(() => {
    fetchFilterData();
  }, []);

  const fetchFilterData = async () => {
    try {
      setLoading(true);
      const [genresRes, studiosRes] = await Promise.all([
        searchService.getAllGenres(),
        searchService.getAllStudios()
      ]);

      if (genresRes.success) {
        setGenres(genresRes.data || []);
      }

      if (studiosRes.success) {
        setStudios(studiosRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle filter state (null -> include -> optional -> exclude -> null)
  const toggleFilter = (category, value) => {
    const updateState = (prevState) => {
      const current = prevState[value] || null;
      let next;
      
      if (current === null) {
        next = 'include'; // Xanh lá
      } else if (current === 'include') {
        next = 'optional'; // Vàng
      } else if (current === 'optional') {
        next = 'exclude'; // Đỏ
      } else {
        next = null; // Reset về default
      }

      return {
        ...prevState,
        [value]: next
      };
    };

    switch (category) {
      case 'seasonType':
        setSeasonTypeFilters(updateState);
        break;
      case 'genre':
        setGenreFilters(updateState);
        break;
      case 'studio':
        setStudioFilters(updateState);
        break;
      case 'year':
        setYearFilters(updateState);
        break;
    }
  };

  // Get button style based on state - CHỈ ĐỔI BORDER VÀ TEXT COLOR
  const getButtonStyle = (state) => {
    const baseStyle = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer bg-white';
    
    switch (state) {
      case 'include':
        return `${baseStyle} text-green-600 border-2 border-green-600`;
      case 'optional':
        return `${baseStyle} text-yellow-600 border-2 border-yellow-600`;
      case 'exclude':
        return `${baseStyle} text-red-600 border-2 border-red-600`;
      default:
        return `${baseStyle} text-gray-700 border border-gray-300 hover:border-gray-400`;
    }
  };

  // Build filters object để gửi lên API
  const buildFilters = () => {
    const filters = {
      seasonTypes: [],
      genres: [],
      studios: [],
      yearStart: yearStart || null,
      yearEnd: yearEnd || null
    };

    // Season types - chỉ lấy 'include'
    Object.entries(seasonTypeFilters).forEach(([type, state]) => {
      if (state === 'include') {
        filters.seasonTypes.push(type);
      }
    });

    // Genres - lấy 'include' và 'optional'
    Object.entries(genreFilters).forEach(([genre, state]) => {
      if (state === 'include' || state === 'optional') {
        filters.genres.push(genre);
      }
    });

    // Studios - lấy 'include' và 'optional'
    Object.entries(studioFilters).forEach(([studio, state]) => {
      if (state === 'include' || state === 'optional') {
        filters.studios.push(studio);
      }
    });

    return filters;
  };

  const handleSearch = () => {
    const filters = buildFilters();
    onSearch(filters);
  };

  const handleReset = () => {
    setSeasonTypeFilters({});
    setGenreFilters({});
    setStudioFilters({});
    setYearFilters({});
    setYearStart('');
    setYearEnd('');
  };

  // Generate year options (2025 - 2010)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2010 + 1 },
    (_, i) => currentYear - i
  );

  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-6 shadow-sm">
      
      {/* Header: Title + Legend + Buttons trong 1 dòng */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dotted border-gray-300">
        <h2 className="text-xl font-bold text-gray-900">Tìm kiếm nâng cao</h2>
        
        {/* Legend */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-green-600 rounded-full"></span>
            <span className="text-gray-700">Chọn</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-yellow-600 rounded-full"></span>
            <span className="text-gray-700">Có thể</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-red-600 rounded-full"></span>
            <span className="text-gray-700">Không chọn</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
          >
            Đặt lại
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
          >
            Đóng
          </button>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-md text-sm"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Filters - Label và buttons cùng 1 dòng */}
      <div className="space-y-4">
        
        {/* Loại phim - 1 dòng */}
        <div className="flex items-center pb-4 border-b border-dotted border-gray-300">
          <span className="font-semibold text-gray-700 w-32 flex-shrink-0">Loại phim:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'tv', label: 'TV Series' },
              { value: 'movie', label: 'Movie' },
              { value: 'ova', label: 'OVA' },
              { value: 'special', label: 'Special' }
            ].map(type => (
              <button
                key={type.value}
                onClick={() => toggleFilter('seasonType', type.value)}
                className={getButtonStyle(seasonTypeFilters[type.value])}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Thể loại - 1 dòng, wrap */}
        <div className="flex items-start pb-4 border-b border-dotted border-gray-300">
          <span className="font-semibold text-gray-700 w-32 flex-shrink-0 pt-1.5">Thể loại:</span>
          <div className="flex flex-wrap gap-2 flex-1">
            {genres.map(genre => (
              <button
                key={genre._id}
                onClick={() => toggleFilter('genre', genre.name)}
                className={getButtonStyle(genreFilters[genre.name])}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {/* Studio - 1 dòng, wrap */}
        <div className="flex items-start pb-4 border-b border-dotted border-gray-300">
          <span className="font-semibold text-gray-700 w-32 flex-shrink-0 pt-1.5">Studio:</span>
          <div className="flex flex-wrap gap-2 flex-1">
            {studios.map(studio => (
              <button
                key={studio._id}
                onClick={() => toggleFilter('studio', studio.name)}
                className={getButtonStyle(studioFilters[studio.name])}
              >
                {studio.name}
              </button>
            ))}
          </div>
        </div>

        {/* Năm sản xuất */}
        <div className="flex items-start">
          <span className="font-semibold text-gray-700 w-32 flex-shrink-0 pt-1.5">Năm:</span>
          <div className="flex-1 space-y-3">
            
            {/* Dòng 1: Quick year buttons */}
            <div className="flex flex-wrap gap-2">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => toggleFilter('year', year.toString())}
                  className={getButtonStyle(yearFilters[year.toString()])}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Dòng 2: Custom year range */}
            <div className="flex items-center space-x-3">
              <span className="text-gray-600 text-sm">Nhập năm:</span>
              <input
                type="number"
                placeholder="Từ năm"
                value={yearStart}
                onChange={(e) => setYearStart(e.target.value)}
                className="w-32 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                min="1900"
                max={currentYear}
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Đến năm"
                value={yearEnd}
                onChange={(e) => setYearEnd(e.target.value)}
                className="w-32 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                min="1900"
                max={currentYear}
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SearchFilters;
