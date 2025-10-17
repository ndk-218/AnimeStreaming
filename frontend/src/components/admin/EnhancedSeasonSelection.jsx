import { useState, useEffect } from 'react'
import api from '../../services/api'
import EditSeasonModal from './EditSeasonModal'
import { studioService, genreService } from '../../services/contentService'
import MultiSelectInput from '../common/MultiSelectInput'

// Enhanced Season Selection Component - Now Season Detail Page
function EnhancedSeasonSelection({ uploadData, setUploadData, prefetchedSeasons, onNext, onBack, setError, setSuccess }) {
  const [existingSeasons, setExistingSeasons] = useState(prefetchedSeasons || [])
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [newSeason, setNewSeason] = useState({
    title: '',
    seasonNumber: 1,
    seasonType: 'tv',
    releaseYear: new Date().getFullYear(),
    description: '',
    status: 'upcoming',
    studios: [],
    genres: []
  })
  const [loading, setLoading] = useState(false)
  const [loadingSeasons, setLoadingSeasons] = useState(!prefetchedSeasons)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [seasonToEdit, setSeasonToEdit] = useState(null)

  // Season type options
  const seasonTypeOptions = [
    { value: 'tv', label: 'TV Series', description: 'Regular television series' },
    { value: 'movie', label: 'Movie', description: 'Theatrical film' },
    { value: 'ova', label: 'OVA', description: 'Original Video Animation' },
    { value: 'special', label: 'Special', description: 'Special episodes or content' }
  ]

  // Season status options
  const seasonStatusOptions = [
    { value: 'upcoming', label: 'Upcoming', color: 'bg-yellow-100 text-yellow-600' },
    { value: 'airing', label: 'Currently Airing', color: 'bg-green-100 text-green-600' },
    { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-600' }
  ]

  // Fetch existing seasons for this series
  useEffect(() => {
    if (uploadData.series?._id && !prefetchedSeasons) {
      fetchExistingSeasons()
    } else if (prefetchedSeasons) {
      setExistingSeasons(prefetchedSeasons)
      setLoadingSeasons(false)
    }
  }, [uploadData.series, prefetchedSeasons])

  // Auto-generate season title when seasonType or seasonNumber changes
  useEffect(() => {
    generateSeasonTitle()
  }, [newSeason.seasonType, newSeason.seasonNumber])

  const fetchExistingSeasons = async () => {
    try {
      setLoadingSeasons(true)
      const response = await api.get(`/seasons/series/${uploadData.series._id}`)
      setExistingSeasons(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch seasons:', error)
      setExistingSeasons([])
    } finally {
      setLoadingSeasons(false)
    }
  }

  const generateSeasonTitle = () => {
    const { seasonType, seasonNumber } = newSeason
    let title = ''
    
    switch (seasonType) {
      case 'tv':
        title = `Season ${seasonNumber}`
        break
      case 'movie':
        title = `Movie ${seasonNumber}`
        break
      case 'ova':
        title = 'OVA'
        break
      case 'special':
        title = 'Special'
        break
      default:
        title = `Season ${seasonNumber}`
    }
    
    setNewSeason(prev => ({ ...prev, title }))
  }

  const createSeason = async () => {
    // Validation
    if (!newSeason.title.trim()) {
      setError('Season title is required')
      return
    }

    if (newSeason.studios.length === 0) {
      setError('At least one studio is required')
      return
    }

    if (newSeason.genres.length === 0) {
      setError('At least one genre is required')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const seasonData = {
        seriesId: uploadData.series._id,
        title: newSeason.title.trim(),
        seasonNumber: newSeason.seasonNumber,
        seasonType: newSeason.seasonType,
        releaseYear: newSeason.releaseYear,
        description: newSeason.description.trim() || undefined,
        status: newSeason.status,
        studios: newSeason.studios.filter(s => s.trim()),
        genres: newSeason.genres.filter(g => g.trim())
      }

      const response = await api.post('/admin/seasons', seasonData)
      if (response.data.success) {
        setUploadData(prev => ({ ...prev, season: response.data.data }))
        setSuccess(`Season "${response.data.data.title}" created successfully!`)
        // Auto proceed to next step
        setTimeout(() => {
          setSuccess('')
          onNext()
        }, 1500)
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create season')
    } finally {
      setLoading(false)
    }
  }

  // Handle edit season
  const handleEditSeason = (season) => {
    setSeasonToEdit(season)
    setEditModalOpen(true)
  }

  // Handle delete season
  const handleDeleteSeason = async (season) => {
    const episodeCount = season.episodeCount || 0
    
    if (episodeCount > 0) {
      setError(`Cannot delete season "${season.title}". It contains ${episodeCount} episode(s). Please delete all episodes first.`)
      setTimeout(() => setError(''), 5000)
      return
    }

    if (!window.confirm(`Are you sure you want to delete "${season.title}"?`)) {
      return
    }

    try {
      const response = await api.delete(`/admin/seasons/${season._id}`)
      if (response.data.success) {
        setSuccess(`Season "${season.title}" deleted successfully`)
        fetchExistingSeasons() // Refresh list
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete season')
    }
  }

  // Handle edit success
  const handleEditSuccess = (message) => {
    setSuccess(message)
    fetchExistingSeasons() // Refresh list
    setTimeout(() => setSuccess(''), 3000)
  }

  const resetForm = () => {
    setNewSeason({
      title: '',
      seasonNumber: 1,
      seasonType: 'tv',
      releaseYear: new Date().getFullYear(),
      description: '',
      status: 'upcoming',
      studios: [],
      genres: []
    })
    setError('')
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Select or Create Season</h2>
      
      {/* Selected Series Info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-indigo-800 font-medium">Selected Series: {uploadData.series?.title || 'None'}</p>
            <p className="text-indigo-600 text-sm">{uploadData.series?.originalTitle || ''} • {uploadData.series?.releaseYear || ''}</p>
          </div>
        </div>
      </div>

      {/* Existing Seasons */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Existing Seasons</h3>
          <button
            onClick={fetchExistingSeasons}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {loadingSeasons ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading seasons...</span>
          </div>
        ) : existingSeasons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingSeasons.map((season) => {
              const statusOption = seasonStatusOptions.find(s => s.value === season.status) || seasonStatusOptions[0]
              const typeOption = seasonTypeOptions.find(t => t.value === season.seasonType) || seasonTypeOptions[0]
              
              return (
                <div
                  key={season._id}
                  className="group p-4 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 hover:shadow-md relative"
                >
                  {/* Action Buttons - Top Right */}
                  <div className="absolute top-3 right-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditSeason(season)
                      }}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-2 rounded-lg transition-colors"
                      title="Edit Season"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSeason(season)
                      }}
                      className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors"
                      title="Delete Season"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Clickable Area - Select Season */}
                  <div
                    onClick={() => {
                      setUploadData(prev => ({ ...prev, season }))
                      setSuccess(`Selected season: "${season.title}"`)
                      setTimeout(() => {
                        setSuccess('')
                        onNext()
                      }, 1000)
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2 pr-20">
                      <h4 className="font-semibold text-gray-900 group-hover:text-indigo-700">
                        {season.title}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusOption.color}`}>
                        {statusOption.label}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md mr-2">
                        {typeOption.label}
                      </span>
                      <span>{season.releaseYear}</span>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {season.episodeCount || 0} episodes
                    </div>
                    
                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center text-xs text-indigo-600">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Select this season
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500 mb-1">No seasons found for this series</p>
            <p className="text-gray-400 text-sm">Create the first season below</p>
          </div>
        )}
      </div>

      {/* Create New Season Section */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Create New Season</h3>
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
                Create New Season
              </>
            )}
          </button>
        </div>

        {showCreateNew && (
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="space-y-6">
              {/* Season Type and Number */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Season Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Season Type *
                    </label>
                    <select
                      value={newSeason.seasonType}
                      onChange={(e) => setNewSeason(prev => ({ ...prev, seasonType: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    >
                      {seasonTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {seasonTypeOptions.find(t => t.value === newSeason.seasonType)?.description}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      {newSeason.seasonType === 'movie' ? 'Year' : 'Season Number'} *
                    </label>
                    <input
                      type="number"
                      value={newSeason.seasonNumber}
                      onChange={(e) => setNewSeason(prev => ({ ...prev, seasonNumber: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      min={newSeason.seasonType === 'movie' ? 1900 : 1}
                      max={newSeason.seasonType === 'movie' ? new Date().getFullYear() + 5 : 50}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Release Year *
                    </label>
                    <input
                      type="number"
                      value={newSeason.releaseYear}
                      onChange={(e) => setNewSeason(prev => ({ ...prev, releaseYear: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      min="1900"
                      max={new Date().getFullYear() + 5}
                    />
                  </div>
                </div>
              </div>

              {/* Auto-generated Title */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Season Title *
                </label>
                <input
                  type="text"
                  value={newSeason.title}
                  onChange={(e) => setNewSeason(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="Season title (auto-generated based on type and number)"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={newSeason.description}
                  onChange={(e) => setNewSeason(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="Brief description of this season"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Status *
                </label>
                <select
                  value={newSeason.status}
                  onChange={(e) => setNewSeason(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  {seasonStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Production Details - Enhanced with MultiSelect */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Production Details</h4>
                <div className="space-y-4">
                  <MultiSelectInput
                    label="Animation Studios *"
                    value={newSeason.studios}
                    onChange={(value) => setNewSeason(prev => ({ ...prev, studios: value }))}
                    placeholder="Search and select studios (e.g., Mappa, Studio Pierrot)"
                    searchFunction={studioService.searchStudios}
                    required
                    maxSelections={3}
                  />
                  
                  <MultiSelectInput
                    label="Genres *"
                    value={newSeason.genres}
                    onChange={(value) => setNewSeason(prev => ({ ...prev, genres: value }))}
                    placeholder="Search and select genres (e.g., Action, Adventure)"
                    searchFunction={genreService.searchGenres}
                    required
                    maxSelections={8}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Studios and genres can be different from other seasons of the same series
                </p>
              </div>

              {/* Action Buttons - Fixed Layout */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    * Required fields
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={onBack}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Series
                    </button>
                    <button
                      onClick={resetForm}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Reset Form
                    </button>
                    <button
                      onClick={createSeason}
                      disabled={loading || !newSeason.title.trim() || newSeason.studios.length === 0 || newSeason.genres.length === 0}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg disabled:opacity-50 hover:shadow-lg transition-all disabled:hover:shadow-none flex items-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Season...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Create Season & Continue
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Season Modal */}
      <EditSeasonModal
        season={seasonToEdit}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSeasonToEdit(null)
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}

export default EnhancedSeasonSelection