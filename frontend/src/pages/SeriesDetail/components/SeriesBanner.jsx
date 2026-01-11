import React from 'react';

const SeriesBanner = ({ bannerImage, title }) => {
  return (
    <div className="relative w-full h-[500px] overflow-hidden">
      {/* Banner Image with overlay */}
      <div className="absolute inset-0">
        {bannerImage ? (
          <img
            src={`${import.meta.env.VITE_API_URL}/${bannerImage}`}
            alt={title}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Fallback placeholder - light gray */}
        <div 
          className="w-full h-full bg-gray-200 flex items-center justify-center"
          style={{ display: bannerImage ? 'none' : 'flex' }}
        >
          <div className="text-center text-gray-400">
            <svg 
              className="w-24 h-24 mx-auto mb-4" 
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
            <p className="text-lg font-medium">No Banner Available</p>
          </div>
        </div>
        
        {/* Gradient overlay for better content readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
      </div>
    </div>
  );
};

export default SeriesBanner;
