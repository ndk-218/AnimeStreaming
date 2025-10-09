import { useState, useEffect } from 'react'
import api from '../../services/api'

// Video Processing Status Component with Real-time Updates
function ProcessingStatus({ uploadData, onComplete, setError }) {
  // Debug log
  useEffect(() => {
    console.log('🔍 ProcessingStatus - uploadData:', uploadData);
    if (!uploadData?.episode) {
      console.error('❌ ProcessingStatus - Missing episode data!');
    }
  }, [uploadData]);
  
  const [processingStatus, setProcessingStatus] = useState('pending')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('Upload Complete - Waiting for processing...')
  const [processingLogs, setProcessingLogs] = useState([])
  const [estimatedTime, setEstimatedTime] = useState(null)

  // Early return if data is missing
  if (!uploadData?.episode) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-700 font-semibold mb-2">⚠️ Missing Episode Data</h3>
        <p className="text-red-600">Episode data is missing. Please try uploading again.</p>
        <button
          onClick={onComplete}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Back to Upload
        </button>
      </div>
    );
  }

  const processingSteps = [
    { key: 'pending', label: 'Upload Complete', description: 'File uploaded successfully' },
    { key: 'processing', label: 'Video Analysis', description: 'Analyzing video metadata and format' },
    { key: 'converting', label: 'Format Conversion', description: 'Converting to streaming format (HLS)' },
    { key: 'quality_generation', label: 'Quality Generation', description: 'Creating 480p and 1080p versions' },
    { key: 'subtitle_processing', label: 'Subtitle Processing', description: 'Processing subtitle files' },
    { key: 'finalization', label: 'Finalization', description: 'Creating playlists and cleanup' },
    { key: 'completed', label: 'Processing Complete', description: 'Episode ready for streaming' }
  ]

  // ⚠️ PHASE 1: NO REAL PROCESSING YET
  // Show upload success message instead of fake progress
  useEffect(() => {
    if (uploadData.episode) {
      setProcessingLogs([{
        timestamp: new Date(),
        level: 'success',
        message: `Episode "${uploadData.episode.title}" uploaded successfully!`
      }, {
        timestamp: new Date(),
        level: 'info',
        message: 'Video processing will be implemented in Phase 2 (BullMQ + FFmpeg)'
      }, {
        timestamp: new Date(),
        level: 'info',
        message: `File saved to: uploads/videos/${uploadData.episode._id}/original.mp4`
      }]);
    }
  }, [uploadData.episode]);

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
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
              Upload Complete - Pending Processing
            </div>
            <p className="text-xs text-gray-500 mt-1">Video processing: Phase 2</p>
          </div>
        </div>
      </div>

      {/* Phase 1 Complete Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Upload Successful!</h3>
            <p className="text-green-700 mb-2">
              Your episode has been uploaded and saved successfully.
            </p>
            <div className="bg-white border border-green-200 rounded p-3 text-sm">
              <p className="font-medium text-gray-700 mb-1">Episode Details:</p>
              <p className="text-gray-600">ID: {uploadData.episode?._id}</p>
              <p className="text-gray-600">Status: Pending Processing</p>
              <p className="text-gray-600">File: uploads/videos/{uploadData.episode?._id}/original.mp4</p>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 2 Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">🚧 Phase 2: Video Processing (Coming Soon)</h3>
            <p className="text-blue-700 mb-3">
              Automatic video processing will be implemented in Phase 2 with:
            </p>
            <ul className="space-y-1 text-blue-600 text-sm">
              <li>• BullMQ background job queue</li>
              <li>• FFmpeg video conversion (MP4/MKV → HLS)</li>
              <li>• Multiple quality generation (480p, 1080p)</li>
              <li>• Subtitle extraction and processing</li>
              <li>• Real-time progress updates via Socket.IO</li>
            </ul>
          </div>
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
          Episode uploaded successfully. Video processing will be implemented in Phase 2.
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onComplete}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg hover:shadow-lg transition-all flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Upload Another Episode
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProcessingStatus
