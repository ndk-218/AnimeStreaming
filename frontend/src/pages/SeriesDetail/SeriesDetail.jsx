import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/public/Header';
import SeriesBanner from './components/SeriesBanner';
import SeriesInfo from './components/SeriesInfo';
import SeasonInfoBox from './components/SeasonInfoBox';
import SeasonSelector from './components/SeasonSelector';
import EpisodeGrid from './components/EpisodeGrid';
import EpisodeBatchNav from './components/EpisodeBatchNav';
import seriesService from '../../services/series.service';

const SeriesDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [series, setSeries] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchSeriesDetail();
  }, [slug]);

  useEffect(() => {
    if (selectedSeason) {
      fetchEpisodes(selectedSeason._id, currentBatch);
    }
  }, [selectedSeason, currentBatch]);

  const fetchSeriesDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await seriesService.getSeriesDetail(slug);

      if (response.success) {
        const { series, seasons, defaultSeason } = response.data;
        
        setSeries(series);
        setSeasons(seasons);
        
        // ⚠️ CHECK URL QUERY PARAMETER: ?season=X
        const requestedSeasonNumber = searchParams.get('season');
        
        if (requestedSeasonNumber && seasons.length > 0) {
          // Tìm season theo seasonNumber từ URL
          const foundSeason = seasons.find(
            s => s.seasonNumber === parseInt(requestedSeasonNumber)
          );
          
          if (foundSeason) {
            console.log(`🎯 Auto-selecting season ${requestedSeasonNumber} from URL`);
            setSelectedSeason(foundSeason);
          } else {
            // Không tìm thấy season, dùng default
            console.warn(`⚠️ Season ${requestedSeasonNumber} not found, using default`);
            setSelectedSeason(defaultSeason || seasons[0]);
          }
        } else {
          // Không có query parameter, dùng default season
          if (defaultSeason) {
            setSelectedSeason(defaultSeason);
          } else if (seasons.length > 0) {
            setSelectedSeason(seasons[0]);
          }
        }
      } else {
        setError(response.error || 'Failed to load series');
      }
    } catch (err) {
      console.error('Error fetching series detail:', err);
      setError('Failed to load series. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
    
    // ✅ UPDATE URL khi chọn season khác
    navigate(`/series/${slug}?season=${season.seasonNumber}`, { replace: true });
  };

  const handleBatchChange = (batch) => {
    setCurrentBatch(batch);
    const episodesSection = document.getElementById('episodes-section');
    if (episodesSection) {
      episodesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#34D0F4] mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Đang tải thông tin phim...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[600px]">
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
            <p className="text-gray-900 font-bold text-xl mb-2">Không tìm thấy phim</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-gradient-to-r from-[#34D0F4] to-[#4DD9FF] text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <SeriesBanner 
        bannerImage={series?.bannerImage} 
        title={series?.title} 
      />

      {/* 3-BOX LAYOUT - FIXED POSITIONING */}
      <div className="max-w-[1700px] mx-auto px-6 py-8">
        <div className="flex gap-4">
          
          {/* BOX 1: Poster + Series Info (Left) - INCREASED SIZE */}
          <div className="w-[320px] flex-shrink-0">
            <SeriesInfo 
              series={series} 
              selectedSeason={selectedSeason}
            />
          </div>

          {/* RIGHT COLUMN: Season Info + Episodes - REDUCED WIDTH */}
          <div className="flex-1 max-w-[1200px] space-y-4">
            
            {/* BOX 2: Season Info */}
            <SeasonInfoBox selectedSeason={selectedSeason} />

            {/* BOX 3: Episode Grid */}
            <div id="episodes-section" className="bg-white rounded-lg p-6 shadow-sm border-2 border-blue-300">
              
              {/* Header: Season Selector (Left) + Batch Nav (Right) */}
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
  );
};

export default SeriesDetail;
