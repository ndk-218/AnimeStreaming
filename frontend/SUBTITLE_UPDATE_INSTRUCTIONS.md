# SUBTITLE FEATURE - Frontend Update Instructions

## File: D:\DoAn\frontend\src\components\common\VideoPlayer.jsx

---

## STEP 1: Add Subtitle Effect (sau effect Watch progress tracking - line ~240)

Thêm effect này sau effect `Watch progress tracking`:

```javascript
  // Effect: Load subtitle tracks
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !subtitles || subtitles.length === 0) return;

    // Remove existing tracks
    while (video.textTracks.length > 0) {
      const track = video.textTracks[0];
      const trackElement = video.querySelector(`track[src="${track.src}"]`);
      if (trackElement) {
        video.removeChild(trackElement);
      }
    }

    // Add new subtitle tracks
    subtitles.forEach((subtitle, index) => {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = subtitle.label;
      track.srclang = subtitle.language;
      track.src = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${subtitle.file}`;
      
      // Set first track as default but disabled initially
      if (index === 0) {
        track.default = false; // Don't show by default
      }
      
      video.appendChild(track);
    });

    console.log(`📝 Loaded ${subtitles.length} subtitle track(s)`);
  }, [subtitles]);

  // Effect: Toggle subtitle visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.textTracks || video.textTracks.length === 0) return;

    // Toggle all text tracks
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = subtitleEnabled ? 'showing' : 'hidden';
    }

    console.log(`📝 Subtitle ${subtitleEnabled ? 'enabled' : 'disabled'}`);
  }, [subtitleEnabled]);
```

---

## STEP 2: Add Subtitle Toggle Handler (sau handleSpeedSelect function - line ~375)

Thêm function này sau `handleSpeedSelect`:

```javascript
  const toggleSubtitle = () => {
    setSubtitleEnabled(!subtitleEnabled);
    setShowSettings(false);
    setSettingsTab(null);
  };
```

---

## STEP 3: Update Settings Menu - Replace subtitle button (line ~490)

Tìm button "Phụ đề" bị disabled và thay thế bằng:

```javascript
                        {/* Subtitle Button - Only show if subtitles available */}
                        {subtitles && subtitles.length > 0 && (
                          <button
                            onClick={toggleSubtitle}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center justify-between"
                          >
                            <span>Phụ đề</span>
                            <span className="text-gray-400 flex items-center gap-2">
                              {subtitleEnabled ? 'Bật' : 'Tắt'}
                              {subtitleEnabled && <Check size={20} className="text-green-500" />}
                            </span>
                          </button>
                        )}
```

---

## NOTES:

1. **Subtitle Format**: Backend lưu subtitle với path: `uploads/videos/{episodeId}/subtitles/vi.vtt`
2. **Default Behavior**: Subtitle mặc định TẮT (disabled)
3. **Toggle**: Click button "Phụ đề" trong settings để bật/tắt
4. **Support**: Chỉ hiển thị button nếu episode có subtitle

---

## Testing:

1. Upload episode với subtitle file (.vtt, .srt, .ass)
2. Watch episode
3. Click Settings icon
4. Click "Phụ đề" button
5. Subtitle sẽ hiển thị trên video

---

## Troubleshooting:

Nếu subtitle không hiển thị:
1. Check console log xem có "📝 Loaded X subtitle track(s)" không
2. Kiểm tra Network tab xem có load file subtitle không
3. Verify subtitle file path trong database
4. Check subtitle file format (phải là valid .vtt format)
