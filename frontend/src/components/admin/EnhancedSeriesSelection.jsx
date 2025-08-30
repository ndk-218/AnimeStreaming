import { useState, useEffect } from 'react'
import api from '../../services/api'

// Enhanced Series Selection Component with better UI
function EnhancedSeriesSelection({ uploadData, setUploadData, onNext, setError, setSuccess }) {
  const [existingSeries, setExistingSeries] = useState([])
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [newSeries, setNewSeries] = useState({
    title: '',
    originalTitle: '',
    description: '',
    releaseYear: new Date().getFullYear(),
    status: 'ongoing'
  })
  const [loading, setLoading] = useState(false)
  const [loadingSeries, setLoadingSeries] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Status options
  const statusOptions = [
    { value: 'ongoing', label: 'Ongoing', color: 'bg-green-100 text-green-600' },
    { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-600' },
    { value: 'upcoming', label: 'Upcoming', color: 'bg-yellow-100 text-yellow-600' },
    { value: 'hiatus', label: 'On Hiatus', color: 'bg-orange-100 text-orange-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-600' }
  ]

  // Fetch recent series on component mount
  useEffect(() => {
    fetchRecentSeries()
  }, [])

  // Fetch recent series with search
  const fetchRecentSeries = async () => {
    try {
      setLoadingSeries(true)
      const params = new URLSearchParams({
        limit: '12',
        sort: 'recent'
      })
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }
      
      const response = await api.get(`/series?${params.toString()}`)
      setExistingSeries(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch series:', error)
      setExistingSeries([])
    } finally {
      setLoadingSeries(false)
    }
  }

  // Search series with debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRecentSeries()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Create new series with enhanced validation
  const createSeries = async () => {
    // Validation
    if (!newSeries.title.trim()) {
      setError('Series title is required')
      return
    }

    if (newSeries.releaseYear < 1900 || newSeries.releaseYear > new Date().getFullYear() + 5) {
      setError('Please enter a valid release year')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const seriesData = {
        ...newSeries,
        title: newSeries.title.trim(),
        originalTitle: newSeries.originalTitle.trim() || undefined,
        description: newSeries.description.trim() || undefined
      }

      const response = await api.post('/admin/series', seriesData)
      if (response.data.success) {
        setUploadData(prev => ({ ...prev, series: response.data.data }))
        setSuccess(`Series "${response.data.data.title}" created successfully!`)
        // Auto proceed to next step after short delay
        setTimeout(() => {
          setSuccess('')
          onNext()
        }, 1500)
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create series')
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setNewSeries({
      title: '',
      originalTitle: '',
      description: '',
      releaseYear: new Date().getFullYear(),
      status: 'ongoing'
    })
    setError('')
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Select or Create Series</h2>
      
      {/* Search Existing Series */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Browse Existing Series</h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search series..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={fetchRecentSeries}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {loadingSeries ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Searching series...</span>
          </div>
        ) : existingSeries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingSeries.map((series) => {
              const statusOption = statusOptions.find(s => s.value === series.status) || statusOptions[0]
              return (
                <div
                  key={series._id}
                  onClick={() => {
                    setUploadData(prev => ({ ...prev, series }))
                    setSuccess(`Selected series: "${series.title}"`)
                    setTimeout(() => {
                      setSuccess('')
                      onNext()
                    }, 1000)
                  }}
                  className="group p-5 border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-700 line-clamp-2 flex-1">
                      {series.title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 ${statusOption.color}`}>
                      {statusOption.label}
                    </span>
                  </div>
                  
                  {series.originalTitle && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{series.originalTitle}</p>
                  )}
                  
                  <div className="text-xs text-gray-500 mb-3">
                    <span className="font-medium">{series.releaseYear}</span>
                    {series.studio && <span className="text-indigo-600 ml-2">• {series.studio}</span>}
                  </div>
                  
                  {series.genres && series.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {series.genres.slice(0, 3).map((genre, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                          {genre}
                        </span>
                      ))}
                      {series.genres.length > 3 && (
                        <span className="text-xs text-gray-400">+{series.genres.length - 3} more</span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                    Last updated: {new Date(series.updatedAt).toLocaleDateString()}
                  </div>
                  
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center text-xs text-indigo-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      Select this series
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4V2c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v2h5c.55 0 1 .45 1 1s-.45 1-1 1h-1v14c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V6H2c-.55 0-1-.45-1-1s.45-1 1-1h5z" />
            </svg>
            <p className="text-gray-500 mb-2">
              {searchTerm ? `No series found matching "${searchTerm}"` : 'No series found'}
            </p>
            <p className="text-gray-400 text-sm">Create your first series below</p>
          </div>
        )}
      </div>

      {/* Create New Series Section */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Create New Series</h3>
          <button
            onClick={() => {
              setShowCreateNew(!showCreateNew)
              if (showCreateNew) resetForm()
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
              showCreateNew 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
            }`}
          >
            {showCreateNew ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Series
              </>
            )}
          </button>
        </div>

        {showCreateNew && (
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Series Title *
                    </label>
                    <input
                      type="text"
                      value={newSeries.title}
                      onChange={(e) => setNewSeries(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      placeholder="Enter series title (e.g., Attack on Titan)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Original Title
                    </label>
                    <input
                      type="text"
                      value={newSeries.originalTitle}
                      onChange={(e) => setNewSeries(prev => ({ ...prev, originalTitle: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      placeholder="Original language title (e.g., 進撃の巨人)"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={newSeries.description}
                  onChange={(e) => setNewSeries(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="Brief description of the series plot and themes"
                />
              </div>

              {/* Release Year and Status */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Release Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Release Year *
                    </label>
                    <input
                      type="number"
                      value={newSeries.releaseYear}
                      onChange={(e) => setNewSeries(prev => ({ ...prev, releaseYear: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      min="1900"
                      max={new Date().getFullYear() + 5}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Status *
                    </label>
                    <select
                      value={newSeries.status}
                      onChange={(e) => setNewSeries(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  * Required fields
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={resetForm}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Reset Form
                  </button>
                  <button
                    onClick={createSeries}
                    disabled={loading || !newSeries.title.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg disabled:opacity-50 hover:shadow-lg transition-all disabled:hover:shadow-none flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Series...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Create Series & Continue
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedSeriesSelection
