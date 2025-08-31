import { useState, useEffect } from 'react'
import api from '../../services/api'
import EnhancedSeriesSelection from '../../components/admin/EnhancedSeriesSelection'
import EnhancedSeasonSelection from '../../components/admin/EnhancedSeasonSelection'

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
              setUploadData={setUploadData}
              onNext={() => setCurrentStep(2)}
              setError={setError}
              setSuccess={setSuccess}
            />
          )}
          
          {currentStep === 2 && (
            <EnhancedSeasonSelection
              uploadData={uploadData}
              setUploadData={setUploadData}
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
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Enhanced Series Selection Component
function SeriesSelection({ uploadData, setUploadData, onNext, setError, setSuccess }) {
  const [existingSeries, setExistingSeries] = useState([])
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [newSeries, setNewSeries] = useState({
    title: '',
    originalTitle: '',
    description: '',
    releaseYear: new Date().getFullYear(),
    genres: [],
    studio: ''
  })
  const [loading, setLoading] = useState(false)
  const [loadingSeries, setLoadingSeries] = useState(true)

  // Fetch recent series on component mount
  useEffect(() => {
    fetchRecentSeries()
  }, [])

  // Fetch recent series (last 10 uploaded)
  const fetchRecentSeries = async () => {
    try {
      setLoadingSeries(true)
      const response = await api.get('/series?limit=10&sort=recent')
      setExistingSeries(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch recent series:', error)
      setExistingSeries([])
    } finally {
      setLoadingSeries(false)
    }
  }

  // Create new series with enhanced validation
  const createSeries = async () => {
    // Validation
    if (!newSeries.title.trim()) {
      setError('Series title is required')
      return
    }
    
    if (newSeries.genres.length === 0) {
      setError('At least one genre is required')
      return
    }

    if (!newSeries.studio.trim()) {
      setError('Studio is required')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const seriesData = {
        ...newSeries,
        title: newSeries.title.trim(),
        originalTitle: newSeries.originalTitle.trim(),
        description: newSeries.description.trim(),
        studio: newSeries.studio.trim(),
        genres: newSeries.genres.map(g => g.trim()).filter(g => g)
      }

      const response = await api.post('/admin/series', seriesData)
      if (response.data.success) {
        setUploadData(prev => ({ ...prev, series: response.data.data }))
        setSuccess(`Series "${response.data.data.title}" created successfully!`)
        onNext()
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create series')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-light-900 mb-6">Select or Create Series</h2>
      
      {/* Recent Series Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-light-800">Recent Series</h3>
          <button
            onClick={fetchRecentSeries}
            className="text-primary-500 hover:text-primary-600 text-sm font-medium"
          >
            Refresh
          </button>
        </div>

        {loadingSeries ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
          </div>
        ) : existingSeries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingSeries.map((series) => (
              <div
                key={series._id}
                onClick={() => {
                  setUploadData(prev => ({ ...prev, series }))
                  onNext()
                }}
                className="p-4 border border-light-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 cursor-pointer transition-all card-hover"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-light-900 truncate">{series.title}</h4>
                  <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full">
                    {series.status || 'Active'}
                  </span>
                </div>
                <p className="text-sm text-light-600 truncate">{series.originalTitle}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-light-500">
                  <span>{series.releaseYear} • {series.studio}</span>
                  <span>{series.genres?.slice(0, 2).join(', ')}</span>
                </div>
                <div className="mt-2 text-xs text-light-400">
                  Last updated: {new Date(series.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-light-50 rounded-lg">
            <p className="text-light-500">No series found. Create your first series below.</p>
          </div>
        )}
      </div>

      {/* Create New Series Section */}
      <div className="border-t border-light-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-light-800">Create New Series</h3>
          <button
            onClick={() => setShowCreateNew(!showCreateNew)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showCreateNew 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
            }`}
          >
            {showCreateNew ? 'Cancel' : 'Create New Series'}
          </button>
        </div>

        {showCreateNew && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-light-700 text-sm font-medium mb-2">
                  Series Title *
                </label>
                <input
                  type="text"
                  value={newSeries.title}
                  onChange={(e) => setNewSeries(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-light-200 rounded-lg focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  placeholder="Enter series title"
                />
              </div>
              
              <div>
                <label className="block text-light-700 text-sm font-medium mb-2">
                  Original Title
                </label>
                <input
                  type="text"
                  value={newSeries.originalTitle}
                  onChange={(e) => setNewSeries(prev => ({ ...prev, originalTitle: e.target.value }))}
                  className="w-full p-3 border border-light-200 rounded-lg focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  placeholder="Original language title"
                />
              </div>
            </div>

            <div>
              <label className="block text-light-700 text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={newSeries.description}
                onChange={(e) => setNewSeries(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full p-3 border border-light-200 rounded-lg focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                placeholder="Brief description of the series"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-light-700 text-sm font-medium mb-2">
                  Release Year *
                </label>
                <input
                  type="number"
                  value={newSeries.releaseYear}
                  onChange={(e) => setNewSeries(prev => ({ ...prev, releaseYear: parseInt(e.target.value) }))}
                  className="w-full p-3 border border-light-200 rounded-lg focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  min="1900"
                  max={new Date().getFullYear() + 5}
                />
              </div>
              
              <AutocompleteInput
                label="Animation Studio *"
                value={newSeries.studio}
                onChange={(value) => setNewSeries(prev => ({ ...prev, studio: value }))}
                placeholder="Search or enter studio name"
                searchFunction={studioService.searchStudios}
                required
              />
            </div>

            <MultiSelectInput
              label="Genres *"
              value={newSeries.genres}
              onChange={(value) => setNewSeries(prev => ({ ...prev, genres: value }))}
              placeholder="Search and select genres"
              searchFunction={genreService.searchGenres}
              required
              maxSelections={8}
            />

            <div className="pt-4 border-t border-light-200">
              <button
                onClick={createSeries}
                disabled={loading || !newSeries.title.trim() || !newSeries.studio.trim() || newSeries.genres.length === 0}
                className="gradient-primary text-white font-medium py-3 px-8 rounded-lg disabled:opacity-50 hover:shadow-lg transition-all disabled:hover:shadow-none"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Series...
                  </div>
                ) : (
                  'Create Series & Continue'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Episode Upload Component (placeholder for next priority)
function EpisodeUpload({ uploadData, setUploadData, onNext, onBack, setError, setSuccess }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-light-900 mb-6">Episode Upload</h2>
      <p className="text-light-600 mb-6">Selected Series: <strong>{uploadData.series?.title}</strong></p>
      
      <div className="text-center py-12">
        <p className="text-light-500 mb-6">Episode upload with local file storage will be implemented in Priority 3</p>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={onBack}
            className="bg-light-200 hover:bg-light-300 text-light-700 px-6 py-3 rounded-lg flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Season
          </button>
          <button
            onClick={onNext}
            className="gradient-primary text-white px-6 py-3 rounded-lg flex items-center"
          >
            Continue to Processing
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// Processing Status Component (placeholder)
function ProcessingStatus({ uploadData, onComplete }) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-light-900 mb-6">Processing Complete</h2>
      <p className="text-light-600 mb-6">Episode processing will be implemented with video conversion</p>
      
      <button
        onClick={onComplete}
        className="gradient-primary text-white px-6 py-3 rounded-lg"
      >
        Upload Another Episode
      </button>
    </div>
  )
}
