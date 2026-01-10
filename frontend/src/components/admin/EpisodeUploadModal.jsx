import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import EpisodeSelector from './EpisodeSelector'
import { X } from 'lucide-react'

function EpisodeUploadModal({ uploadData, setUploadData, onNext, onBack, setError, setSuccess }) {
  const [showModal, setShowModal] = useState(false)
  const [episodeData, setEpisodeData] = useState({
    episodeNumber: 1,
    videoFile: null,
    subtitleFiles: []
  })
  const [selectedEpisode, setSelectedEpisode] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [localError, setLocalError] = useState('')
  const fileInputRef = useRef(null)
  const subtitleInputRef = useRef(null)
  const modalRef = useRef(null)

  const handleEpisodeSelect = (episodeSelection) => {
    console.log('🎯 Episode selected:', episodeSelection)
    setSelectedEpisode(episodeSelection)
    setEpisodeData({
      episodeNumber: episodeSelection.episodeNumber,
      videoFile: null,
      subtitleFiles: []
    })
    setShowModal(true)
    setLocalError('')
  }

  const closeModal = () => {
    if (uploading && !confirm('Upload in progress. Cancel?')) return
    setShowModal(false)
    setSelectedEpisode(null)
    setEpisodeData({ episodeNumber: 1, videoFile: null, subtitleFiles: [] })
    setUploadProgress(0)
    setLocalError('')
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) closeModal()
    }
    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [showModal, uploading])

  const handleVideoFile = (file) => {
    if (file.size > 5 * 1024 * 1024 * 1024) {
      setLocalError('Video must be < 5GB')
      return
    }
    const allowed = ['video/mp4', 'video/x-matroska', 'video/quicktime']
    const ext = ['.mp4', '.mkv', '.mov']
    if (!allowed.includes(file.type) && !ext.some(e => file.name.toLowerCase().endsWith(e))) {
      setLocalError('Only MP4, MKV, MOV')
      return
    }
    setEpisodeData(prev => ({ ...prev, videoFile: file }))
    setLocalError('')
  }

  const handleSubtitleFiles = (files) => {
    const subs = Array.from(files).filter(f => 
      ['.srt', '.vtt', '.ass'].some(e => f.name.toLowerCase().endsWith(e))
    )
    if (!subs.length) {
      setLocalError('No valid subtitles')
      return
    }
    setEpisodeData(prev => ({ ...prev, subtitleFiles: [...prev.subtitleFiles, ...subs] }))
    setLocalError('')
  }

  const uploadEpisode = async () => {
    if (uploading) return
    
    // Validation: Phải có ít nhất 1 trong 2: video hoặc subtitle
    if (!episodeData.videoFile && episodeData.subtitleFiles.length === 0) {
      setLocalError('Either video or subtitle file is required')
      return
    }

    setUploading(true)
    setLocalError('')
    setUploadProgress(0)

    try {
      const isReplacement = selectedEpisode?.isExisting && selectedEpisode?.episodeId
      const formData = new FormData()
      
      // Thêm video file nếu có
      if (episodeData.videoFile) {
        formData.append('videoFile', episodeData.videoFile)
      }
      
      // Thêm subtitle files nếu có
      if (episodeData.subtitleFiles.length > 0) {
        episodeData.subtitleFiles.forEach(file => formData.append('subtitleFiles', file))
      }
      
      let response

      if (isReplacement) {
        // UPDATE existing episode
        response = await api.put(`/episodes/admin/${selectedEpisode.episodeId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total))
        })
      } else {
        // CREATE new episode
        formData.append('seriesId', uploadData.series._id)
        formData.append('seasonId', uploadData.season._id)
        formData.append('episodeNumber', episodeData.episodeNumber)
        formData.append('title', `Episode ${episodeData.episodeNumber}`)
        
        response = await api.post('/episodes/admin', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total))
        })
      }

      if (response.data.success) {
        const successMsg = isReplacement ? 
          (episodeData.videoFile && episodeData.subtitleFiles.length > 0 ? 'Episode video & subtitle updated!' :
           episodeData.videoFile ? 'Episode video replaced!' : 'Episode subtitle updated!') :
          'Episode uploaded!'
        
        setSuccess(successMsg)
        setUploadData(prev => ({ 
          ...prev, 
          episode: response.data.data || { _id: selectedEpisode.episodeId },
          processingId: response.data.processingId || response.data.jobId
        }))
        closeModal()
        setTimeout(() => { setSuccess(''); onNext() }, 2000)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setLocalError(err.response?.data?.error || err.message || 'Upload failed')
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteEpisode = async () => {
    if (!selectedEpisode?.isExisting || !selectedEpisode?.episodeId) {
      setLocalError('Cannot delete: No episode selected')
      return
    }

    const confirmMessage = `Are you sure you want to delete Episode ${episodeData.episodeNumber}?\n\nThis will permanently delete the video file and cannot be undone!`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setUploading(true)
      const response = await api.delete(`/episodes/admin/${selectedEpisode.episodeId}`)
      
      if (response.data.success) {
        setSuccess(`Episode ${episodeData.episodeNumber} deleted successfully!`)
        closeModal()
        // Refresh episode list by re-mounting EpisodeSelector
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      console.error('❌ Delete episode error:', error)
      setLocalError(error.response?.data?.error || 'Failed to delete episode')
    } finally {
      setUploading(false)
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Episode</h2>
      
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-indigo-800 font-medium">📺 {uploadData.series?.title}</p>
            <p className="text-indigo-600 text-sm">{uploadData.series?.originalTitle}</p>
          </div>
          <div>
            <p className="text-indigo-800 font-medium">🎬 {uploadData.season?.title}</p>
            <p className="text-indigo-600 text-sm">{uploadData.season?.seasonType?.toUpperCase()} • {uploadData.season?.releaseYear}</p>
          </div>
        </div>
      </div>

      <EpisodeSelector 
        seasonId={uploadData.season?._id}
        onEpisodeSelect={handleEpisodeSelect}
        selectedEpisode={selectedEpisode}
        key={uploadData.season?._id}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedEpisode?.isExisting ? '🔄 Replace' : '📤 Upload'} Episode {episodeData.episodeNumber}
                </h3>
                {selectedEpisode?.isExisting && <p className="text-sm text-orange-600 mt-1">⚠️ Video will be replaced</p>}
              </div>
              <button onClick={closeModal} disabled={uploading} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Episode Number</label>
                <input type="number" value={episodeData.episodeNumber} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video File {!selectedEpisode?.isExisting && '*'}</label>
                {!episodeData.videoFile ? (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed rounded-lg p-4 hover:border-indigo-400 hover:bg-indigo-50">
                    <p className="text-gray-600">📹 Click to select video</p>
                    <p className="text-xs text-gray-400 mt-1">MP4, MKV, MOV • Max 5GB</p>
                    <input ref={fileInputRef} type="file" accept="video/*,.mp4,.mkv,.mov" onChange={(e) => e.target.files[0] && handleVideoFile(e.target.files[0])} className="hidden" />
                  </button>
                ) : (
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="font-medium text-sm">{episodeData.videoFile.name}</p>
                      <p className="text-xs text-gray-500">{formatSize(episodeData.videoFile.size)}</p>
                    </div>
                    <button onClick={() => setEpisodeData(prev => ({ ...prev, videoFile: null }))} className="text-red-600 hover:bg-red-50 p-1 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitles (Optional)</label>
                {episodeData.subtitleFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between border rounded-lg p-2 mb-2">
                    <p className="text-sm">{file.name}</p>
                    <button onClick={() => setEpisodeData(prev => ({ ...prev, subtitleFiles: prev.subtitleFiles.filter((_, idx) => idx !== i) }))} className="text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => subtitleInputRef.current?.click()} className="w-full border border-dashed rounded-lg p-2 hover:border-indigo-400 hover:bg-indigo-50 text-sm">
                  + Add Subtitle (.srt, .vtt, .ass)
                  <input ref={subtitleInputRef} type="file" accept=".srt,.vtt,.ass" multiple onChange={(e) => e.target.files.length > 0 && handleSubtitleFiles(e.target.files)} className="hidden" />
                </button>
              </div>

              {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blue-800 font-medium">Uploading...</span>
                    <span className="text-blue-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {localError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {localError}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-between items-center">
              {/* Left side - Delete button (only for existing episodes) */}
              <div>
                {selectedEpisode?.isExisting && selectedEpisode?.episodeId && (
                  <button
                    onClick={handleDeleteEpisode}
                    disabled={uploading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Episode
                  </button>
                )}
              </div>

              {/* Right side - Cancel & Upload/Replace buttons */}
              <div className="flex space-x-3">
                <button onClick={closeModal} disabled={uploading} className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={uploadEpisode} disabled={uploading || (!episodeData.videoFile && episodeData.subtitleFiles.length === 0)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {uploading ? `Uploading ${uploadProgress}%` : 
                   selectedEpisode?.isExisting ? 
                     (episodeData.videoFile && episodeData.subtitleFiles.length > 0 ? 'Update Video & Subtitle' :
                      episodeData.videoFile ? 'Replace Video' : 'Update Subtitle') :
                   'Upload Episode'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <button onClick={onBack} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium">
          ← Back to Season
        </button>
      </div>
    </div>
  )
}

export default EpisodeUploadModal
