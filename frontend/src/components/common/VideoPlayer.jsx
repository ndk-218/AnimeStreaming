// frontend/src/components/common/VideoPlayer.jsx
// Component: Custom HLS Video Player với custom controls UI

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import axios from 'axios';
import useAuthStore from '../../stores/authStore';
import watchHistoryService from '../../services/watchHistoryService';
import AuthModal from './AuthModal';
import { 
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, 
  Settings, Maximize, Check 
} from 'lucide-react';

const VideoPlayer = ({ hlsPath, qualities, episodeId, autoPlay = true, initialTime = 0 }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const viewTrackedRef = useRef(false);
  const watchTimeRef = useRef(0);
  const progressSaveIntervalRef = useRef(null);
  const containerRef = useRef(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);

  // Settings menu state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState(null); // 'quality' | 'speed' | 'subtitle'
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Get authentication state from authStore
  const { isAuthenticated, isPremium } = useAuthStore();

  // Available playback speeds
  const playbackSpeeds = [0.25, 0.5, 1, 1.25, 1.5, 2];

  // Get max allowed quality based on user tier
  const getMaxAllowedQuality = () => {
    if (isPremium()) return '1080p';
    if (isAuthenticated) return '720p';
    return '480p';
  };

  // Get quality label
  const getQualityLabel = (quality) => {
    if (quality === 'auto') {
      const maxQuality = getMaxAllowedQuality();
      return `Auto (${maxQuality})`;
    }
    return quality;
  };

  // Check if user can access quality
  const canAccessQuality = (quality) => {
    if (quality === 'auto') return true; // Auto is allowed but limited
    if (quality === '480p') return true;
    if (quality === '720p') return isAuthenticated;
    if (quality === '1080p') return isPremium();
    return false;
  };

  // Format time helper
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Get appropriate HLS source based on user tier
  const getAppropriateSource = () => {
    const maxQuality = getMaxAllowedQuality();
    
    // If selecting specific quality, use that if allowed
    if (currentQuality !== 'auto') {
      const qualityFile = qualities.find(q => q.quality === currentQuality)?.file;
      if (qualityFile) {
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${qualityFile}`;
      }
    }

    // For auto, use max allowed quality
    const targetQuality = qualities.find(q => q.quality === maxQuality);
    if (targetQuality) {
      return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${targetQuality.file}`;
    }

    // Fallback to master playlist
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${hlsPath}`;
  };

  // Effect: Setup HLS player with quality restrictions
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsPath) return;

    const videoUrl = getAppropriateSource();

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
        if (initialTime > 0) {
          video.currentTime = initialTime;
        }
        if (autoPlay) {
          video.play().catch(err => console.log('Autoplay prevented:', err));
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS error:', data);
        if (data.fatal) {
          setError(`Video error: ${data.type}`);
        }
      });

      return () => hls.destroy();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      video.addEventListener('loadedmetadata', () => {
        if (initialTime > 0) video.currentTime = initialTime;
      });
      if (autoPlay) {
        video.play().catch(err => console.log('Autoplay prevented:', err));
      }
    } else {
      setError('HLS is not supported in this browser');
    }
  }, [hlsPath, autoPlay, initialTime, isAuthenticated, currentQuality]);

  // Effect: Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  // Effect: View tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !episodeId || viewTrackedRef.current) return;

    const handleTimeUpdate = async () => {
      if (!video.paused) {
        watchTimeRef.current += 1;
        if (watchTimeRef.current >= 10 && !viewTrackedRef.current) {
          viewTrackedRef.current = true;
          try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await axios.post(`${apiUrl}/api/episodes/${episodeId}/view`);
            if (response.data.success) {
              console.log('👁️ View count incremented:', response.data.data.viewCount);
            }
          } catch (error) {
            console.error('❌ Failed to increment view:', error);
          }
        }
      }
    };

    const interval = setInterval(handleTimeUpdate, 1000);
    return () => clearInterval(interval);
  }, [episodeId]);

  // Effect: Watch progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !episodeId || !isAuthenticated) {
      console.log('⏭️ Skipping watch history: User not authenticated');
      return;
    }

    const saveProgress = async () => {
      if (!video.paused && video.currentTime > 0) {
        const currentTime = Math.floor(video.currentTime);
        try {
          await watchHistoryService.updateWatchProgress(episodeId, currentTime);
          console.log(`💾 Progress saved: ${currentTime}s`);
        } catch (error) {
          console.error('❌ Failed to save progress:', error);
        }
      }
    };

    progressSaveIntervalRef.current = setInterval(saveProgress, 60000);

    return () => {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
      }
      if (video.currentTime > 0) {
        saveProgress();
      }
    };
  }, [episodeId, isAuthenticated]);

  // Control handlers
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.duration, video.currentTime + 10);
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
      video.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      video.muted = false;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleQualitySelect = (quality) => {
    const video = videoRef.current;
    if (!video) return;

    // Check access permission
    if (!canAccessQuality(quality)) {
      // Pause video
      video.pause();

      // Show appropriate action based on quality
      if (quality === '720p' && !isAuthenticated) {
        // Show login modal
        setShowAuthModal(true);
      } else if (quality === '1080p' && !isPremium()) {
        // Redirect to premium page
        navigate('/premium');
      }
      
      return;
    }

    // Quality is allowed, change it
    setCurrentQuality(quality);
    const savedTime = video.currentTime;

    if (hlsRef.current) {
      const newSource = quality === 'auto' 
        ? getAppropriateSource()
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${qualities.find(q => q.quality === quality)?.file}`;
      
      hlsRef.current.loadSource(newSource);
      video.currentTime = savedTime;
    }

    setShowSettings(false);
    setSettingsTab(null);
  };

  const handleSpeedSelect = (speed) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettings(false);
    setSettingsTab(null);
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
    <>
      <div 
        ref={containerRef}
        className="relative w-full h-full bg-black group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full"
          playsInline
          onClick={togglePlayPause}
        />

        {/* Custom Controls */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div 
            className="h-1 bg-gray-600 cursor-pointer hover:h-2 transition-all"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-red-600"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left Controls */}
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                className="text-white hover:text-red-500 transition"
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>

              {/* Skip Backward 10s */}
              <button
                onClick={skipBackward}
                className="text-white hover:text-red-500 transition"
              >
                <RotateCcw size={24} />
              </button>

              {/* Skip Forward 10s */}
              <button
                onClick={skipForward}
                className="text-white hover:text-red-500 transition"
              >
                <RotateCw size={24} />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-red-500 transition"
                >
                  {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Time Display */}
              <div className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4">
              {/* Settings */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSettings(!showSettings);
                    setSettingsTab(null);
                  }}
                  className="text-white hover:text-red-500 transition"
                >
                  <Settings size={24} />
                </button>

                {/* Settings Menu */}
                {showSettings && (
                  <div className="absolute bottom-12 right-0 bg-black/95 rounded-lg overflow-hidden min-w-[280px]">
                    {!settingsTab ? (
                      // Main Settings Menu
                      <div className="py-2">
                        <div className="px-4 py-2 text-white font-semibold border-b border-gray-700">
                          Cài đặt
                        </div>
                        
                        {/* Quality Option */}
                        <button
                          onClick={() => setSettingsTab('quality')}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                        >
                          <span>Chất lượng</span>
                          <span className="text-gray-400 flex items-center gap-2">
                            {getQualityLabel(currentQuality)}
                            <span>›</span>
                          </span>
                        </button>

                        {/* Subtitle Option (Disabled) */}
                        <button
                          disabled
                          className="w-full px-4 py-3 text-left text-gray-500 cursor-not-allowed flex items-center justify-between"
                        >
                          <span>Phụ đề</span>
                          <span className="text-gray-600 flex items-center gap-2">
                            Tùy chỉnh
                            <span>›</span>
                          </span>
                        </button>

                        {/* Speed Option */}
                        <button
                          onClick={() => setSettingsTab('speed')}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                        >
                          <span>Tốc độ</span>
                          <span className="text-gray-400 flex items-center gap-2">
                            {playbackSpeed}x
                            <span>›</span>
                          </span>
                        </button>
                      </div>
                    ) : settingsTab === 'quality' ? (
                      // Quality Submenu
                      <div className="py-2">
                        <div className="px-4 py-2 text-white font-semibold border-b border-gray-700 flex items-center gap-2">
                          <button onClick={() => setSettingsTab(null)} className="hover:text-red-500">
                            ‹
                          </button>
                          <span>Chất lượng</span>
                        </div>
                        
                        {/* Auto */}
                        <button
                          onClick={() => handleQualitySelect('auto')}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                        >
                          <span>{getQualityLabel('auto')}</span>
                          {currentQuality === 'auto' && <Check size={20} className="text-yellow-500" />}
                        </button>

                        {/* 1080p */}
                        <button
                          onClick={() => handleQualitySelect('1080p')}
                          className={`w-full px-4 py-3 text-left hover:bg-white/10 transition flex items-center justify-between ${
                            canAccessQuality('1080p') ? 'text-white' : 'text-gray-500'
                          }`}
                        >
                          <span>FHD 1080p {!canAccessQuality('1080p') && '🔒'}</span>
                          {currentQuality === '1080p' && <Check size={20} className="text-yellow-500" />}
                        </button>

                        {/* 720p */}
                        <button
                          onClick={() => handleQualitySelect('720p')}
                          className={`w-full px-4 py-3 text-left hover:bg-white/10 transition flex items-center justify-between ${
                            canAccessQuality('720p') ? 'text-white' : 'text-gray-500'
                          }`}
                        >
                          <span>HD 720p {!canAccessQuality('720p') && '🔒'}</span>
                          {currentQuality === '720p' && <Check size={20} className="text-yellow-500" />}
                        </button>

                        {/* 480p */}
                        <button
                          onClick={() => handleQualitySelect('480p')}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                        >
                          <span>480p</span>
                          {currentQuality === '480p' && <Check size={20} className="text-yellow-500" />}
                        </button>
                      </div>
                    ) : settingsTab === 'speed' ? (
                      // Speed Submenu
                      <div className="py-2">
                        <div className="px-4 py-2 text-white font-semibold border-b border-gray-700 flex items-center gap-2">
                          <button onClick={() => setSettingsTab(null)} className="hover:text-red-500">
                            ‹
                          </button>
                          <span>Tốc độ</span>
                        </div>
                        
                        {playbackSpeeds.map(speed => (
                          <button
                            key={speed}
                            onClick={() => handleSpeedSelect(speed)}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                          >
                            <span>{speed}x</span>
                            {playbackSpeed === speed && <Check size={20} className="text-yellow-500" />}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-red-500 transition"
              >
                <Maximize size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default VideoPlayer;
