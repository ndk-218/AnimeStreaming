import { useState, useEffect } from 'react'
import api from '../../services/api'
import EnhancedSeriesSelection from '../../components/admin/EnhancedSeriesSelection'
import EnhancedSeasonSelection from '../../components/admin/EnhancedSeasonSelection'
import EpisodeUpload from '../../components/admin/EpisodeUpload'
import ProcessingStatus from '../../components/admin/ProcessingStatus'

export default function UploadCenter() {
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadData, setUploadData] = useState({
    series: null,
    season: null,
    episode: {
      title: '',
      episodeNumber: '',
      description: '',
      videoFile: null,
      subtitleFiles: []
    }
  })
  const [prefetchedSeasons, setPrefetchedSeasons] = useState(null) // Cache seasons data
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const steps = [
    { id: 1, title: 'Select Series', description: 'Choose or create anime series' },
    { id: 2, title: 'Select Season', description: 'Choose or create season' },
    { id: 3, title: 'Upload Episode', description: 'Upload video and metadata' },
    { id: 4, title: 'Processing', description: 'Video conversion and finalization' }
  ]

  const resetUpload = () => {
    setCurrentStep(1)
    setUploadData({
      series: null,
      season: null,
      episode: {
        title: '',
        episodeNumber: '',
        description: '',
        videoFile: null,
        subtitleFiles: []
      }
    })
    setPrefetchedSeasons(null)
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen bg-light-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-light-900 mb-2">Episode Upload Center</h1>
              <p className="text-light-600">Upload anime episodes with automatic processing and HLS conversion</p>
            </div>
            <button
              onClick={resetUpload}
              className="bg-light-200 hover:bg-light-300 text-light-700 px-4 py-2 rounded-lg transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    currentStep >= step.id
                      ? 'bg-primary-400 text-white'
                      : 'bg-light-200 text-light-500'
                  }`}>
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  <div className="ml-3">
                    <p className={`font-medium text-sm ${
                      currentStep >= step.id ? 'text-light-900' : 'text-light-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-light-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-6 ${
                    currentStep > step.id ? 'bg-primary-400' : 'bg-light-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
              {error}
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
              {success}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {currentStep === 1 && (
            <EnhancedSeriesSelection
              uploadData={uploadData}
              setUploadData={(series) => {
                console.log('🔍 Series selected:', series); // Debug log
                setUploadData(prev => {
                  console.log('🔍 Previous uploadData:', prev); // Debug log
                  const newData = { ...prev, series };
                  console.log('🔍 New uploadData:', newData); // Debug log
                  return newData;
                });
                // Prefetch seasons for faster step 2 loading
                if (series?._id) {
                  console.log('🔍 Prefetching seasons for series:', series._id); // Debug log
                  api.get(`/seasons/series/${series._id}`)
                    .then(response => {
                      console.log('🔍 Prefetched seasons:', response.data.data); // Debug log
                      setPrefetchedSeasons(response.data.data || [])
                    })
                    .catch(error => {
                      console.error('Failed to prefetch seasons:', error)
                      setPrefetchedSeasons([])
                    })
                }
              }}
              onNext={() => setCurrentStep(2)}
              setError={setError}
              setSuccess={setSuccess}
            />
          )}
          
          {currentStep === 2 && (
            <EnhancedSeasonSelection
              uploadData={uploadData}
              setUploadData={setUploadData}
              prefetchedSeasons={prefetchedSeasons}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
              setError={setError}
              setSuccess={setSuccess}
            />
          )}
          
          {currentStep === 3 && (
            <EpisodeUpload
              uploadData={uploadData}
              setUploadData={setUploadData}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
              setError={setError}
              setSuccess={setSuccess}
            />
          )}
          
          {currentStep === 4 && (
            <ProcessingStatus
              uploadData={uploadData}
              onComplete={resetUpload}
              setError={setError}
            />
          )}
        </div>
      </div>
    </div>
  )
}
