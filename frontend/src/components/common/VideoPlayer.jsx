// frontend/src/components/common/VideoPlayer.jsx
// Component: Minimal HLS Video Player với quality selector

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const VideoPlayer = ({ hlsPath, qualities, autoPlay = true }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [error, setError] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsPath) return;

    // Construct full URL
    const videoUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${hlsPath}`;

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      });

      hlsRef.current = hls;

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS manifest loaded');
        if (autoPlay) {
          video.play().catch(err => {
            console.log('Autoplay prevented:', err);
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS error:', data);
        if (data.fatal) {
          setError(`Video error: ${data.type}`);
        }
      });

      return () => {
        hls.destroy();
      };
    } 
    // Fallback for Safari (native HLS support)
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      if (autoPlay) {
        video.play().catch(err => {
          console.log('Autoplay prevented:', err);
        });
      }
    } else {
      setError('HLS is not supported in this browser');
    }
  }, [hlsPath, autoPlay]);

  // Handle quality change
  const handleQualityChange = (quality) => {
    setCurrentQuality(quality);
    
    if (quality === 'auto') {
      // Load master playlist (auto quality)
      const videoUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${hlsPath}`;
      if (hlsRef.current) {
        hlsRef.current.loadSource(videoUrl);
      }
    } else {
      // Load specific quality
      const qualityFile = qualities.find(q => q.quality === quality)?.file;
      if (qualityFile && hlsRef.current) {
        const videoUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${qualityFile}`;
        hlsRef.current.loadSource(videoUrl);
      }
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-semibold">Error loading video</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Video Element */}
      <video
        ref={videoRef}
        controls
        className="w-full rounded-lg shadow-lg bg-black"
        playsInline
      />

      {/* Quality Selector */}
      <div className="absolute top-4 right-4 z-10">
        <select
          value={currentQuality}
          onChange={(e) => handleQualityChange(e.target.value)}
          className="bg-black/70 text-white px-3 py-2 rounded-lg border border-white/30 cursor-pointer hover:bg-black/90 transition"
        >
          <option value="auto">Auto</option>
          {qualities?.map((q) => (
            <option key={q.quality} value={q.quality}>
              {q.quality}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default VideoPlayer;