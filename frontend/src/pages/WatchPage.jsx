import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/public/Header';
import VideoPlayer from '../components/common/VideoPlayer';
import SeasonSelector from './SeriesDetail/components/SeasonSelector';
import EpisodeGrid from './SeriesDetail/components/EpisodeGrid';
import EpisodeBatchNav from './SeriesDetail/components/EpisodeBatchNav';
import seriesService from '../services/series.service';
import useAuthStore from '../stores/authStore';
import watchHistoryService from '../services/watchHistoryService';

const WatchPage = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  // Get initial time from query param ?t= OR from watch history
  const [initialTime, setInitialTime] = useState(parseInt(searchParams.get('t')) || 0);

  // Playback data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playbackData, setPlaybackData] = useState(null);

  // Episode list data
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Fetch playback data + watch history
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

          // If user authenticated AND no time from query param, try to get from watch history
          if (isAuthenticated && !searchParams.get('t')) {
            try {
              const resumeData = await watchHistoryService.getResumeInfo(data.series.id);
              
              // If resume episode is THIS episode, set initial time
              if (resumeData.success && resumeData.data?.episodeId === episodeId) {
                const resumeTime = resumeData.data.watchedDuration || 0;
                console.log(`📺 Auto-resume from watch history: ${resumeTime}s`);
                setInitialTime(resumeTime);
              }
            } catch (err) {
              console.log('No watch history found for this series');
            }
          }

          // Fetch series seasons for episode selector
          if (data.series?.slug) {
            fetchSeriesSeasons(data.series.slug, data.season.id);
          }
        } else {
          setError('Failed to load episode');
        }
      } catch (err) {
        console.error('Fetch playback error:', err);
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load episode';
        setError(errorMessage);
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
        
        // Set current season as selected
        const currentSeason = response.data.seasons.find(s => s._id === currentSeasonId);
        if (currentSeason) {
          setSelectedSeason(currentSeason);
        }
      }
    } catch (err) {
      console.error('Error fetching seasons:', err);
    }
  };

  // Fetch episodes when season changes
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
      console.error('Error fetching episodes:', err);
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

  const handleSeriesInfoClick = () => {
    if (playbackData?.series?.slug) {
      navigate(`/series/${playbackData.series.slug}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#34D0F4] mx-auto mb-4"></div>
            <p className="text-white font-medium">Đang tải video...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg 
              className="w-16 h-16 text-red-500 mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <p className="text-white font-bold text-xl mb-2">Lỗi tải video</p>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gradient-to-r from-[#34D0F4] to-[#4DD9FF] text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { episode, series, season, video } = playbackData;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header - Fixed */}
      <Header />

      {/* Video Player - FULL SCREEN with initialTime for resume */}
      <div className="w-full bg-black" style={{ height: 'calc(100vh - 64px)' }}>
        <VideoPlayer
          hlsPath={video.hlsPath}
          qualities={video.qualities}
          episodeId={episodeId}
          autoPlay={true}
          initialTime={initialTime}
        />
      </div>

      {/* Info + Episodes Section - BELOW video (scrollable) */}
      <div className="bg-gray-50 py-6">
        <div className="max-w-[1700px] mx-auto px-6">
          <div className="flex gap-6">
            
            {/* LEFT: Episode Info */}
            <div className="w-[320px] flex-shrink-0">
              <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-blue-300">
                
                {/* Poster */}
                {season.posterImage && (
                  <div className="mb-4">
                    <img
                      src={`http://localhost:5000/${season.posterImage}`}
                      alt={series.title}
                      className="w-full rounded-lg shadow-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Series Title */}
                <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">
                  {series.title}
                </h1>

                {/* Original Title */}
                {series.originalTitle && (
                  <p className="text-gray-600 text-sm mb-4 text-center">
                    {series.originalTitle}
                  </p>
                )}

                {/* Current Episode Info */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">Đang xem</p>
                  <p className="font-bold text-gray-900">
                    {season.title} - Tập {episode.episodeNumber}
                  </p>
                  {episode.title && (
                    <p className="text-sm text-gray-700 mt-1">{episode.title}</p>
                  )}
                </div>

                {/* Series Info Button */}
                <button
                  onClick={handleSeriesInfoClick}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#34D0F4] to-[#4DD9FF] text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Thông tin phim</span>
                </button>
              </div>
            </div>

            {/* RIGHT: Episode Grid */}
            <div className="flex-1 max-w-[1200px]">
              <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-blue-300">
                
                {/* Header: Season Selector + Batch Nav */}
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

                {/* Bottom Batch Navigation */}
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
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
