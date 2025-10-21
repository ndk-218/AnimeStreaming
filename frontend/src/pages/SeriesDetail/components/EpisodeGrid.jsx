import React from 'react';
import { useNavigate } from 'react-router-dom';

const EpisodeGrid = ({ episodes, loading }) => {
  const navigate = useNavigate();

  const handleEpisodeClick = (episodeId) => {
    navigate(`/watch/${episodeId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 24 }).map((_, index) => (
          <div key={index} className="w-[120px] h-[50px] bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (!episodes || episodes.length === 0) {
    return (
      <div className="text-center py-12">
        <svg 
          className="w-16 h-16 text-gray-400 mx-auto mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" 
          />
        </svg>
        <p className="text-gray-600 font-medium">Chưa có tập nào được upload</p>
        <p className="text-gray-500 text-sm mt-1">Vui lòng quay lại sau</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {episodes.map((episode) => (
        <button
          key={episode._id}
          onClick={() => handleEpisodeClick(episode._id)}
          className="group relative w-[120px] h-[50px] bg-gradient-to-br from-blue-500 to-blue-600 rounded hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex-shrink-0"
        >
          {/* Episode Number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-base font-bold group-hover:scale-110 transition-transform">
              Tập {episode.episodeNumber}
            </span>
          </div>

          {/* Hover Overlay with Play Icon */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
            <svg 
              className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>

          {/* Episode Title on Hover (Bottom) */}
          {episode.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-90 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
              {episode.title}
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default EpisodeGrid;
