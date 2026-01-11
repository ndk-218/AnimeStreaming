import React from 'react';

const SeriesInfo = ({ series, selectedSeason }) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-blue-300 h-full">
      
      {/* Poster - Centered */}
      <div className="flex justify-center mb-6">
        {selectedSeason?.posterImage ? (
          <img
            src={`${import.meta.env.VITE_API_URL}/${selectedSeason.posterImage}`}
            alt={selectedSeason.title}
            className="w-[230px] rounded-lg shadow-lg"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/230x345?text=No+Poster';
            }}
          />
        ) : (
          <div className="w-[230px] aspect-[2/3] bg-gray-200 rounded-lg shadow-lg flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <svg 
                className="w-12 h-12 mx-auto mb-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <p className="text-xs">No Poster</p>
            </div>
          </div>
        )}
      </div>

      {/* Series Title */}
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {series.title}
        </h1>
        {series.originalTitle && (
          <p className="text-gray-600 text-sm">
            {series.originalTitle}
          </p>
        )}
      </div>

      {/* Series Description - Justified */}
      {series.description && (
        <div>
          <p className="text-gray-700 text-sm leading-relaxed text-justify">
            {series.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default SeriesInfo;
