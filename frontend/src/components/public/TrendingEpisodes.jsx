import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TrendingEpisodes = () => {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingEpisodes();
  }, []);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 192;
    const gap = 16;
    const scrollAmount = cardWidth + gap;

    if (direction === 'left') {
      if (container.scrollLeft <= 10) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        container.scrollLeft = maxScroll;
      } else {
        container.scrollBy({
          left: -scrollAmount,
          behavior: 'smooth'
        });
      }
    } else {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll - 10) {
        container.scrollLeft = 0;
      } else {
        container.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      }
    }
  };

  const fetchTrendingEpisodes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/episodes/trending?limit=20`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const processedData = data.data.map(episode => ({
          ...episode,
          thumbnail: episode.thumbnail?.startsWith('http') 
            ? episode.thumbnail 
            : `${import.meta.env.VITE_API_URL}/${episode.thumbnail}`,
          series: episode.seriesId ? {
            ...episode.seriesId,
            posterImage: episode.seriesId.posterImage?.startsWith('http')
              ? episode.seriesId.posterImage
              : `${import.meta.env.VITE_API_URL}/${episode.seriesId.posterImage}`
          } : null,
          season: episode.seasonId ? {
            ...episode.seasonId,
            posterImage: episode.seasonId.posterImage?.startsWith('http')
              ? episode.seasonId.posterImage
              : `${import.meta.env.VITE_API_URL}/${episode.seasonId.posterImage}`
          } : null
        }));
        
        setEpisodes(processedData);
      }
    } catch (error) {
      console.error('Error fetching trending episodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEpisodeClick = (episodeId) => {
    navigate(`/watch/${episodeId}`);
  };

  const handleSeriesClick = (e, seriesSlug) => {
    e.stopPropagation();
    navigate(`/anime/${seriesSlug}`);
  };

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải trending...</p>
          </div>
        </div>
      </section>
    );
  }

  if (episodes.length === 0) {
    return null; // Hide section if no trending episodes
  }

  const cardWidth = 192;
  const cardHeight = 288;
  const gap = 16;
  const numCards = 5;
  const containerWidth = numCards * cardWidth + (numCards - 1) * gap;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-3xl font-bold text-gray-900">Trending Anime</h2>
          <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold rounded-full animate-pulse">
            🔥 HOT
          </span>
        </div>

        {/* Slider Container */}
        <div className="relative flex items-center justify-center gap-3">
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            className="flex-shrink-0 w-10 h-10 bg-white hover:bg-gray-100 text-gray-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200 z-10"
            style={{ alignSelf: 'flex-start', marginTop: `${cardHeight / 2 - 20}px` }}
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Scroll Container */}
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
              {episodes.map((episode, index) => (
                <div
                  key={episode._id}
                  onClick={() => handleEpisodeClick(episode._id)}
                  className="flex-shrink-0 w-48 group cursor-pointer"
                  style={{ 
                    scrollSnapAlign: 'start',
                    scrollSnapStop: 'always'
                  }}
                >
                  {/* Poster Card - Clean, only episode badge */}
                  <div className="relative aspect-[2/3] w-48 rounded-lg overflow-hidden bg-gray-50 shadow-md group-hover:shadow-xl transition-all duration-300">
                    <img
                      src={episode.season?.posterImage || episode.series?.posterImage || 'https://via.placeholder.com/300x450?text=No+Image'}
                      alt={episode.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      loading={index < 6 ? 'eager' : 'lazy'}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x450?text=No+Image';
                      }}
                    />

                    {/* Episode Badge - Red gradient */}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded shadow-lg z-10">
                      Tập {episode.episodeNumber}
                    </div>

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out flex items-center justify-center z-10">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-500 ease-out shadow-2xl">
                        <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Episode Info - Below poster */}
                  <div className="mt-3 space-y-1">
                    {/* Series Title */}
                    <button
                      onClick={(e) => handleSeriesClick(e, episode.series?.slug)}
                      className="text-sm font-semibold text-gray-900 hover:text-red-500 transition-colors duration-200 line-clamp-1 text-left w-full"
                    >
                      {episode.series?.title || 'Unknown Series'}
                    </button>

                    {/* Season + Episode Title */}
                    <p className="text-xs text-gray-600 line-clamp-1">
                      {episode.season?.title} • {episode.title}
                    </p>

                    {/* View Count - Only this metric */}
                    {episode.viewCount > 0 && (
                      <p className="text-xs text-gray-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        {episode.viewCount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            className="flex-shrink-0 w-10 h-10 bg-white hover:bg-gray-100 text-gray-700 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200 z-10"
            style={{ alignSelf: 'flex-start', marginTop: `${cardHeight / 2 - 20}px` }}
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default TrendingEpisodes;
