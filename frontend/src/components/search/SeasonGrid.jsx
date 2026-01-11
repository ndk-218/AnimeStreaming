import React from 'react';
import { useNavigate } from 'react-router-dom';

const SeasonGrid = ({ seasons, loading }) => {
  const navigate = useNavigate();

  const handleSeasonClick = (season) => {
    // Navigate to series page with season query parameter
    navigate(`/series/${season.series.slug}?season=${season.seasonNumber}`);
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

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 24 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg aspect-[2/3]"></div>
            <div className="mt-2 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!seasons || seasons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg 
          className="w-24 h-24 text-gray-300 mb-4" 
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
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          Không tìm thấy kết quả
        </h3>
        <p className="text-gray-500">
          Thử thay đổi bộ lọc để tìm thấy nhiều kết quả hơn
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {seasons.map((season) => (
        <div
          key={season._id}
          onClick={() => handleSeasonClick(season)}
          className="group cursor-pointer"
        >
          {/* Poster */}
          <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-200 shadow-md group-hover:shadow-xl transition-shadow">
            {season.posterImage ? (
              <img
                src={`${import.meta.env.VITE_API_URL}/${season.posterImage}`}
                alt={season.series.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                <svg 
                  className="w-16 h-16 text-gray-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
              </div>
            )}

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
          </div>

          {/* Info */}
          <div className="mt-2 space-y-1">
            {/* Series Title */}
            <h3 className="font-medium text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {season.series.title}
            </h3>

            {/* Season info */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium text-blue-600">
                {getSeasonTypeLabel(season.seasonType)} {season.seasonNumber}
              </span>
              {season.releaseYear && (
                <>
                  <span>•</span>
                  <span>{season.releaseYear}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SeasonGrid;
