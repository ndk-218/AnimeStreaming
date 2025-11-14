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
          className="w-[120px] h-[50px] bg-gradient-to-br from-blue-500 to-blue-600 hover:from-[#FF69B4] hover:to-[#FF1493] rounded transition-all duration-300 transform hover:scale-110 hover:shadow-xl flex items-center justify-center flex-shrink-0"
        >
          {/* Episode Number */}
          <span className="text-white text-base font-bold">
            Tập {episode.episodeNumber}
          </span>
        </button>
      ))}
    </div>
  );
};

export default EpisodeGrid;
