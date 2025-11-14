import { useState, useEffect } from 'react'
import api from '../../services/api'
import MultiSelectInput from '../common/MultiSelectInput'
import { studioService, genreService } from '../../services/contentService'

function EditSeasonModal({ season, isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    releaseYear: new Date().getFullYear(),
    status: 'upcoming',
    studios: [],
    genres: []
  })
  const [posterFile, setPosterFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Season status options
  const seasonStatusOptions = [
    { value: 'upcoming', label: 'Upcoming', color: 'bg-yellow-100 text-yellow-600' },
    { value: 'airing', label: 'Currently Airing', color: 'bg-green-100 text-green-600' },
    { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-600' }
  ]

  // Load season data when modal opens
  useEffect(() => {
    if (isOpen && season) {
      setFormData({
        title: season.title || '',
        description: season.description || '',
        releaseYear: season.releaseYear || new Date().getFullYear(),
        status: season.status || 'upcoming',
        studios: season.studios?.map(s => s.name || s) || [],
        genres: season.genres?.map(g => g.name || g) || []
      })
      setError('')
      setPosterFile(null)
    }
  }, [isOpen, season])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title.trim()) {
      setError('Season title is required')
      return
    }

    if (formData.studios.length === 0) {
      setError('At least one studio is required')
      return
    }

    if (formData.genres.length === 0) {
      setError('At least one genre is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Update season info
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        releaseYear: formData.releaseYear,
        status: formData.status,
        studios: formData.studios.filter(s => s.trim()),
        genres: formData.genres.filter(g => g.trim())
      }

      const response = await api.put(`/admin/seasons/${season._id}`, updateData)

      if (response.data.success) {
        // Upload poster if selected
        if (posterFile) {
          const posterFormData = new FormData()
          posterFormData.append('imageFile', posterFile)
          
          await api.put(`/admin/seasons/${season._id}/poster`, posterFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }

        onSuccess('Season updated successfully!')
        onClose()
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update season')
    } finally {
      setLoading(false)
    }
  }

  const handlePosterChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB')
        return
      }
      
      setPosterFile(file)
      setError('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Season</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Season Info Badge */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-indigo-800 font-medium">
                  {season?.seasonType?.toUpperCase()} • Season #{season?.seasonNumber}
                </span>
                <span className="text-indigo-600 ml-2">
                  • {season?.episodeCount || 0} episodes
                </span>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Season Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Enter season title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Brief description of this season"
              />
            </div>

            {/* Release Year & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Release Year *
                </label>
                <input
                  type="number"
                  value={formData.releaseYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, releaseYear: parseInt(e.target.value) }))}
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
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  {seasonStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Studios & Genres */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Production Details</h4>
              
              <MultiSelectInput
                label="Animation Studios *"
                value={formData.studios}
                onChange={(value) => setFormData(prev => ({ ...prev, studios: value }))}
                placeholder="Search and select studios"
                searchFunction={studioService.searchStudios}
                required
                maxSelections={3}
              />
              
              <MultiSelectInput
                label="Genres *"
                value={formData.genres}
                onChange={(value) => setFormData(prev => ({ ...prev, genres: value }))}
                placeholder="Search and select genres"
                searchFunction={genreService.searchGenres}
                required
                maxSelections={8}
              />
            </div>

            {/* Poster Upload */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Update Poster (Optional)
              </label>
              <div className="flex items-center space-x-4">
                {/* Current Poster Preview */}
                {season?.posterImage && !posterFile && (
                  <div className="w-24 h-32 rounded-lg overflow-hidden border border-gray-300">
                    <img 
                      src={`http://localhost:5000/${season.posterImage}`}
                      alt="Current poster"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* New Poster Preview */}
                {posterFile && (
                  <div className="w-24 h-32 rounded-lg overflow-hidden border border-indigo-300">
                    <img 
                      src={URL.createObjectURL(posterFile)}
                      alt="New poster"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Upload Button */}
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      {posterFile ? 'Change Poster' : 'Upload New Poster'}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || formData.studios.length === 0 || formData.genres.length === 0}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditSeasonModal
