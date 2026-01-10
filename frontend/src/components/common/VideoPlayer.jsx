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
import { memo } from 'react';

const VideoPlayer = ({ hlsPath, qualities, subtitles = [], episodeId, autoPlay = true, initialTime = 0 }) => {
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
  const [isBuffering, setIsBuffering] = useState(true); // Add buffering state

  // Settings menu state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState(null); // 'quality' | 'speed' | 'subtitle' | 'subtitle-color' | etc.
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [subtitleEnabled, setSubtitleEnabled] = useState(false);
  
  // Subtitle customization settings (Load from localStorage)
  const [subtitleSettings, setSubtitleSettings] = useState(() => {
    // Try to load saved settings from localStorage
    const saved = localStorage.getItem('subtitleSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved subtitle settings:', e);
      }
    }
    
    // Default settings if no saved data
    return {
      color: 'white',           // white, black, yellow, blue, pink
      fontSize: '14pt',         // 12pt, 14pt, 16pt, 18pt, 20pt, 24pt, 32pt
      textOpacity: '100%',      // 0%, 25%, 50%, 75%, 100%
      fontFamily: 'Arial',      // Arial, Courier, Georgia, Impact, etc.
      textEdge: 'shadow',       // none, shadow, raised, outline
      bgColor: 'black',         // black, darkgray, lightgray, blue, pink, white
      bgOpacity: '0%',          // 0%, 25%, 50%, 75%, 100%
      position: '20px'          // 0px, 20px, 40px, 60px, 80px, 100px, 120px, 140px
    };
  });

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Get authentication state from authStore
  const { isAuthenticated } = useAuthStore();

  // Debug log auth state
  useEffect(() => {
    console.log('🔑 VideoPlayer Auth State:', { isAuthenticated });
  }, [isAuthenticated]);

  // Available playback speeds
  const playbackSpeeds = [0.25, 0.5, 1, 1.25, 1.5, 2];

  // Subtitle customization options
  const subtitleOptions = {
    colors: [
      { value: 'white', label: 'Trắng' },
      { value: 'black', label: 'Đen' },
      { value: 'yellow', label: 'Vàng' },
      { value: 'blue', label: 'Xanh Dương' },
      { value: 'pink', label: 'Hồng' }
    ],
    fontSizes: ['12pt', '14pt', '16pt', '18pt', '20pt', '24pt', '32pt'],
    opacities: ['0%', '25%', '50%', '75%', '100%'],
    fontFamilies: [
      'Arial',
      'Courier New',
      'Georgia',
      'Impact',
      'Lucida Console',
      'Tahoma',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana'
    ],
    textEdges: [
      { value: 'none', label: 'Không' },
      { value: 'shadow', label: 'Bóng đổ' },
      { value: 'raised', label: 'Nổi' },
      { value: 'outline', label: 'Viền mỏng' }
    ],
    bgColors: [
      { value: 'black', label: 'Đen' },
      { value: '#333', label: 'Xám Đậm' },
      { value: '#999', label: 'Xám Nhạt' },
      { value: 'blue', label: 'Xanh Dương' },
      { value: 'pink', label: 'Hồng' },
      { value: 'white', label: 'Trắng' }
    ],
    positions: ['0px', '20px', '40px', '60px', '80px', '100px', '120px', '140px']
  };

  // Helper: Convert SRT to VTT format
  const convertSrtToVtt = (srtText) => {
    // Add WEBVTT header
    let vttText = 'WEBVTT\n\n';
    
    // Replace comma with dot in timestamps (SRT uses comma, VTT uses dot)
    // Example: 00:00:01,260 -> 00:00:01.260
    vttText += srtText.replace(/,(\d{3})/g, '.$1');
    
    console.log('✅ [VideoPlayer] SRT converted to VTT');
    return vttText;
  };

  // Get max allowed quality based on user tier
  const getMaxAllowedQuality = () => {
    // NEW LOGIC: Anonymous can watch up to 720p, Registered can watch all
    if (isAuthenticated) return '1080p';
    return '720p';
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
    if (quality === 'auto') return true;
    if (quality === '480p' || quality === '720p') return true; // Everyone can access 480p & 720p
    if (quality === '1080p' || quality === 'Upscaled') return isAuthenticated; // Only registered users
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
    console.log('🎥 [VideoPlayer] Starting HLS setup...');
    const startTime = performance.now();
    
    const video = videoRef.current;
    if (!video || !hlsPath) {
      console.warn('⚠️ [VideoPlayer] Missing video ref or hlsPath');
      return;
    }

    const videoUrl = getAppropriateSource();
    console.log('📋 [VideoPlayer] Video URL:', videoUrl);

    // Timeout fallback for buffering state
    const bufferingTimeout = setTimeout(() => {
      console.warn('⚠️ [VideoPlayer] Buffering timeout - forcing stop');
      setIsBuffering(false);
    }, 10000); // 10 seconds timeout

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      });

      hlsRef.current = hls;
      
      console.log('🔄 [VideoPlayer] Loading HLS source...');
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const loadTime = performance.now() - startTime;
        console.log(`✅ [VideoPlayer] HLS manifest loaded in ${loadTime.toFixed(2)}ms`);
        clearTimeout(bufferingTimeout); // Clear timeout
        setIsBuffering(false); // Stop buffering
        if (initialTime > 0) {
          video.currentTime = initialTime;
        }
        if (autoPlay) {
          video.play().catch(err => console.log('Autoplay prevented:', err));
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ [VideoPlayer] HLS error:', data);
        clearTimeout(bufferingTimeout);
        if (data.fatal) {
          setError(`Video error: ${data.type}`);
          setIsBuffering(false);
        }
      });

      return () => {
        console.log('🧹 [VideoPlayer] Cleaning up HLS...');
        clearTimeout(bufferingTimeout);
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      video.addEventListener('loadedmetadata', () => {
        clearTimeout(bufferingTimeout);
        setIsBuffering(false);
        if (initialTime > 0) video.currentTime = initialTime;
      });
      if (autoPlay) {
        video.play().catch(err => console.log('Autoplay prevented:', err));
      }
    } else {
      clearTimeout(bufferingTimeout);
      setError('HLS is not supported in this browser');
      setIsBuffering(false);
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

  // Effect: Load subtitle tracks using Blob URL (Non-blocking)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !subtitles || subtitles.length === 0) return;

    let isMounted = true;
    const blobUrls = []; // Track blob URLs for cleanup

    const loadSubtitlesAsync = async () => {
      console.log(`📝 [VideoPlayer] Loading ${subtitles.length} subtitle(s) asynchronously...`);
      
      // Remove existing tracks
      while (video.textTracks.length > 0) {
        const track = video.textTracks[0];
        const trackElement = video.querySelector(`track[srclang="${track.language}"]`);
        if (trackElement) {
          video.removeChild(trackElement);
        }
      }

      // Load each subtitle
      for (let i = 0; i < subtitles.length; i++) {
        const subtitle = subtitles[i];
        
        try {
          console.log(`🔄 [VideoPlayer] Fetching subtitle: ${subtitle.label}...`);
          
          // Fetch subtitle file asynchronously
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${subtitle.file}`
          );
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const vttText = await response.text();
          
          // Debug: Log VTT content
          console.log(`📝 VTT content preview (first 500 chars):`);
          console.log(vttText.substring(0, 500));
          console.log(`📊 VTT file size: ${vttText.length} characters`);
          
          // Convert SRT to VTT if needed
          let finalVttText = vttText;
          if (!vttText.trim().startsWith('WEBVTT')) {
            console.log('🔄 [VideoPlayer] Converting SRT to VTT format...');
            finalVttText = convertSrtToVtt(vttText);
          }
          
          // Create blob URL from VTT content
          const blob = new Blob([finalVttText], { type: 'text/vtt' });
          const blobUrl = URL.createObjectURL(blob);
          blobUrls.push(blobUrl); // Track for cleanup
          
          if (!isMounted) break; // Stop if component unmounted
          
          // Create track element with blob URL
          const track = document.createElement('track');
          track.kind = 'subtitles';
          track.label = subtitle.label;
          track.srclang = subtitle.language;
          track.src = blobUrl; // ✅ Blob URL = instant, no network request!
          
          // Auto-enable first subtitle
          if (i === 0) {
            track.default = true;
            track.mode = 'showing'; // Auto-enable
            setSubtitleEnabled(true);
          } else {
            track.mode = 'hidden';
          }
          
          video.appendChild(track);
          
          console.log(`✅ [VideoPlayer] Subtitle loaded: ${subtitle.label} (blob URL)`);
          
          // Debug: Log track info after append
          setTimeout(() => {
            if (video.textTracks[i]) {
              const t = video.textTracks[i];
              console.log(`🔍 Track ${i} status:`, {
                label: t.label,
                language: t.language,
                mode: t.mode,
                cues: t.cues?.length || 0,
                activeCues: t.activeCues?.length || 0
              });
            }
          }, 100);
        } catch (error) {
          console.error(`❌ [VideoPlayer] Failed to load subtitle: ${subtitle.label}`, error);
        }
      }
      
      console.log(`✅ [VideoPlayer] All subtitles loaded successfully`);
    };

    // Start loading
    loadSubtitlesAsync();

    // Cleanup function
    return () => {
      isMounted = false;
      // Revoke blob URLs to free memory
      blobUrls.forEach(url => URL.revokeObjectURL(url));
      console.log('🧹 [VideoPlayer] Cleaned up subtitle blob URLs');
    };
  }, [subtitles]);

  // Effect: Toggle subtitle visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.textTracks || video.textTracks.length === 0) return;

    console.log(`📝 [VideoPlayer] Toggling subtitle: ${subtitleEnabled ? 'ON' : 'OFF'}`);
    console.log(`   Available tracks: ${video.textTracks.length}`);

    // Toggle all text tracks
    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      const newMode = subtitleEnabled ? 'showing' : 'hidden';
      console.log(`   Track ${i}: "${track.label}" - ${track.mode} -> ${newMode}`);
      track.mode = newMode;
    }

    console.log(`✅ [VideoPlayer] Subtitle ${subtitleEnabled ? 'enabled' : 'disabled'}`);
  }, [subtitleEnabled]);

  // Effect: Apply subtitle styling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Apply custom CSS to subtitle cues
    const applySubtitleStyles = () => {
      const tracks = video.textTracks;
      if (!tracks || tracks.length === 0) return;

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track.kind === 'subtitles' && track.cues) {
          for (let j = 0; j < track.cues.length; j++) {
            const cue = track.cues[j];
            
            // Apply styles to cue
            cue.line = parseInt(subtitleSettings.position); // Position from bottom
            cue.size = 80; // Width of subtitle area
            cue.align = 'center';
          }
        }
      }
    };

    // Apply styles when cues are loaded
    if (video.textTracks) {
      for (let i = 0; i < video.textTracks.length; i++) {
        const track = video.textTracks[i];
        track.addEventListener('cuechange', applySubtitleStyles);
      }
    }

    applySubtitleStyles();

    return () => {
      if (video && video.textTracks) {
        for (let i = 0; i < video.textTracks.length; i++) {
          const track = video.textTracks[i];
          track.removeEventListener('cuechange', applySubtitleStyles);
        }
      }
    };
  }, [subtitleSettings]);

  // Effect: Save subtitle settings to localStorage
  useEffect(() => {
    localStorage.setItem('subtitleSettings', JSON.stringify(subtitleSettings));
    console.log('💾 Subtitle settings saved to localStorage');
  }, [subtitleSettings]);

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

      // 1080p requires login
      if (quality === '1080p' && !isAuthenticated) {
        setShowAuthModal(true);
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

  const toggleSubtitle = () => {
    setSubtitleEnabled(!subtitleEnabled);
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
      {/* Dynamic Subtitle Styling */}
      <style>{`
        video::cue {
          font-family: ${subtitleSettings.fontFamily} !important;
          font-size: ${subtitleSettings.fontSize} !important;
          color: ${subtitleSettings.color === 'white' ? 'rgba(255,255,255,' + parseInt(subtitleSettings.textOpacity)/100 + ')' :
                  subtitleSettings.color === 'black' ? 'rgba(0,0,0,' + parseInt(subtitleSettings.textOpacity)/100 + ')' :
                  subtitleSettings.color === 'yellow' ? 'rgba(255,255,0,' + parseInt(subtitleSettings.textOpacity)/100 + ')' :
                  subtitleSettings.color === 'blue' ? 'rgba(0,123,255,' + parseInt(subtitleSettings.textOpacity)/100 + ')' :
                  subtitleSettings.color === 'pink' ? 'rgba(255,105,180,' + parseInt(subtitleSettings.textOpacity)/100 + ')' :
                  subtitleSettings.color} !important;
          background-color: ${subtitleSettings.bgColor === 'black' ? 'rgba(0,0,0,' + parseInt(subtitleSettings.bgOpacity)/100 + ')' :
                              subtitleSettings.bgColor === '#333' ? 'rgba(51,51,51,' + parseInt(subtitleSettings.bgOpacity)/100 + ')' :
                              subtitleSettings.bgColor === '#999' ? 'rgba(153,153,153,' + parseInt(subtitleSettings.bgOpacity)/100 + ')' :
                              subtitleSettings.bgColor === 'blue' ? 'rgba(0,123,255,' + parseInt(subtitleSettings.bgOpacity)/100 + ')' :
                              subtitleSettings.bgColor === 'pink' ? 'rgba(255,105,180,' + parseInt(subtitleSettings.bgOpacity)/100 + ')' :
                              subtitleSettings.bgColor === 'white' ? 'rgba(255,255,255,' + parseInt(subtitleSettings.bgOpacity)/100 + ')' :
                              'transparent'} !important;
          text-shadow: ${subtitleSettings.textEdge === 'shadow' ? '2px 2px 4px rgba(0,0,0,0.8)' :
                        subtitleSettings.textEdge === 'raised' ? '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(255,255,255,0.3)' :
                        subtitleSettings.textEdge === 'outline' ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' :
                        'none'} !important;
        }
        
        /* Position subtitle with pixels from bottom */
        video::-webkit-media-text-track-container {
          bottom: ${subtitleSettings.position} !important;
        }
        
        video::cue-region {
          bottom: ${subtitleSettings.position} !important;
        }
      `}</style>

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

        {/* BUFFERING OVERLAY */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
              <p className="text-white text-lg font-medium">Loading video...</p>
            </div>
          </div>
        )}

        {/* CENTER PLAY/PAUSE ICON */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 rounded-full p-6 transition-all hover:bg-black/80">
              <Play size={64} className="text-white" fill="white" />
            </div>
          </div>
        )}

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
            <div className="flex items-center gap-3">
              {/* Settings */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSettings(!showSettings);
                    setSettingsTab(null);
                  }}
                  className="text-white hover:text-red-500 transition flex items-center justify-center w-10 h-10"
                >
                  <Settings size={24} />
                </button>

                {/* Settings Menu */}
                {showSettings && (
                  <div className="absolute bottom-12 right-0 bg-black/95 rounded-lg overflow-hidden min-w-[280px]">
                    {!settingsTab ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-white font-semibold border-b border-gray-700">
                          Cài đặt
                        </div>
                        
                        {qualities && qualities.length > 1 && (
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
                        )}

                        {/* Subtitle Menu - Only show if subtitles available */}
                        {subtitles && subtitles.length > 0 && (
                          <button
                            onClick={() => setSettingsTab('subtitle')}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                          >
                            <span>Phụ đề</span>
                            <span className="text-gray-400 flex items-center gap-2">
                              {subtitleEnabled ? 'Bật' : 'Tắt'}
                              <span>›</span>
                            </span>
                          </button>
                        )}

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
                      <div className="py-2">
                        <div className="px-4 py-2 text-white font-semibold border-b border-gray-700 flex items-center gap-2">
                          <button onClick={() => setSettingsTab(null)} className="hover:text-red-500">
                            ‹
                          </button>
                          <span>Chất lượng</span>
                        </div>
                        
                        {qualities && qualities.length > 1 && (
                          <button
                            onClick={() => handleQualitySelect('auto')}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                          >
                            <span>{getQualityLabel('auto')}</span>
                            {currentQuality === 'auto' && <Check size={20} className="text-yellow-500" />}
                          </button>
                        )}

                        {qualities && qualities.map(q => {
                          const qualityValue = q.quality;
                          const isLocked = !canAccessQuality(qualityValue);
                          
                          let displayLabel = qualityValue;
                          if (qualityValue === 'Upscaled') {
                            displayLabel = '⚡ AI Upscaled';
                          } else if (qualityValue === '1080p') {
                            displayLabel = 'FHD 1080p';
                          } else if (qualityValue === '720p') {
                            displayLabel = 'HD 720p';
                          }
                          
                          return (
                            <button
                              key={qualityValue}
                              onClick={() => handleQualitySelect(qualityValue)}
                              className={`w-full px-4 py-3 text-left hover:bg-white/10 transition flex items-center justify-between ${
                                isLocked ? 'text-gray-500' : 'text-white'
                              }`}
                            >
                              <span>{displayLabel} {isLocked && '🔒'}</span>
                              {currentQuality === qualityValue && <Check size={20} className="text-yellow-500" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : settingsTab === 'speed' ? (
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
                    ) : settingsTab === 'subtitle' ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-white font-semibold border-b border-gray-700 flex items-center gap-2">
                          <button onClick={() => setSettingsTab(null)} className="hover:text-red-500">
                            ‹
                          </button>
                          <span>Phụ đề chính</span>
                        </div>
                        
                        {/* Toggle ON/OFF */}
                        <button
                          onClick={toggleSubtitle}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                        >
                          <span>Phụ đề</span>
                          <span className="flex items-center gap-2">
                            {subtitleEnabled ? (
                              <Check size={20} className="text-green-500" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-500 rounded"></div>
                            )}
                          </span>
                        </button>
                        
                        {/* Divider */}
                        <div className="border-t border-gray-700 my-2"></div>
                        
                        {/* Customization Options */}
                        <button
                          onClick={() => setSettingsTab('subtitle-color')}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                        >
                          <span>Màu chữ</span>
                          <span className="text-gray-400 flex items-center gap-2">
                            {subtitleOptions.colors.find(c => c.value === subtitleSettings.color)?.label}
                            <span>›</span>
                          </span>
                        </button>
                        
                        <button
                          onClick={() => setSettingsTab('subtitle-size')}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                        >
                          <span>Cỡ chữ</span>
                          <span className="text-gray-400 flex items-center gap-2">
                            {subtitleSettings.fontSize}
                            <span>›</span>
                          </span>
                        </button>
                        
                        <button
                          onClick={() => setSettingsTab('subtitle-opacity')}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                        >
                          <span>Độ trong</span>
                          <span className="text-gray-400 flex items-center gap-2">
                            {subtitleSettings.textOpacity}
                            <span>›</span>
                          </span>
                        </button>
                        
                        <button
                          onClick={() => setSettingsTab('subtitle-font')}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                        >
                          <span>Font chữ</span>
                          <span className="text-gray-400 flex items-center gap-2">
                            {subtitleSettings.fontFamily}
                            <span>›</span>
                          </span>
                        </button>
                        
                        <button
                          onClick={() => setSettingsTab('subtitle-edge')}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                        >
                          <span>Viền chữ</span>
                          <span className="text-gray-400 flex items-center gap-2">
                            {subtitleOptions.textEdges.find(e => e.value === subtitleSettings.textEdge)?.label}
                            <span>›</span>
                          </span>
                        </button>
                        
                        <button
                          onClick={() => setSettingsTab('subtitle-bg')}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                        >
                          <span>Màu nền</span>
                          <span className="text-gray-400 flex items-center gap-2">
                            {subtitleOptions.bgColors.find(c => c.value === subtitleSettings.bgColor)?.label}
                            <span>›</span>
                          </span>
                        </button>
                        
                        <button
                          onClick={() => setSettingsTab('subtitle-bg-opacity')}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                        >
                          <span>Độ trong Nền</span>
                          <span className="text-gray-400 flex items-center gap-2">
                            {subtitleSettings.bgOpacity}
                            <span>›</span>
                          </span>
                        </button>
                        
                        <button
                          onClick={() => setSettingsTab('subtitle-position')}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                        >
                          <span>Vị trí</span>
                          <span className="text-gray-400 flex items-center gap-2">
                            {subtitleSettings.position}
                            <span>›</span>
                          </span>
                        </button>
                      </div>
                    ) : settingsTab.startsWith('subtitle-') ? (
                      /* Subtitle Sub-options */
                      <div className="py-2">
                        <div className="px-4 py-2 text-white font-semibold border-b border-gray-700 flex items-center gap-2">
                          <button onClick={() => setSettingsTab('subtitle')} className="hover:text-red-500">
                            ‹
                          </button>
                          <span>
                            {settingsTab === 'subtitle-color' && 'Phụ đề chính / Màu chữ'}
                            {settingsTab === 'subtitle-size' && 'Phụ đề chính / Cỡ chữ'}
                            {settingsTab === 'subtitle-opacity' && 'Phụ đề chính / Độ trong'}
                            {settingsTab === 'subtitle-font' && 'Phụ đề chính / Font chữ'}
                            {settingsTab === 'subtitle-edge' && 'Phụ đề chính / Viền chữ'}
                            {settingsTab === 'subtitle-bg' && 'Phụ đề chính / Màu nền'}
                            {settingsTab === 'subtitle-bg-opacity' && 'Phụ đề chính / Độ trong Nền'}
                            {settingsTab === 'subtitle-position' && 'Phụ đề chính / Vị trí'}
                          </span>
                        </div>
                        
                        {/* Color Options */}
                        {settingsTab === 'subtitle-color' && subtitleOptions.colors.map(color => (
                          <button
                            key={color.value}
                            onClick={() => {
                              setSubtitleSettings(prev => ({ ...prev, color: color.value }));
                              setSettingsTab('subtitle');
                            }}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                          >
                            <span className="flex items-center gap-3">
                              <div 
                                className="w-6 h-6 rounded-full border-2 border-white"
                                style={{ backgroundColor: color.value }}
                              ></div>
                              {color.label}
                            </span>
                            {subtitleSettings.color === color.value && <Check size={20} className="text-yellow-500" />}
                          </button>
                        ))}
                        
                        {/* Font Size Options */}
                        {settingsTab === 'subtitle-size' && subtitleOptions.fontSizes.map(size => (
                          <button
                            key={size}
                            onClick={() => {
                              setSubtitleSettings(prev => ({ ...prev, fontSize: size }));
                              setSettingsTab('subtitle');
                            }}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                          >
                            <span>{size}</span>
                            {subtitleSettings.fontSize === size && <Check size={20} className="text-yellow-500" />}
                          </button>
                        ))}
                        
                        {/* Text Opacity Options */}
                        {settingsTab === 'subtitle-opacity' && subtitleOptions.opacities.map(opacity => (
                          <button
                            key={opacity}
                            onClick={() => {
                              setSubtitleSettings(prev => ({ ...prev, textOpacity: opacity }));
                              setSettingsTab('subtitle');
                            }}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                          >
                            <span>{opacity}</span>
                            {subtitleSettings.textOpacity === opacity && <Check size={20} className="text-yellow-500" />}
                          </button>
                        ))}
                        
                        {/* Font Family Options */}
                        {settingsTab === 'subtitle-font' && subtitleOptions.fontFamilies.map(font => (
                          <button
                            key={font}
                            onClick={() => {
                              setSubtitleSettings(prev => ({ ...prev, fontFamily: font }));
                              setSettingsTab('subtitle');
                            }}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                            style={{ fontFamily: font }}
                          >
                            <span>{font}</span>
                            {subtitleSettings.fontFamily === font && <Check size={20} className="text-yellow-500" />}
                          </button>
                        ))}
                        
                        {/* Text Edge Options */}
                        {settingsTab === 'subtitle-edge' && subtitleOptions.textEdges.map(edge => (
                          <button
                            key={edge.value}
                            onClick={() => {
                              setSubtitleSettings(prev => ({ ...prev, textEdge: edge.value }));
                              setSettingsTab('subtitle');
                            }}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                          >
                            <span>{edge.label}</span>
                            {subtitleSettings.textEdge === edge.value && <Check size={20} className="text-yellow-500" />}
                          </button>
                        ))}
                        
                        {/* Background Color Options */}
                        {settingsTab === 'subtitle-bg' && subtitleOptions.bgColors.map(color => (
                          <button
                            key={color.value}
                            onClick={() => {
                              setSubtitleSettings(prev => ({ ...prev, bgColor: color.value }));
                              setSettingsTab('subtitle');
                            }}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                          >
                            <span className="flex items-center gap-3">
                              <div 
                                className="w-6 h-6 rounded border-2 border-white"
                                style={{ backgroundColor: color.value }}
                              ></div>
                              {color.label}
                            </span>
                            {subtitleSettings.bgColor === color.value && <Check size={20} className="text-yellow-500" />}
                          </button>
                        ))}
                        
                        {/* Background Opacity Options */}
                        {settingsTab === 'subtitle-bg-opacity' && subtitleOptions.opacities.map(opacity => (
                          <button
                            key={opacity}
                            onClick={() => {
                              setSubtitleSettings(prev => ({ ...prev, bgOpacity: opacity }));
                              setSettingsTab('subtitle');
                            }}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                          >
                            <span>{opacity}</span>
                            {subtitleSettings.bgOpacity === opacity && <Check size={20} className="text-yellow-500" />}
                          </button>
                        ))}
                        
                        {/* Position Options */}
                        {settingsTab === 'subtitle-position' && subtitleOptions.positions.map(position => (
                          <button
                            key={position}
                            onClick={() => {
                              setSubtitleSettings(prev => ({ ...prev, position: position }));
                              setSettingsTab('subtitle');
                            }}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                          >
                            <span>{position}</span>
                            {subtitleSettings.position === position && <Check size={20} className="text-yellow-500" />}
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
                className="text-white hover:text-red-500 transition flex items-center justify-center w-10 h-10"
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

// Memoize component to prevent unnecessary re-renders
export default memo(VideoPlayer);
