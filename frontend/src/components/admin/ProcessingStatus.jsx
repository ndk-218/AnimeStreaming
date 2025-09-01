import { useState, useEffect } from 'react'
import api from '../../services/api'

// Video Processing Status Component with Real-time Updates
function ProcessingStatus({ uploadData, onComplete, setError }) {
  const [processingStatus, setProcessingStatus] = useState('pending')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('Initializing...')
  const [processingLogs, setProcessingLogs] = useState([])
  const [estimatedTime, setEstimatedTime] = useState(null)

  const processingSteps = [
    { key: 'pending', label: 'Upload Complete', description: 'File uploaded successfully' },
    { key: 'processing', label: 'Video Analysis', description: 'Analyzing video metadata and format' },
    { key: 'converting', label: 'Format Conversion', description: 'Converting to streaming format (HLS)' },
    { key: 'quality_generation', label: 'Quality Generation', description: 'Creating 480p and 1080p versions' },
    { key: 'subtitle_processing', label: 'Subtitle Processing', description: 'Processing subtitle files' },
    { key: 'finalization', label: 'Finalization', description: 'Creating playlists and cleanup' },
    { key: 'completed', label: 'Processing Complete', description: 'Episode ready for streaming' }
  ]

  // Simulate processing progress (realistic linear progression)
  useEffect(() => {
    if (uploadData.episode) {
      simulateRealisticProcessing()
    }
  }, [uploadData.episode])

  const simulateRealisticProcessing = () => {
    let currentProgress = 0
    let currentStepIndex = 0
    const totalDuration = 30000 // 30 seconds total processing time
    const updateInterval = 500 // Update every 500ms for smoother progress
    const progressIncrement = 100 / (totalDuration / updateInterval) // Linear increment (~1.67% per update)
    
    const startTime = Date.now()
    setEstimatedTime(30) // 30 seconds estimated
    
    const processInterval = setInterval(() => {
      // Linear progress increment with small random variation
      currentProgress += progressIncrement + (Math.random() * 0.5 - 0.25) // ±0.25% variation
      currentProgress = Math.min(Math.max(currentProgress, 0), 100) // Keep between 0-100%
      
      // Update current step based on progress (only move forward)
      const newStepIndex = Math.floor((currentProgress / 100) * (processingSteps.length - 1))
      
      if (newStepIndex > currentStepIndex) {
        currentStepIndex = newStepIndex
        const step = processingSteps[currentStepIndex]
        setCurrentStep(step.description)
        setProcessingStatus('processing')
        
        // Add step log
        setProcessingLogs(prev => [...prev, {
          timestamp: new Date(),
          level: 'info',
          message: `Started: ${step.label}`
        }])
      }
      
      // Update progress
      setProcessingProgress(currentProgress)
      
      // Update estimated time remaining
      const elapsed = Date.now() - startTime
      const totalEstimated = (elapsed / currentProgress) * 100
      const remaining = Math.max(0, Math.floor((totalEstimated - elapsed) / 1000))
      setEstimatedTime(remaining)
      
      // Check if complete
      if (currentProgress >= 100) {
        clearInterval(processInterval)
        setProcessingProgress(100)
        setProcessingStatus('completed')
        setCurrentStep('Episode ready for streaming!')
        setEstimatedTime(0)
        
        // Add completion log
        setProcessingLogs(prev => [...prev, {
          timestamp: new Date(),
          level: 'success',
          message: 'Episode processing completed successfully!'
        }])
      }
      
    }, updateInterval)
    
    // Initial log
    setProcessingLogs([{
      timestamp: new Date(),
      level: 'info',
      message: `Started processing: ${uploadData.episode.title}`
    }])
  }

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const getCurrentStepInfo = () => {
    const stepIndex = Math.floor((processingProgress / 100) * (processingSteps.length - 1))
    return processingSteps[stepIndex] || processingSteps[0]
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
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              processingStatus === 'completed' ? 'bg-green-100 text-green-700' :
              processingStatus === 'processing' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {processingStatus === 'completed' ? 'Ready to Stream' : 
               processingStatus === 'processing' ? 'Processing...' : 
               'Preparing...'}
            </div>
            {estimatedTime && processingStatus !== 'completed' && (
              <p className="text-xs text-gray-500 mt-1">~{formatTime(estimatedTime)} remaining</p>
            )}
          </div>
        </div>
      </div>

      {/* Processing Progress */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Processing Progress</h3>
          <span className="text-2xl font-bold text-indigo-600">{Math.round(processingProgress)}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${processingProgress}%` }}
          ></div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{currentStep}</span>
          <span className="text-gray-500">
            Step {Math.min(Math.floor((processingProgress / 100) * processingSteps.length) + 1, processingSteps.length)} of {processingSteps.length}
          </span>
        </div>
      </div>

      {/* Processing Steps */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Processing Steps</h3>
        <div className="space-y-3">
          {processingSteps.map((step, index) => {
            const isCompleted = processingProgress >= ((index + 1) / processingSteps.length) * 100
            const isCurrent = getCurrentStepInfo().key === step.key
            
            return (
              <div key={step.key} className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-500 text-white animate-pulse' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    isCompleted ? 'text-green-700' : 
                    isCurrent ? 'text-blue-700' : 
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
                {isCurrent && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Processing Logs */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Processing Logs</h3>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {processingLogs.map((log, index) => (
            <div key={index} className="flex items-start">
              <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                log.level === 'success' ? 'bg-green-500' :
                log.level === 'error' ? 'bg-red-500' :
                'bg-blue-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">{log.message}</p>
                <p className="text-xs text-gray-400">{log.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          {processingLogs.length === 0 && (
            <p className="text-gray-500 text-sm italic">Processing logs will appear here...</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {processingStatus === 'completed' 
            ? 'Episode is now available for streaming' 
            : 'Please wait while we process your episode'}
        </div>
        <div className="flex items-center space-x-4">
          {processingStatus === 'completed' ? (
            <>
              <button
                onClick={onComplete}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Upload Another Episode
              </button>
              <button
                onClick={() => window.open(`/watch/${uploadData.series?.slug}/${uploadData.season?.seasonNumber}/${uploadData.episode?.episodeNumber}`, '_blank')}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg hover:shadow-lg transition-all flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-4-4v4m0 0V7a3 3 0 016 0v4M9 21V9a2 2 0 012-2h2a2 2 0 012 2v12l-3-2-3 2z" />
                </svg>
                Watch Episode
              </button>
            </>
          ) : (
            <button
              disabled
              className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed flex items-center"
            >
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
              Processing...
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProcessingStatus
