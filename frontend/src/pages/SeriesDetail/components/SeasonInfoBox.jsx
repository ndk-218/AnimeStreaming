import React from 'react';
import { useNavigate } from 'react-router-dom';
import FavoriteButton from '../../../components/user/FavoriteButton';

const SeasonInfoBox = ({ selectedSeason, series }) => {
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

      {/* Season Metadata - Reordered Grid */}
      <div className="space-y-3 mb-4">
        
        {/* Row 1: Status + Release Year */}
        <div className="grid grid-cols-2 gap-3">
          {/* Status */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Tình trạng</p>
            <p className="text-sm font-medium text-gray-900">
              {selectedSeason.episodeCount || 0} tập
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
        </div>

        {/* Row 2: Type + Studios */}
        <div className="grid grid-cols-2 gap-3">
          {/* Type */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Loại</p>
            <button
              onClick={() => navigate(`/search?seasonType=${selectedSeason.seasonType}`)}
              className="px-3 py-1 bg-cyan-50 text-[#34D0F4] border border-[#34D0F4] text-sm font-medium rounded transition-all duration-300 hover:bg-pink-50 hover:text-[#FA7299] hover:border-[#FA7299] cursor-pointer"
            >
              {selectedSeason.seasonType === 'tv' ? 'TV Series' : 
               selectedSeason.seasonType === 'movie' ? 'Movie' :
               selectedSeason.seasonType === 'ova' ? 'OVA' : 'Special'}
            </button>
          </div>

          {/* Studios */}
          {selectedSeason.studios && selectedSeason.studios.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Studio</p>
              <div className="flex flex-wrap gap-1">
                {selectedSeason.studios.map((studio) => (
                  <button
                    key={studio._id}
                    onClick={() => navigate(`/search?studio=${encodeURIComponent(studio.name)}`)}
                    className="px-3 py-1 bg-cyan-50 text-[#34D0F4] border border-[#34D0F4] text-sm font-medium rounded transition-all duration-300 hover:bg-pink-50 hover:text-[#FA7299] hover:border-[#FA7299] cursor-pointer"
                  >
                    {studio.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Genres (Full Width) */}
        {selectedSeason.genres && selectedSeason.genres.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Thể loại</p>
            <div className="flex flex-wrap gap-1">
              {selectedSeason.genres.map((genre) => (
                <button
                  key={genre._id}
                  onClick={() => navigate(`/search?genre=${encodeURIComponent(genre.name)}`)}
                  className="px-3 py-1 bg-cyan-50 text-[#34D0F4] border border-[#34D0F4] text-sm font-medium rounded transition-all duration-300 hover:bg-pink-50 hover:text-[#FA7299] hover:border-[#FA7299] cursor-pointer"
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons - Aligned Left, Auto Width */}
      <div className="flex items-center gap-3">
        {/* Watch Now Button */}
        <button
          onClick={handleWatchClick}
          disabled={!hasEpisodes}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
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

        {/* Favorite Button */}
        <div>
          <FavoriteButton seriesId={series?._id} />
        </div>
      </div>
    </div>
  );
};

export default SeasonInfoBox;
