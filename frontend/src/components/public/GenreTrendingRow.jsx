import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const GenreTrendingRow = ({ genreName, seasons }) => {
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();

  console.log('GenreTrendingRow - Genre:', genreName, 'Seasons:', seasons?.length); // Debug

  const handleSeasonClick = (seriesSlug, seasonId) => {
    navigate(`/series/${seriesSlug}?season=${seasonId}`);
  };

  const cardWidth = 192;
  const cardHeight = 288;
  const gap = 16;
  const numCards = 5;
  const containerWidth = numCards * cardWidth + (numCards - 1) * gap;

  return (
    <div className="flex gap-6 items-center">
      {/* Left Side - Genre Info (Centered vertically and horizontally) */}
      <div className="w-[300px] flex-shrink-0 flex flex-col items-center justify-center text-center" style={{ minHeight: `${cardHeight + 60}px` }}>
        <button
          onClick={() => navigate(`/search?genre=${encodeURIComponent(genreName)}`)}
          className="text-3xl font-bold text-gray-900 hover:text-[#34D0F4] transition-colors mb-3 leading-tight cursor-pointer"
        >
          {genreName || 'Unknown Genre'}
        </button>
      </div>

      {/* Right Side - Seasons Slider (No navigation arrows) */}
      <div className="flex-1">
        <div className="relative flex items-center justify-center">
          {/* Scroll Container - Match exact width with Episodes lists */}
          <div 
            className="overflow-hidden"
            style={{ width: `${containerWidth}px` }}
          >
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-scroll scrollbar-hide scroll-smooth"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                scrollSnapType: 'x mandatory'
              }}
            >
              {seasons && seasons.length > 0 ? (
                seasons.map((season, index) => (
                  <div
                    key={season._id}
                    onClick={() => handleSeasonClick(season.seriesId?.slug, season._id)}
                    className="flex-shrink-0 w-48 group cursor-pointer"
                    style={{ 
                      scrollSnapAlign: 'start',
                      scrollSnapStop: 'always'
                    }}
                  >
                    {/* Poster Card */}
                    <div className="relative aspect-[2/3] w-48 rounded-lg overflow-hidden bg-gray-50 shadow-md group-hover:shadow-xl transition-all duration-300">
                      <img
                        src={season.posterImage?.startsWith('http') 
                          ? season.posterImage 
                          : `http://localhost:5000/${season.posterImage}`}
                        alt={season.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        loading={index < 6 ? 'eager' : 'lazy'}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x450?text=No+Image';
                        }}
                      />

                      {/* Status Badge */}
                      {season.status === 'airing' && season.latestEpisode && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded shadow-lg z-10">
                          Tập {season.latestEpisode}
                        </div>
                      )}
                      {season.status === 'completed' && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded shadow-lg z-10">
                          Completed
                        </div>
                      )}

                      {/* Play Overlay - Removed play button, only dark overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out z-10">
                      </div>
                    </div>

                    {/* Season Info */}
                    <div className="mt-3 space-y-1">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {season.seriesId?.title || 'Unknown Series'}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-1">
                        {season.title}
                      </p>
                      {season.viewCount > 0 && (
                        <p className="text-xs text-gray-500 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {(season.viewCount || 0).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 w-full">
                  Chưa có season nào cho thể loại này
                </div>
              )}
            </div>
          </div>

          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default GenreTrendingRow;
