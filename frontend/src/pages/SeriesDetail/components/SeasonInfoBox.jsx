import React from 'react';
import { useNavigate } from 'react-router-dom';

const SeasonInfoBox = ({ selectedSeason }) => {
  const navigate = useNavigate();

  if (!selectedSeason) return null;

  const hasEpisodes = selectedSeason?.episodeCount > 0;

  const handleWatchClick = () => {
    if (hasEpisodes && selectedSeason?.latestEpisode) {
      navigate(`/watch/${selectedSeason.latestEpisode._id}`);
    }
  };

  const getSeasonLabel = () => {
    switch (selectedSeason.seasonType) {
      case 'movie':
        return `Movie ${selectedSeason.seasonNumber}`;
      case 'ova':
        return 'OVA';
      case 'special':
        return 'Special';
      case 'tv':
      default:
        return `Phần ${selectedSeason.seasonNumber}`;
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-blue-300">
      
      {/* Season Title */}
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {getSeasonLabel()}
      </h2>

      {/* Season Description - Justified */}
      {selectedSeason.description && (
        <p className="text-gray-700 text-sm leading-relaxed mb-4 text-justify">
          {selectedSeason.description}
        </p>
      )}

      {/* Season Metadata - Compact Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        
        {/* Genres */}
        {selectedSeason.genres && selectedSeason.genres.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Thể loại</p>
            <div className="flex flex-wrap gap-1">
              {selectedSeason.genres.map((genre) => (
                <span
                  key={genre._id}
                  className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Studios */}
        {selectedSeason.studios && selectedSeason.studios.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Studio</p>
            <p className="text-sm font-medium text-gray-900">
              {selectedSeason.studios.map(s => s.name).join(', ')}
            </p>
          </div>
        )}

        {/* Status */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Tình trạng</p>
          <p className="text-sm font-medium text-gray-900">
            {selectedSeason.episodeCount || 0} / {selectedSeason.episodeCount || '?'} tập
          </p>
        </div>

        {/* Release Year */}
        {selectedSeason.releaseYear && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Năm phát hành</p>
            <p className="text-sm font-medium text-gray-900">
              {selectedSeason.releaseYear}
            </p>
          </div>
        )}

        {/* Type */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Loại</p>
          <p className="text-sm font-medium text-gray-900 capitalize">
            {selectedSeason.seasonType === 'tv' ? 'TV Series' : 
             selectedSeason.seasonType === 'movie' ? 'Movie' :
             selectedSeason.seasonType === 'ova' ? 'OVA' : 'Special'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        {/* Watch Now Button */}
        <button
          onClick={handleWatchClick}
          disabled={!hasEpisodes}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center space-x-2 ${
            hasEpisodes
              ? 'bg-gradient-to-r from-[#FF69B4] to-[#FF1493] text-white hover:shadow-lg transform hover:-translate-y-0.5'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
          <span>{hasEpisodes ? 'Xem Ngay' : 'Chưa có tập'}</span>
        </button>

        {/* Favorite Button (Disabled - Phase 2) */}
        <button
          disabled
          className="px-5 py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed flex items-center space-x-2"
          title="Chức năng này sẽ có ở Phase 2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>Yêu thích</span>
        </button>
      </div>
    </div>
  );
};

export default SeasonInfoBox;
