import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [featuredAnime, setFeaturedAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch recent seasons from API
  useEffect(() => {
    fetchFeaturedAnime();
  }, []);

  const fetchFeaturedAnime = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/seasons/recent?limit=5');
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        // Process image URLs to add full path
        const processedData = data.data.map(season => ({
          ...season,
          posterImage: season.posterImage?.startsWith('http') 
            ? season.posterImage 
            : `http://localhost:5000/${season.posterImage}`,
          series: season.seriesId ? {
            ...season.seriesId,
            bannerImage: season.seriesId.bannerImage?.startsWith('http')
              ? season.seriesId.bannerImage
              : `http://localhost:5000/${season.seriesId.bannerImage}`,
            posterImage: season.seriesId.posterImage?.startsWith('http')
              ? season.seriesId.posterImage
              : `http://localhost:5000/${season.seriesId.posterImage}`
          } : null
        }));
        
        setFeaturedAnime(processedData);
        console.log('✅ Fetched featured anime:', processedData.length);
      }
    } catch (error) {
      console.error('Error fetching featured anime:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto slide every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying || featuredAnime.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredAnime.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, featuredAnime.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handlePlayClick = () => {
    const anime = featuredAnime[currentSlide];
    if (anime?.series?.slug) {
      navigate(`/series/${anime.series.slug}`);
    }
  };

  const handleTitleClick = () => {
    const anime = featuredAnime[currentSlide];
    if (anime?.series?.slug) {
      navigate(`/series/${anime.series.slug}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="relative w-full h-[800px] bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#FFD700] mx-auto mb-4"></div>
          <p className="text-white text-lg">Đang tải...</p>
        </div>
      </div>
    );
  }

  // No data state
  if (featuredAnime.length === 0) {
    return (
      <div className="relative w-full h-[800px] bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-2">Chưa có anime nào</p>
          <p className="text-white/60">Vui lòng thêm content từ admin panel</p>
        </div>
      </div>
    );
  }

  const currentAnime = featuredAnime[currentSlide];

  return (
    <div className="relative w-full h-[800px] overflow-hidden bg-gray-900">
      {/* Background Images with Fade Transition */}
      {featuredAnime.map((anime, index) => (
        <div
          key={anime._id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Banner Image */}
          <img
            src={anime.series?.bannerImage || anime.posterImage || 'https://via.placeholder.com/1920x600?text=No+Banner'}
            alt={anime.series?.title || anime.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/1920x600?text=No+Banner';
            }}
          />
          {/* Gradient Overlay - Minimal, only for text readability */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        </div>
      ))}

      {/* Content */}
      <div className="absolute inset-0 flex items-end pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            {/* Series Title - Clickable */}
            <button
              onClick={handleTitleClick}
              className="text-white text-5xl font-bold mb-3 hover:text-[#FFD700] transition-colors text-left drop-shadow-2xl"
            >
              {currentAnime.series?.title || 'Untitled Series'}
            </button>

            {/* Season/Movie Title - Clickable */}
            <button
              onClick={handleTitleClick}
              className="text-white/95 text-2xl font-medium mb-4 hover:text-[#FFD700] transition-colors text-left block drop-shadow-lg"
            >
              {currentAnime.title}
            </button>

            {/* Genres */}
            {currentAnime.series?.genres && currentAnime.series.genres.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                {currentAnime.series.genres.map((genre, index) => (
                  <span
                    key={index}
                    className="text-white text-sm font-medium drop-shadow-lg"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {(currentAnime.description || currentAnime.series?.description) && (
              <p className="text-white/90 text-base mb-8 line-clamp-3 drop-shadow-lg">
                {currentAnime.description || currentAnime.series?.description}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex items-center space-x-6 mb-8 text-white text-sm font-medium">
              {currentAnime.releaseYear && (
                <span className="flex items-center drop-shadow-lg">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {currentAnime.releaseYear}
                </span>
              )}
              {currentAnime.episodeCount > 0 && (
                <span className="flex items-center drop-shadow-lg">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  {currentAnime.episodeCount} tập
                </span>
              )}
              {currentAnime.seasonType && (
                <span className="uppercase text-xs font-bold tracking-wider drop-shadow-lg">
                  {currentAnime.seasonType}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePlayClick}
                className="flex items-center space-x-3 px-8 py-4 bg-[#FFD700] hover:bg-[#FFC700] text-gray-900 font-bold rounded-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Xem Ngay</span>
              </button>

              <button
                onClick={handleTitleClick}
                className="flex items-center space-x-2 px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl backdrop-blur-sm"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Chi Tiết</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-3">
        {featuredAnime.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all ${
              index === currentSlide
                ? 'w-12 h-3 bg-[#FFD700]'
                : 'w-3 h-3 bg-white/50 hover:bg-white/80'
            } rounded-full`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Arrow Navigation */}
      <button
        onClick={() => goToSlide((currentSlide - 1 + featuredAnime.length) % featuredAnime.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full transition-all"
        aria-label="Previous slide"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={() => goToSlide((currentSlide + 1) % featuredAnime.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full transition-all"
        aria-label="Next slide"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
};

export default HeroSlider;
