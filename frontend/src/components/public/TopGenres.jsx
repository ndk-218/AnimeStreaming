import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TopGenres = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopGenres();
  }, []);

  const fetchTopGenres = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/content/top-genres?limit=4`);
      const data = await response.json();
      
      if (data.success) {
        setGenres(data.data);
      }
    } catch (error) {
      console.error('Error fetching top genres:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 flex-1 flex flex-col">
        <div className="flex items-center mb-6">
          <span className="text-2xl mr-3">🏆</span>
          <h2 className="text-xl font-bold text-white">Thể loại Hot</h2>
        </div>
        <div className="space-y-3 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-700 rounded"></div>
              <div className="flex-1 h-12 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleGenreClick = (genreName) => {
    navigate(`/search?genre=${encodeURIComponent(genreName)}`);
  };

  const getTrendIcon = (index) => {
    if (index === 0) return '📈'; // Rank 1
    if (index === 1) return '📈'; // Rank 2
    return '—'; // Others
  };

  return (
    <div className="bg-gray-800 rounded-lg px-6 py-5 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center mb-6">
        <span className="text-2xl mr-3">🏆</span>
        <h2 className="text-xl font-bold text-white">Thể loại Hot</h2>
      </div>

      {/* Genres List */}
      <div className="space-y-4 flex-1 overflow-y-auto">
        {genres.map((genre, index) => (
          <button
            key={genre._id}
            onClick={() => handleGenreClick(genre.name)}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
          >
            {/* Rank Number */}
            <div className="w-8 text-center">
              <span className="text-lg font-bold text-gray-400">
                {index + 1}.
              </span>
            </div>

            {/* Genre Info */}
            <div className="flex-1">
              <div className="text-white font-medium">{genre.name}</div>
              <div className="text-xs text-gray-400">
                {(genre.viewCount || 0).toLocaleString()} lượt xem
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopGenres;
