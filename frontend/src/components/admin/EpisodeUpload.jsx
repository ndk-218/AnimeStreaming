import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import EpisodeSelector from './EpisodeSelector'

// Enhanced Episode Upload Component
function EpisodeUpload({ uploadData, setUploadData, onNext, onBack, setError, setSuccess }) {
  const [episodeData, setEpisodeData] = useState({
    title: '',
    episodeNumber: 1,
    description: '',
    videoFile: null,
    subtitleFiles: []
  })
  const [selectedEpisode, setSelectedEpisode] = useState(null) // For episode selector
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [existingEpisodes, setExistingEpisodes] = useState([])
  const [loadingEpisodes, setLoadingEpisodes] = useState(true)
  const fileInputRef = useRef(null)
  const subtitleInputRef = useRef(null)

  // Handle episode selection from selector
  const handleEpisodeSelect = (episodeSelection) => {
    console.log('🎯 Episode selected:', episodeSelection)
    
    setSelectedEpisode(episodeSelection)
    setEpisodeData(prev => ({
      ...prev,
      episodeNumber: episodeSelection.episodeNumber,
      title: episodeSelection.title,
      description: episodeSelection.description || ''
    }))
    
    // Clear any existing error
    setError('')
    
    // Show different messages for new vs existing episodes
    if (episodeSelection.isExisting) {
      setSuccess(`Selected Episode ${episodeSelection.episodeNumber} for replacement`)
    } else {
      setSuccess(`Ready to upload Episode ${episodeSelection.episodeNumber}`)
    }
    setTimeout(() => setSuccess(''), 3000)
  }

  // Refresh episode list
  const refreshEpisodeList = () => {
    if (uploadData.season?._id) {
      fetchExistingEpisodes()
    }
  }

  // Fetch existing episodes for this season
  useEffect(() => {
    if (uploadData.season?._id) {
      fetchExistingEpisodes()
    }
  }, [uploadData.season])

  // Auto-suggest next episode number when episodes are loaded
  useEffect(() => {
    if (existingEpisodes.length >= 0) {
      const nextNumber = getNextEpisodeNumber()
      setEpisodeData(prev => ({
        ...prev,
        episodeNumber: nextNumber
      }))
    }
  }, [existingEpisodes])

  const fetchExistingEpisodes = async () => {
    try {
      setLoadingEpisodes(true)
      const response = await api.get(`/episodes/season/${uploadData.season._id}?includeProcessing=true`)
      setExistingEpisodes(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch episodes:', error)
      setExistingEpisodes([])
    } finally {
      setLoadingEpisodes(false)
    }
  }

  const getNextEpisodeNumber = () => {
    if (existingEpisodes.length === 0) return 1
    const maxNumber = Math.max(...existingEpisodes.map(ep => ep.episodeNumber || 0))
    return maxNumber + 1
  }

  // Drag & Drop handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    const videoFile = files.find(file => 
      file.type.startsWith('video/') || 
      file.name.toLowerCase().endsWith('.mp4') ||
      file.name.toLowerCase().endsWith('.mkv')
    )
    
    if (videoFile) {
      handleVideoFile(videoFile)
    } else {
      setError('Please drop a valid video file (MP4 or MKV)')
    }
  }

  const handleVideoFile = (file) => {
    // Validate file size (max 5GB)
    const maxSize = 5 * 1024 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Video file size must be less than 5GB')
      return
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/x-matroska', 'video/quicktime']
    const allowedExtensions = ['.mp4', '.mkv', '.mov']
    const fileName = file.name.toLowerCase()
    const isValidType = allowedTypes.includes(file.type) || 
                       allowedExtensions.some(ext => fileName.endsWith(ext))

    if (!isValidType) {
      setError('Only MP4, MKV, and MOV video files are supported')
      return
    }

    // Auto-generate title from filename if empty
    if (!episodeData.title.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      const cleanTitle = nameWithoutExt
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
      
      setEpisodeData(prev => ({ ...prev, title: cleanTitle }))
    }

    setEpisodeData(prev => ({ ...prev, videoFile: file }))
    setError('')
  }

  const handleSubtitleFiles = (files) => {
    const subtitleFiles = Array.from(files).filter(file => {
      const fileName = file.name.toLowerCase()
      return fileName.endsWith('.srt') || 
             fileName.endsWith('.vtt') || 
             fileName.endsWith('.ass')
    })

    if (subtitleFiles.length === 0) {
      setError('No valid subtitle files found. Supported: .srt, .vtt, .ass')
      return
    }

    setEpisodeData(prev => ({ 
      ...prev, 
      subtitleFiles: [...prev.subtitleFiles, ...subtitleFiles]
    }))
    setError('')
  }

  const removeSubtitle = (index) => {
    setEpisodeData(prev => ({
      ...prev,
      subtitleFiles: prev.subtitleFiles.filter((_, i) => i !== index)
    }))
  }

  const uploadEpisode = async () => {
    // Prevent double submission
    if (uploading) {
      console.log('⚠️ Upload already in progress, ignoring duplicate request');
      return;
    }

    // Validation
    if (!episodeData.title.trim()) {
      setError('Episode title is required')
      return
    }

    if (!episodeData.episodeNumber || episodeData.episodeNumber < 1) {
      setError('Valid episode number is required')
      return
    }

    if (!episodeData.videoFile) {
      setError('Video file is required')
      return
    }

    // Check for duplicate episode number (only if not replacing existing)
    if (!selectedEpisode?.isExisting) {
      const duplicateEpisode = existingEpisodes.find(ep => 
        ep.episodeNumber === episodeData.episodeNumber
      )
      if (duplicateEpisode) {
        setError(`Episode ${episodeData.episodeNumber} already exists in this season. Select it from the episode grid to replace it.`)
        return
      }
    }

    setUploading(true)
    setError('')
    setUploadProgress(0)

    try {
      const isReplacement = selectedEpisode?.isExisting && selectedEpisode?.episodeId;
      console.log(`🚀 Starting episode ${isReplacement ? 'replacement' : 'upload'}...`);
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('videoFile', episodeData.videoFile)
      
      let response;
      
      if (isReplacement) {
        // ✅ REPLACE EXISTING EPISODE - PUT endpoint
        console.log(`🔄 Replacing episode ID: ${selectedEpisode.episodeId}`);
        
        response = await api.put(
          `/episodes/admin/${selectedEpisode.episodeId}/video`, 
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setUploadProgress(progress)
              console.log(`📊 Upload progress: ${progress}%`);
            }
          }
        );
      } else {
        // ✅ CREATE NEW EPISODE - POST endpoint
        console.log('📝 Creating new episode');
        
        formData.append('seriesId', uploadData.series._id)
        formData.append('seasonId', uploadData.season._id)
        formData.append('title', episodeData.title.trim())
        formData.append('episodeNumber', episodeData.episodeNumber)
        formData.append('description', episodeData.description.trim() || '')
        
        // Add subtitle files
        episodeData.subtitleFiles.forEach((file, index) => {
          formData.append('subtitleFiles', file)
        })
        
        response = await api.post('/episodes/admin', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(progress)
            console.log(`📊 Upload progress: ${progress}%`);
          }
        });
      }

      if (response.data.success) {
        console.log('✅ Upload completed successfully');
        const successMessage = isReplacement ? 
          `Episode "${episodeData.title}" replaced successfully!` : 
          `Episode "${episodeData.title}" uploaded successfully!`;
          
        setSuccess(successMessage);
        setUploadData(prev => ({ 
          ...prev, 
          episode: response.data.data || { _id: selectedEpisode.episodeId },
          processingId: response.data.processingId || response.data.jobId
        }))
        
        // Clear selected episode to reset form
        setSelectedEpisode(null);
        
        // Refresh episode list to show updated count
        setTimeout(() => {
          refreshEpisodeList();
        }, 1000);
        
        // Auto proceed to processing step
        setTimeout(() => {
          setSuccess('')
          onNext()
        }, 2000)
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      
      // Debug: Log full error details
      if (error.response) {
        console.error('📋 Error Response Data:', error.response.data);
        console.error('📋 Error Status:', error.response.status);
        console.error('📋 Error Headers:', error.response.headers);
      }
      
      const errorMsg = error.response?.data?.error || error.message || 'Failed to upload episode';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setEpisodeData({
      title: '',
      episodeNumber: getNextEpisodeNumber(),
      description: '',
      videoFile: null,
      subtitleFiles: []
    })
    setUploadProgress(0)
    setError('')
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Episode</h2>
      
      {/* Selected Series & Season Info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v2h4c.6 0 1 .4 1 1s-.4 1-1 1h-1v14c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1V6H3c-.6 0-1-.4-1-1s.4-1 1-1h4z" />
            </svg>
            <div>
              <p className="text-indigo-800 font-medium">Series: {uploadData.series?.title}</p>
              <p className="text-indigo-600 text-sm">{uploadData.series?.originalTitle}</p>
            </div>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <div>
              <p className="text-indigo-800 font-medium">Season: {uploadData.season?.title}</p>
              <p className="text-indigo-600 text-sm">{uploadData.season?.seasonType?.toUpperCase()} • {uploadData.season?.releaseYear}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Episode Selector */}
      <div className="mb-8">
        <EpisodeSelector 
          seasonId={uploadData.season?._id}
          onEpisodeSelect={handleEpisodeSelect}
          selectedEpisode={selectedEpisode}
          key={uploadData.season?._id} // Force re-mount when season changes
        />
      </div>

      {/* Only show upload form if episode is selected */}
      {selectedEpisode && (
        <div className="space-y-6">
          {/* Episode Metadata */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedEpisode.isExisting ? 
                  `Replace Episode ${selectedEpisode.episodeNumber}` : 
                  `Upload Episode ${selectedEpisode.episodeNumber}`
                }
              </h3>
              
              {selectedEpisode.isExisting && (
                <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                  ⚠️  Existing episode will be replaced
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Episode Number *
                </label>
                <input
                  type="number"
                  value={episodeData.episodeNumber}
                  onChange={(e) => setEpisodeData(prev => ({ ...prev, episodeNumber: parseInt(e.target.value) }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  min="1"
                  max="999"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Episode Title *
                </label>
                <input
                  type="text"
                  value={episodeData.title}
                  onChange={(e) => setEpisodeData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="Enter episode title"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={episodeData.description}
                onChange={(e) => setEpisodeData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Brief description of this episode"
              />
            </div>
          </div>

          {/* Video File Upload */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Video File *</h3>
            
            {!episodeData.videoFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  dragActive 
                    ? 'border-indigo-400 bg-indigo-50' 
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
              >
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4V2c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v2h4c.6 0 1 .4 1 1s-.4 1-1 1h-1v14c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1V6H3c-.6 0-1-.4-1-1s.4-1 1-1h4zM9 8v6l4-3-4-3z" />
                </svg>
                <h4 className="text-lg font-medium text-gray-700 mb-2">
                  {dragActive ? 'Drop video file here' : 'Upload Video File'}
                </h4>
                <p className="text-gray-500 mb-4">
                  Drag and drop your video file here, or click to browse
                </p>
                <p className="text-sm text-gray-400">
                  Supported formats: MP4, MKV, MOV • Max size: 5GB
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/x-matroska,video/quicktime,.mp4,.mkv,.mov"
                  onChange={(e) => e.target.files[0] && handleVideoFile(e.target.files[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">{episodeData.videoFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(episodeData.videoFile.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEpisodeData(prev => ({ ...prev, videoFile: null }))}
                    className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Subtitle Files Upload */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Subtitle Files (Optional)</h3>
            
            <div className="space-y-3">
              {episodeData.subtitleFiles.length > 0 && (
                <div className="space-y-2">
                  {episodeData.subtitleFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <svg className="w-6 h-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeSubtitle(index)}
                        className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => subtitleInputRef.current?.click()}
                className="w-full border border-gray-300 border-dashed rounded-lg p-4 text-center hover:border-indigo-400 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-gray-600">Add Subtitle Files</p>
                <p className="text-sm text-gray-400">Supported: .srt, .vtt, .ass</p>
                
                <input
                  ref={subtitleInputRef}
                  type="file"
                  accept=".srt,.vtt,.ass"
                  multiple
                  onChange={(e) => e.target.files.length > 0 && handleSubtitleFiles(e.target.files)}
                  className="hidden"
                />
              </button>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-800 font-medium">Uploading Episode</span>
                <span className="text-blue-600 text-sm">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-blue-600 text-sm mt-2">
                Please don't close this page while uploading...
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                * Required fields • Video processing will begin after upload
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={onBack}
                  disabled={uploading}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Season
                </button>
                <button
                  onClick={resetForm}
                  disabled={uploading}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Reset Form
                </button>
                <button
                  onClick={uploadEpisode}
                  disabled={uploading || !episodeData.title.trim() || !episodeData.videoFile || !episodeData.episodeNumber}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg disabled:opacity-50 hover:shadow-lg transition-all disabled:hover:shadow-none flex items-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading... {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Episode & Continue
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EpisodeUpload
