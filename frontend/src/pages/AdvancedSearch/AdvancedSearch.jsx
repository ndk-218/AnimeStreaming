import React, { useState, useEffect } from 'react';
import Header from '../../components/public/Header';
import SearchFilters from '../../components/search/SearchFilters';
import SeasonGrid from '../../components/search/SeasonGrid';
import SearchPagination from '../../components/search/SearchPagination';
import searchService from '../../services/search.service';

const AdvancedSearch = () => {
  const [seasons, setSeasons] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    seasonTypes: [],
    genres: [],
    studios: [],
    yearStart: null,
    yearEnd: null
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Initial fetch khi vào trang
  useEffect(() => {
    fetchSeasons(filters, 1);
  }, []);

  const fetchSeasons = async (searchFilters = filters, page = currentPage) => {
    try {
      setLoading(true);

      const response = await searchService.advancedSearch({
        ...searchFilters,
        page: page,
        limit: 24
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
    fetchSeasons(newFilters, 1);
    // Auto close filters sau khi search (optional)
    // setShowFilters(false);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchSeasons(filters, page);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
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
            />
          </div>
        )}

        {/* Results Section */}
        <div>
          
          {/* Results Header */}
          {pagination && (
            <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between text-gray-700">
                <p>
                  Tìm thấy{' '}
                  <span className="font-bold text-yellow-500">
                    {pagination.totalResults}
                  </span>
                  {' '}kết quả
                </p>
                
                <p className="text-sm text-gray-400">
                  Trang {currentPage} / {pagination.totalPages}
                </p>
              </div>
            </div>
          )}

          {/* Season Grid */}
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 shadow-sm">
            <SeasonGrid seasons={seasons} loading={loading} />
          </div>

          {/* Pagination */}
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
