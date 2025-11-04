import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/public/Header';
import SearchFilters from '../../components/search/SearchFilters';
import SeasonGrid from '../../components/search/SeasonGrid';
import SearchPagination from '../../components/search/SearchPagination';
import searchService from '../../services/search.service';

const AdvancedSearch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [seasons, setSeasons] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState('updatedAt'); // Default: Mới cập nhật
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [filters, setFilters] = useState({
    seasonTypes: [],
    genres: [],
    studios: [],
    yearStart: null,
    yearEnd: null
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Sort options
  const sortOptions = [
    { value: 'title', label: 'Sắp xếp A-Z' },
    { value: 'year', label: 'Sắp xếp theo Năm sản xuất' },
    { value: 'updatedAt', label: 'Sắp xếp theo Mới cập nhật' }
  ];

  // Parse URL params và apply filters khi vào trang
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const seasonType = params.get('seasonType');
    const genre = params.get('genre');
    
    const initialFilters = {
      seasonTypes: [],
      genres: [],
      studios: [],
      yearStart: null,
      yearEnd: null
    };
    
    // Check if có params từ navigation
    let hasParams = false;
    
    if (seasonType) {
      initialFilters.seasonTypes = [seasonType];
      hasParams = true;
    }
    
    if (genre) {
      initialFilters.genres = [genre];
      hasParams = true;
    }
    
    // Nếu có params từ URL → Ẩn filters và auto search
    if (hasParams) {
      setShowFilters(false);
      setFilters(initialFilters);
      fetchSeasons(initialFilters, 1, sortBy);
    } else {
      // Không có params → Hiện filters và fetch tất cả
      setShowFilters(true);
      fetchSeasons(filters, 1, sortBy);
    }
  }, [location.search]);

  const fetchSeasons = async (searchFilters = filters, page = currentPage, sort = sortBy) => {
    try {
      setLoading(true);

      const response = await searchService.advancedSearch({
        ...searchFilters,
        page: page,
        limit: 24,
        sortBy: sort
      });

      if (response.success) {
        setSeasons(response.data || []);
        setPagination(response.pagination || null);
      } else {
        setSeasons([]);
        setPagination(null);
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
      setSeasons([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setSortBy('updatedAt'); // Reset về sort mặc định khi search
    fetchSeasons(newFilters, 1, 'updatedAt');
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setShowSortDropdown(false);
    setCurrentPage(1);
    fetchSeasons(filters, 1, newSort);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchSeasons(filters, page, sortBy);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const getSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option ? option.label : 'Sắp xếp theo';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        
        {/* Toggle Filters Button */}
        <div className="mb-4">
          <button
            onClick={toggleFilters}
            className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border-2 border-gray-300 transition-colors shadow-sm"
          >
            <svg 
              className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="font-medium">
              {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
            </span>
          </button>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mb-6">
            <SearchFilters 
              onSearch={handleSearch}
              onClose={toggleFilters}
              initialFilters={filters}
            />
          </div>
        )}

        {/* Results Section */}
        <div>
          
          {/* Results Header with Sort */}
          {pagination && (
            <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between">
                {/* Left: Results count */}
                <p className="text-gray-700">
                  Tìm thấy{' '}
                  <span className="font-bold text-yellow-500">
                    {pagination.totalResults}
                  </span>
                  {' '}kết quả
                </p>
                
                {/* Right: Sort dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-colors text-sm"
                  >
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" 
                      />
                    </svg>
                    <span>{getSortLabel()}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}
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

                  {/* Sort Dropdown */}
                  {showSortDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                      {sortOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleSortChange(option.value)}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                            sortBy === option.value
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                          {sortBy === option.value && (
                            <svg 
                              className="inline-block w-4 h-4 ml-2" 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path 
                                fillRule="evenodd" 
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                clipRule="evenodd" 
                              />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Season Grid */}
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 shadow-sm mb-4">
            <SeasonGrid seasons={seasons} loading={loading} />
          </div>

          {/* Pagination - Moved to bottom */}
          {!loading && pagination && (
            <SearchPagination 
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;
