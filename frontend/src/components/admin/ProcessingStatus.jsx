import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import api from '../../services/api'

function ProcessingStatus({ uploadData, onComplete, setError }) {
  const [processingStatus, setProcessingStatus] = useState('pending')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('Initializing...')
  const [logs, setLogs] = useState([])
  const [socket, setSocket] = useState(null)
  const [estimatedTime, setEstimatedTime] = useState(null)
  const [startTime] = useState(Date.now())

  const episodeId = uploadData?.episode?._id || uploadData?.processingId

  // Add log helper
  const addLog = (message, level = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date(),
      level,
      message
    }])
  }

  // Connect to Socket.IO for real-time updates
  useEffect(() => {
    if (!episodeId) {
      addLog('Missing episode ID', 'error')
      return
    }

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const newSocket = io(socketUrl)

    newSocket.on('connect', () => {
      console.log('✅ Socket connected')
      addLog('Connected to processing server', 'success')
      newSocket.emit('join-processing', episodeId)
    })

    newSocket.on('processing-progress', (data) => {
      console.log('📊 Progress update:', data)
      setProcessingProgress(data.progress)
      setCurrentStep(data.step || 'Processing...')
      if (data.message) addLog(data.message, 'info')
    })

    newSocket.on('processing-complete', (data) => {
      console.log('✅ Processing complete:', data)
      setProcessingStatus('completed')
      setProcessingProgress(100)
      setCurrentStep('Processing Complete!')
      addLog('Video processing completed successfully', 'success')
    })

    newSocket.on('processing-error', (data) => {
      console.error('❌ Processing error:', data)
      setProcessingStatus('failed')
      addLog(data.error || 'Processing failed', 'error')
      setError(data.error || 'Video processing failed')
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      addLog('Disconnected from server', 'warning')
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [episodeId])

  // Poll for status if Socket.IO not working
  useEffect(() => {
    if (!episodeId || processingStatus === 'completed') return

    const pollInterval = setInterval(async () => {
      try {
        // ✅ FIX: Sử dụng đúng endpoint /processing-status
        const response = await api.get(`/episodes/admin/${episodeId}/processing-status`)
        
        // Response structure: { success: true, data: { episode: {...}, job: {...} } }
        const episodeData = response.data.data.episode
        
        if (episodeData.processingStatus === 'completed') {
          setProcessingStatus('completed')
          setProcessingProgress(100)
          setCurrentStep('Processing Complete!')
          addLog('Video ready for streaming', 'success')
          clearInterval(pollInterval)
        } else if (episodeData.processingStatus === 'failed') {
          setProcessingStatus('failed')
          addLog('Processing failed - check worker logs', 'error')
          clearInterval(pollInterval)
        } else if (episodeData.processingStatus === 'processing') {
          setProcessingStatus('processing')
          if (processingProgress < 90) {
            setProcessingProgress(prev => Math.min(prev + 5, 90))
          }
        }
      } catch (error) {
        console.error('Failed to poll status:', error)
        // ⚠️ Nếu worker đã hoàn thành quá nhanh và job không còn trong queue
        // thì sẽ có error, nhưng không cần báo lỗi cho user
        if (error.response?.status !== 404) {
          addLog('Failed to check processing status', 'warning')
        }
      }
    }, 3000) // Poll mỗi 3 giây

    return () => clearInterval(pollInterval)
  }, [episodeId, processingStatus, processingProgress])

  // Calculate elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setEstimatedTime(elapsed)
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime])

  const formatTime = (seconds) => {
    if (!seconds) return '0s'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const getStatusColor = () => {
    switch (processingStatus) {
      case 'completed': return 'green'
      case 'failed': return 'red'
      case 'processing': return 'blue'
      default: return 'yellow'
    }
  }

  const getStatusIcon = () => {
    switch (processingStatus) {
      case 'completed': return '✅'
      case 'failed': return '❌'
      case 'processing': return '⚙️'
      default: return '⏳'
    }
  }

  if (!uploadData?.episode && !uploadData?.processingId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-700 font-semibold mb-2">⚠️ Missing Episode Data</h3>
        <p className="text-red-600">Episode data is missing. Please try uploading again.</p>
        <button onClick={onComplete} className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
          Back to Upload
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Video Processing</h2>
      
      {/* Episode Info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-indigo-800 font-medium">
                {uploadData.series?.title} - {uploadData.season?.title}
              </p>
              <p className="text-indigo-600 text-sm">
                Episode {uploadData.episode?.episodeNumber}: {uploadData.episode?.title}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${getStatusColor()}-100 text-${getStatusColor()}-700`}>
            {getStatusIcon()} {processingStatus === 'completed' ? 'Complete' : processingStatus === 'failed' ? 'Failed' : 'Processing'}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">{currentStep}</h3>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600">{processingProgress}%</span>
            {estimatedTime && <span className="text-gray-500">⏱️ {formatTime(estimatedTime)}</span>}
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              processingStatus === 'completed' ? 'bg-green-500' :
              processingStatus === 'failed' ? 'bg-red-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${processingProgress}%` }}
          >
            {processingStatus === 'processing' && (
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
            )}
          </div>
        </div>

        {processingStatus === 'processing' && (
          <p className="text-sm text-gray-500 mt-2">
            Converting video to HLS format... This may take several minutes depending on video size.
          </p>
        )}
      </div>

      {/* Processing Logs */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Processing Logs</h3>
        <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-50 rounded p-3">
          {logs.map((log, index) => (
            <div key={index} className="flex items-start text-sm">
              <div className={`w-2 h-2 rounded-full mt-1.5 mr-3 flex-shrink-0 ${
                log.level === 'success' ? 'bg-green-500' :
                log.level === 'error' ? 'bg-red-500' :
                log.level === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-gray-700">{log.message}</p>
                <p className="text-xs text-gray-400">{log.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-gray-500 text-sm italic">Waiting for processing to start...</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        {processingStatus === 'completed' && (
          <div className="text-sm text-green-600 font-medium">
            ✅ Episode ready for streaming!
          </div>
        )}
        {processingStatus === 'failed' && (
          <div className="text-sm text-red-600 font-medium">
            ❌ Processing failed. Check worker logs for details.
          </div>
        )}
        {processingStatus !== 'completed' && processingStatus !== 'failed' && (
          <div className="text-sm text-gray-500">
            Processing in progress... Please wait.
          </div>
        )}
        
        <button
          onClick={onComplete}
          disabled={processingStatus === 'processing'}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {processingStatus === 'completed' ? 'Upload Another Episode' : 'Back to Upload'}
        </button>
      </div>
    </div>
  )
}

export default ProcessingStatus