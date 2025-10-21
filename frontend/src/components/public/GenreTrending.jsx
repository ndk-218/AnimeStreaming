import { useState, useEffect } from 'react';
import GenreTrendingRow from './GenreTrendingRow';
import { getTrendingGenres } from '../../services/contentService';

const GenreTrending = () => {
  const [trendingGenres, setTrendingGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingGenres();
  }, []);

  const fetchTrendingGenres = async () => {
    try {
      setLoading(true);
      const data = await getTrendingGenres();
      console.log('Trending Genres Data:', data); // Debug log
      setTrendingGenres(data);
    } catch (error) {
      console.error('Error fetching trending genres:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#34D0F4] mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thể loại thịnh hành...</p>
        </div>
      </div>
    );
  }

  if (trendingGenres.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="text-center py-12">
          <p className="text-gray-500">Chưa có dữ liệu thể loại thịnh hành</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-purple-300">
      {/* Section Title */}
      <div className="px-8 pt-8 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Thể Loại Thịnh Hành</h2>
      </div>

      {/* Genre Rows */}
      <div className="px-8 pb-8 space-y-6">
        {trendingGenres.map((genreData, index) => {
          // NEW: Backend trả về {_id, name, viewCount, seasons}
          const genreName = genreData.name || 'Unknown Genre';
          console.log(`Genre ${index}:`, genreName, 'Seasons:', genreData.seasons?.length); // Debug
          
          return (
            <div key={genreData._id || index}>
              <GenreTrendingRow 
                genreName={genreName}
                seasons={genreData.seasons || []} 
              />
              {/* Divider between rows (except last) */}
              {index < trendingGenres.length - 1 && (
                <div className="border-b border-gray-200 mt-6"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenreTrending;
