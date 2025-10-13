// frontend/src/pages/WatchPage.jsx
// Page: Minimal watch page để test video playback

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import VideoPlayer from '../components/common/VideoPlayer';

const WatchPage = () => {
  const { episodeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playbackData, setPlaybackData] = useState(null);

  useEffect(() => {
    const fetchPlaybackData = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${apiUrl}/api/episodes/${episodeId}/playback`);

        if (response.data.success) {
          setPlaybackData(response.data.data);
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
  }, [episodeId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-700 font-semibold text-lg mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Success state - Show video
  const { episode, series, season, video } = playbackData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Episode Info - Minimal */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {series.title}
          </h1>
          <p className="text-gray-600">
            {season.title} - Episode {episode.episodeNumber}: {episode.title}
          </p>
        </div>

        {/* Video Player */}
        <VideoPlayer
          hlsPath={video.hlsPath}
          qualities={video.qualities}
          autoPlay={true}
        />

        {/* Debug Info (Optional - có thể xóa sau) */}
        <div className="mt-8 max-w-4xl mx-auto">
          <details className="bg-white rounded-lg shadow p-4">
            <summary className="cursor-pointer font-semibold text-gray-700">
              Debug Info (Click to expand)
            </summary>
            <pre className="mt-4 text-xs text-gray-600 overflow-auto">
              {JSON.stringify(playbackData, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;