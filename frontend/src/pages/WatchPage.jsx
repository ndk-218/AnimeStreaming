import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/public/Header';
import VideoPlayer from '../components/common/VideoPlayer';
import SeasonSelector from './SeriesDetail/components/SeasonSelector';
import EpisodeGrid from './SeriesDetail/components/EpisodeGrid';
import EpisodeBatchNav from './SeriesDetail/components/EpisodeBatchNav';
import FavoriteButton from '../components/user/FavoriteButton';
import seriesService from '../services/series.service';
import useAuthStore from '../stores/authStore';
import watchHistoryService from '../services/watchHistoryService';
import { CommentSection } from '../components/comments';

const WatchPage = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const [initialTime, setInitialTime] = useState(parseInt(searchParams.get('t')) || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playbackData, setPlaybackData] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Fetch playback data
  useEffect(() => {
    const fetchPlaybackData = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${apiUrl}/api/episodes/${episodeId}/playback`);

        if (response.data.success) {
          const data = response.data.data;
          setPlaybackData(data);

          if (isAuthenticated && !searchParams.get('t')) {
            try {
              const resumeData = await watchHistoryService.getResumeInfo(data.series.id);
              if (resumeData.success && resumeData.data?.episodeId === episodeId) {
                setInitialTime(resumeData.data.watchedDuration || 0);
              }
            } catch (err) {
              console.log('No watch history found');
            }
          }

          if (data.series?.slug) {
            fetchSeriesSeasons(data.series.slug, data.season.id);
          }
        } else {
          setError('Failed to load episode');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load episode');
      } finally {
        setLoading(false);
      }
    };

    if (episodeId) {
      fetchPlaybackData();
    }
  }, [episodeId, isAuthenticated, searchParams]);

  // Fetch series seasons
  const fetchSeriesSeasons = async (slug, currentSeasonId) => {
    try {
      const response = await seriesService.getSeriesDetail(slug);
      if (response.success) {
        setSeasons(response.data.seasons);
        const currentSeason = response.data.seasons.find(s => s._id === currentSeasonId);
        if (currentSeason) {
          setSelectedSeason(currentSeason);
        }
      }
    } catch (err) {
      console.error('Error fetching seasons:', err);
    }
  };

  // Fetch episodes
  useEffect(() => {
    if (selectedSeason) {
      fetchEpisodes(selectedSeason._id, currentBatch);
    }
  }, [selectedSeason, currentBatch]);

  const fetchEpisodes = async (seasonId, batch = 1) => {
    try {
      setEpisodesLoading(true);
      const response = await seriesService.getSeasonEpisodes(seasonId, batch, 24);
      if (response.success) {
        setEpisodes(response.data.episodes || []);
        setPagination(response.data.pagination || null);
      } else {
        setEpisodes([]);
        setPagination(null);
      }
    } catch (err) {
      setEpisodes([]);
      setPagination(null);
    } finally {
      setEpisodesLoading(false);
    }
  };

  const handleSeasonChange = (season) => {
    setSelectedSeason(season);
    setCurrentBatch(1);
  };

  const handleBatchChange = (batch) => {
    setCurrentBatch(batch);
  };

  const handleGenreClick = (genreName) => {
    navigate(`/search?genre=${encodeURIComponent(genreName)}`);
  };

  const handleStudioClick = (studioName) => {
    navigate(`/search?studio=${encodeURIComponent(studioName)}`);
  };

  const handleTypeClick = (type) => {
    navigate(`/search?seasonType=${type}`);
  };

  const handleSeriesInfoClick = () => {
    if (playbackData?.series?.slug) {
      navigate(`/series/${playbackData.series.slug}`);
    }
  };

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

  const getTypeDisplay = (type) => {
    switch (type) {
      case 'tv': return 'TV Series';
      case 'movie': return 'Movie';
      case 'ova': return 'OVA';
      case 'special': return 'Special';
      default: return type;
    }
  };

  // Debug log subtitles (MUST BE AT TOP LEVEL)
  useEffect(() => {
    if (playbackData?.video?.subtitles) {
      console.log('📺 WatchPage - Playback Data:', {
        hasSubtitles: playbackData.video.subtitles?.length > 0,
        subtitleCount: playbackData.video.subtitles?.length,
        subtitleSizes: playbackData.video.subtitles?.map(s => s.file)
      });
    }
  }, [playbackData]);

  // Memoize video player props (MUST BE AT TOP LEVEL)
  const videoPlayerProps = useMemo(() => {
    if (!playbackData) return null;
    
    return {
      hlsPath: playbackData.video.hlsPath,
      qualities: playbackData.video.qualities,
      subtitles: playbackData.video.subtitles || [],
      episodeId: episodeId,
      autoPlay: false,
      initialTime: initialTime
    };
  }, [playbackData, episodeId, initialTime]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#34D0F4] mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Đang tải video...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-900 font-bold text-xl mb-2">Lỗi tải video</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gradient-to-r from-[#34D0F4] to-[#4DD9FF] text-white rounded-lg font-medium"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Early return if no playback data
  if (!playbackData || !videoPlayerProps) {
    return null;
  }

  const { episode, series, season, video } = playbackData;
  
  // Use selectedSeason if available (has full populated data)
  const displaySeason = selectedSeason || season;
  const seriesId = series._id || series.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Video Player */}
      <div className="w-full bg-black" style={{ height: 'calc(100vh - 64px)' }}>
        <VideoPlayer {...videoPlayerProps} />
      </div>

      {/* Content Section */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        
        {/* Single Info Card - RoPhim Style */}
        <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-blue-300 mb-4">
          <div className="flex gap-6">
            
            {/* LEFT: Compact Poster (230px) - Use selectedSeason poster */}
            <div className="w-[230px] flex-shrink-0">
              {displaySeason?.posterImage ? (
                <img
                  src={`http://localhost:5000/${displaySeason.posterImage}`}
                  alt={series.title}
                  className="w-full rounded-lg shadow-lg"
                  onError={(e) => {
                    console.error('❌ Poster failed to load:', displaySeason.posterImage);
                    e.target.src = 'https://via.placeholder.com/230x345?text=No+Poster';
                  }}
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* RIGHT: Info Content */}
            <div className="flex-1">
              {/* Series Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {series.title}
              </h1>

              {/* Original Title */}
              {series.originalTitle && (
                <p className="text-gray-600 text-sm mb-3">
                  {series.originalTitle}
                </p>
              )}

              {/* Info Badges Row - Current Episode + Year + Episode Count */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {/* Current Episode Badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full px-4 py-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  <span className="text-sm font-semibold">
                    Đang xem: {getSeasonLabel(displaySeason)} - Tập {episode.episodeNumber}
                  </span>
                </div>

                {/* Release Year Badge */}
                {displaySeason.releaseYear && (
                  <div className="inline-flex items-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full px-4 py-2">
                    <span className="text-sm font-semibold">
                      {displaySeason.releaseYear}
                    </span>
                  </div>
                )}

                {/* Episode Count Badge */}
                <div className="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full px-4 py-2">
                  <span className="text-sm font-semibold">
                    {displaySeason.episodeCount || 0} tập
                  </span>
                </div>
              </div>

              {/* Season Title */}
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                {getSeasonLabel(displaySeason)}
              </h2>

              {/* Season Description with Show More */}
              {displaySeason.description && (
                <div className="mb-4">
                  <p className={`text-gray-700 text-sm leading-relaxed ${!showFullDescription ? 'line-clamp-3' : ''}`}>
                    {displaySeason.description}
                  </p>
                  {displaySeason.description.length > 150 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1"
                    >
                      {showFullDescription ? 'Thu gọn' : 'Xem thêm'}
                    </button>
                  )}
                </div>
              )}

              {/* Clickable Tags - Only searchable items */}
              <div className="flex flex-wrap gap-2 mb-4">
                
                {/* Genres */}
                {displaySeason.genres && displaySeason.genres.length > 0 && displaySeason.genres.map((genre) => (
                  <button
                    key={genre._id}
                    onClick={() => handleGenreClick(genre.name)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    {genre.name}
                  </button>
                ))}

                {/* Type */}
                <button
                  onClick={() => handleTypeClick(displaySeason.seasonType)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                >
                  {getTypeDisplay(displaySeason.seasonType)}
                </button>

                {/* Studios */}
                {displaySeason.studios && displaySeason.studios.length > 0 && displaySeason.studios.map((studio) => (
                  <button
                    key={studio._id}
                    onClick={() => handleStudioClick(studio.name)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    {studio.name}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {/* Info Button */}
                <button
                  onClick={handleSeriesInfoClick}
                  className="px-4 py-2 bg-gradient-to-r from-[#34D0F4] to-[#4DD9FF] text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Thông tin phim</span>
                </button>

                {/* Favorite Button */}
                <FavoriteButton seriesId={seriesId} />
              </div>
            </div>
          </div>
        </div>

        {/* Episodes Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-blue-300">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            
            <div className="w-56">
              <SeasonSelector
                seasons={seasons}
                selectedSeason={selectedSeason}
                onSeasonChange={handleSeasonChange}
              />
            </div>

            {pagination && pagination.totalBatches > 1 && (
              <div className="flex-shrink-0">
                <EpisodeBatchNav
                  currentBatch={currentBatch}
                  totalBatches={pagination.totalBatches}
                  episodesPerBatch={pagination.episodesPerBatch}
                  onBatchChange={handleBatchChange}
                />
              </div>
            )}
          </div>

          {/* Episode Grid */}
          <EpisodeGrid 
            episodes={episodes} 
            loading={episodesLoading}
          />

          {/* Bottom Pagination */}
          {pagination && pagination.totalBatches > 1 && episodes.length > 0 && (
            <div className="mt-6 flex justify-center">
              <EpisodeBatchNav
                currentBatch={currentBatch}
                totalBatches={pagination.totalBatches}
                episodesPerBatch={pagination.episodesPerBatch}
                onBatchChange={handleBatchChange}
              />
            </div>
          )}
        </div>

        {/* Comment Section */}
        <div className="mt-4">
          <CommentSection
            episodeId={episodeId}
            seriesId={seriesId}
            seasonId={displaySeason._id || season.id}
          />
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
