import React, { useState, useEffect } from 'react';
import searchService from '../../services/search.service';

const SearchFilters = ({ onSearch, onClose, initialFilters = null }) => {
  // Season type - CHỈ 1 LỰA CHỌN (radio behavior)
  const [selectedSeasonType, setSelectedSeasonType] = useState(null);
  
  // Genres và Studios - Nhiều lựa chọn với state: null, 'include', 'exclude'
  const [genreFilters, setGenreFilters] = useState({});
  const [studioFilters, setStudioFilters] = useState({});
  
  // Year filters - Phức tạp: quick select (1 năm) HOẶC range + exclude
  const [selectedYear, setSelectedYear] = useState(null); // Quick select
  const [excludedYears, setExcludedYears] = useState([]); // Loại trừ
  const [yearStart, setYearStart] = useState('');
  const [yearEnd, setYearEnd] = useState('');

  const [genres, setGenres] = useState([]);
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch genres và studios
  useEffect(() => {
    fetchFilterData();
  }, []);

  // Apply initial filters từ URL params khi component mount
  useEffect(() => {
    if (initialFilters) {
      // Apply seasonType
      if (initialFilters.seasonTypes && initialFilters.seasonTypes.length > 0) {
        setSelectedSeasonType(initialFilters.seasonTypes[0]);
      }
      
      // Apply genres
      if (initialFilters.genres && initialFilters.genres.length > 0) {
        const newGenreFilters = {};
        initialFilters.genres.forEach(genre => {
          newGenreFilters[genre] = 'include';
        });
        setGenreFilters(newGenreFilters);
      }
      
      // Apply studios
      if (initialFilters.studios && initialFilters.studios.length > 0) {
        const newStudioFilters = {};
        initialFilters.studios.forEach(studio => {
          newStudioFilters[studio] = 'include';
        });
        setStudioFilters(newStudioFilters);
      }
      
      // Apply years
      if (initialFilters.yearStart) {
        setYearStart(initialFilters.yearStart);
      }
      if (initialFilters.yearEnd) {
        setYearEnd(initialFilters.yearEnd);
      }
    }
  }, [initialFilters]);

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

  // Toggle season type (CHỈ 1 LỰA CHỌN - radio)
  const handleSeasonTypeClick = (type) => {
    if (selectedSeasonType === type) {
      setSelectedSeasonType(null); // Uncheck nếu click lại
    } else {
      setSelectedSeasonType(type); // Chọn type mới
    }
  };

  // Toggle genre/studio filter: null -> include -> exclude -> null
  const toggleFilter = (category, value) => {
    const updateState = (prevState) => {
      const current = prevState[value] || null;
      let next;
      
      if (current === null) {
        next = 'include'; // Xanh lá
      } else if (current === 'include') {
        next = 'exclude'; // Đỏ
      } else {
        next = null; // Reset về default
      }

      return {
        ...prevState,
        [value]: next
      };
    };

    if (category === 'genre') {
      setGenreFilters(updateState);
    } else if (category === 'studio') {
      setStudioFilters(updateState);
    }
  };

  // Handle year button click
  const handleYearClick = (year) => {
    const yearStr = year.toString();
    
    if (selectedYear === yearStr) {
      // Click lại năm đã chọn → Uncheck
      setSelectedYear(null);
    } else if (excludedYears.includes(yearStr)) {
      // Đang là excluded (đỏ) → Bỏ exclude
      setExcludedYears(excludedYears.filter(y => y !== yearStr));
    } else if (selectedYear === null) {
      // Chưa chọn năm nào → Chọn năm này
      setSelectedYear(yearStr);
    } else {
      // Đã chọn năm khác → Đổi sang exclude (đỏ)
      setExcludedYears([...excludedYears, yearStr]);
    }
  };

  // Get button style
  const getButtonStyle = (state) => {
    const baseStyle = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer bg-white';
    
    switch (state) {
      case 'include':
        return `${baseStyle} text-green-600 border-2 border-green-600`;
      case 'exclude':
        return `${baseStyle} text-red-600 border-2 border-red-600`;
      default:
        return `${baseStyle} text-gray-700 border border-gray-300 hover:border-gray-400`;
    }
  };

  // Get year button state
  const getYearButtonState = (year) => {
    const yearStr = year.toString();
    if (selectedYear === yearStr) return 'include';
    if (excludedYears.includes(yearStr)) return 'exclude';
    return null;
  };

  // Build filters object để gửi lên API
  const buildFilters = () => {
    const filters = {
      seasonTypes: [],
      genres: [],
      studios: [],
      yearStart: null,
      yearEnd: null,
      excludeYears: []
    };

    // Season type - CHỈ 1
    if (selectedSeasonType) {
      filters.seasonTypes = [selectedSeasonType];
    }

    // Genres - chỉ lấy 'include' (AND logic)
    Object.entries(genreFilters).forEach(([genre, state]) => {
      if (state === 'include') {
        filters.genres.push(genre);
      }
    });

    // Studios - chỉ lấy 'include' (AND logic)
    Object.entries(studioFilters).forEach(([studio, state]) => {
      if (state === 'include') {
        filters.studios.push(studio);
      }
    });

    // Year logic - PRIORITY: Range input > Quick select
    if (yearStart || yearEnd) {
      // Có nhập range → Dùng range
      filters.yearStart = yearStart || null;
      filters.yearEnd = yearEnd || null;
      filters.excludeYears = excludedYears; // Loại trừ năm trong range
    } else if (selectedYear) {
      // Chỉ chọn 1 năm → Set cả start và end = năm đó
      filters.yearStart = selectedYear;
      filters.yearEnd = selectedYear;
    }

    return filters;
  };

  const handleSearch = () => {
    const filters = buildFilters();
    onSearch(filters);
  };

  const handleReset = () => {
    setSelectedSeasonType(null);
    setGenreFilters({});
    setStudioFilters({});
    setSelectedYear(null);
    setExcludedYears([]);
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
      
      {/* Header: Title + Legend + Buttons */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dotted border-gray-300">
        <h2 className="text-xl font-bold text-gray-900">Tìm kiếm nâng cao</h2>
        
        {/* Legend */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-green-600 rounded-full"></span>
            <span className="text-gray-700">Chọn</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-red-600 rounded-full"></span>
            <span className="text-gray-700">Loại trừ</span>
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
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-md text-sm"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        
        {/* Loại phim - CHỈ CHỌN 1 (Radio) */}
        <div className="flex items-center pb-4 border-b border-dotted border-gray-300">
          <span className="font-semibold text-gray-700 w-40 flex-shrink-0 text-right pr-4">
            Loại phim:
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'tv', label: 'TV Series' },
              { value: 'movie', label: 'Movie' },
              { value: 'ova', label: 'OVA' },
              { value: 'special', label: 'Special' }
            ].map(type => (
              <button
                key={type.value}
                onClick={() => handleSeasonTypeClick(type.value)}
                className={getButtonStyle(selectedSeasonType === type.value ? 'include' : null)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Thể loại - Nhiều lựa chọn */}
        <div className="flex items-start pb-4 border-b border-dotted border-gray-300">
          <span className="font-semibold text-gray-700 w-40 flex-shrink-0 text-right pr-4 pt-1.5">Thể loại:</span>
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

        {/* Studio - Nhiều lựa chọn */}
        <div className="flex items-start pb-4 border-b border-dotted border-gray-300">
          <span className="font-semibold text-gray-700 w-40 flex-shrink-0 text-right pr-4 pt-1.5">Studio:</span>
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
          <span className="font-semibold text-gray-700 w-40 flex-shrink-0 text-right pr-4 pt-1.5">
            Năm:
          </span>
          <div className="flex-1 space-y-3">
            
            {/* Dòng 1: Quick year buttons */}
            <div className="flex flex-wrap gap-2">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => handleYearClick(year)}
                  className={getButtonStyle(getYearButtonState(year))}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Dòng 2: Custom year range */}
            <div className="flex items-center space-x-3">
              <span className="text-gray-600 text-sm">Nhập khoảng:</span>
              <input
                type="number"
                placeholder="Từ năm"
                value={yearStart}
                onChange={(e) => {
                  setYearStart(e.target.value);
                  setSelectedYear(null); // Clear quick select khi nhập range
                }}
                className="w-32 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                min="1900"
                max={currentYear}
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Đến năm"
                value={yearEnd}
                onChange={(e) => {
                  setYearEnd(e.target.value);
                  setSelectedYear(null); // Clear quick select khi nhập range
                }}
                className="w-32 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                min="1900"
                max={currentYear}
              />
            </div>

            {/* Hiển thị excluded years */}
            {excludedYears.length > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Loại trừ: </span>
                <span className="text-red-600">{excludedYears.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default SearchFilters;
