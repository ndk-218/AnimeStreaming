import React, { useState, useRef, useEffect } from 'react';

const SeasonSelector = ({ seasons, selectedSeason, onSeasonChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSeasonLabel = (season) => {
    switch (season.seasonType) {
      case 'movie':
        return `Movie ${season.seasonNumber}`;
      case 'ova':
        return 'OVA';
      case 'special':
        return 'Special';
      case 'tv':
      default:
        return `Phần ${season.seasonNumber}`;
    }
  };

  const handleSeasonSelect = (season) => {
    onSeasonChange(season);
    setIsOpen(false);
  };

  if (!seasons || seasons.length === 0) {
    return null;
  }

  // Group seasons by type
  const tvSeasons = seasons.filter(s => s.seasonType === 'tv');
  const movies = seasons.filter(s => s.seasonType === 'movie');
  const ovas = seasons.filter(s => s.seasonType === 'ova');
  const specials = seasons.filter(s => s.seasonType === 'special');

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-3 bg-gradient-to-r from-[#34D0F4] to-[#4DD9FF] text-white rounded-lg font-medium flex items-center justify-between hover:shadow-lg transition-all"
      >
        <span>{selectedSeason ? getSeasonLabel(selectedSeason) : 'Chọn phần'}</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
          {/* TV Seasons */}
          {tvSeasons.length > 0 && (
            <div className="py-2">
              {tvSeasons.map((season) => (
                <button
                  key={season._id}
                  onClick={() => handleSeasonSelect(season)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                    selectedSeason?._id === season._id ? 'bg-blue-50 text-[#34D0F4] font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{getSeasonLabel(season)}</span>
                    <span className="text-sm text-gray-500">
                      {season.episodeCount || 0} tập
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Movies */}
          {movies.length > 0 && (
            <>
              {tvSeasons.length > 0 && <div className="border-t border-gray-200"></div>}
              <div className="py-2">
                {movies.map((season) => (
                  <button
                    key={season._id}
                    onClick={() => handleSeasonSelect(season)}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                      selectedSeason?._id === season._id ? 'bg-blue-50 text-[#34D0F4] font-medium' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{getSeasonLabel(season)}</span>
                      <span className="text-sm text-gray-500">
                        {season.releaseYear || season.seasonNumber}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* OVAs */}
          {ovas.length > 0 && (
            <>
              {(tvSeasons.length > 0 || movies.length > 0) && <div className="border-t border-gray-200"></div>}
              <div className="py-2">
                {ovas.map((season) => (
                  <button
                    key={season._id}
                    onClick={() => handleSeasonSelect(season)}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                      selectedSeason?._id === season._id ? 'bg-blue-50 text-[#34D0F4] font-medium' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{getSeasonLabel(season)}</span>
                      <span className="text-sm text-gray-500">
                        {season.episodeCount || 0} tập
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Specials */}
          {specials.length > 0 && (
            <>
              {(tvSeasons.length > 0 || movies.length > 0 || ovas.length > 0) && <div className="border-t border-gray-200"></div>}
              <div className="py-2">
                {specials.map((season) => (
                  <button
                    key={season._id}
                    onClick={() => handleSeasonSelect(season)}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                      selectedSeason?._id === season._id ? 'bg-blue-50 text-[#34D0F4] font-medium' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{getSeasonLabel(season)}</span>
                      <span className="text-sm text-gray-500">
                        {season.episodeCount || 0} tập
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SeasonSelector;
