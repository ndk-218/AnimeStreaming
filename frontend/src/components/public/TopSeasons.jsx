import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TopSeasons = () => {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopSeasons();
  }, []);

  const fetchTopSeasons = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/content/top-seasons?limit=4');
      const data = await response.json();
      
      if (data.success) {
        // Process image URLs
        const processedData = data.data.map(season => ({
          ...season,
          posterImage: season.posterImage?.startsWith('http') 
            ? season.posterImage 
            : `http://localhost:5000/${season.posterImage}`,
          seriesId: season.seriesId ? {
            ...season.seriesId,
            posterImage: season.seriesId.posterImage?.startsWith('http')
              ? season.seriesId.posterImage
              : `http://localhost:5000/${season.seriesId.posterImage}`
          } : null
        }));
        setSeasons(processedData);
      }
    } catch (error) {
      console.error('Error fetching top seasons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeasonClick = (season) => {
    if (season.seriesId?.slug) {
      navigate(`/anime/${season.seriesId.slug}`);
    }
  };

  const getTrendIcon = (index) => {
    if (index === 0) return '📈'; // Rank 1
    if (index === 1) return '📈'; // Rank 2
    return '—'; // Others
  };

  const getStatusBadge = (season) => {
    if (season.status === 'airing' && season.latestEpisode) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded">
          Tập {season.latestEpisode}
        </span>
      );
    }
    if (season.status === 'completed') {
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded">
          Completed
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 flex-1 flex flex-col">
        <div className="flex items-center mb-6">
          <span className="text-2xl mr-3">📊</span>
          <h2 className="text-xl font-bold text-white">Yêu thích nhất</h2>
        </div>
        <div className="space-y-2 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-700 rounded"></div>
              <div className="w-11 h-16 bg-gray-700 rounded"></div>
              <div className="flex-1 h-12 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center mb-6">
        <span className="text-2xl mr-3">📊</span>
        <h2 className="text-xl font-bold text-white">Yêu thích nhất</h2>
      </div>

      {/* Seasons List */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        {seasons.map((season, index) => (
          <button
            key={season._id}
            onClick={() => handleSeasonClick(season)}
            className="w-full flex items-center space-x-3 p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
          >
            {/* Rank Number */}
            <div className="w-8 text-center flex-shrink-0">
              <span className="text-lg font-bold text-gray-400">
                {index + 1}.
              </span>
            </div>

            {/* Poster Image */}
            <div className="w-11 h-16 flex-shrink-0">
              <img
                src={season.posterImage || season.seriesId?.posterImage || 'https://via.placeholder.com/100x140?text=No+Image'}
                alt={season.title}
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/100x140?text=No+Image';
                }}
              />
            </div>

            {/* Season Info */}
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium text-sm truncate mb-1">
                {season.seriesId?.title || 'Unknown Series'}
              </div>
              <div className="text-xs text-gray-400 truncate mb-1">
                {season.title}
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(season)}
                <span className="text-xs text-gray-500">
                  {(season.viewCount || 0).toLocaleString()} views
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <button className="w-full mt-4 text-sm text-gray-400 hover:text-white transition-colors">
        Xem thêm
      </button>
    </div>
  );
};

export default TopSeasons;
