import { useState, useEffect } from 'react'
import api from '../../services/api'

/**
 * EditSeriesModal - Modal popup để edit series
 * Props:
 *   - series: Series object cần edit
 *   - isOpen: Boolean để show/hide modal
 *   - onClose: Callback khi đóng modal
 *   - onSuccess: Callback khi update thành công
 */
function EditSeriesModal({ series, isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    originalTitle: '',
    description: '',
    releaseYear: new Date().getFullYear(),
    status: 'ongoing'
  })
  const [bannerFile, setBannerFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Status options
  const statusOptions = [
    { value: 'ongoing', label: 'Ongoing', color: 'bg-green-100 text-green-600' },
    { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-600' },
    { value: 'upcoming', label: 'Upcoming', color: 'bg-yellow-100 text-yellow-600' },
    { value: 'hiatus', label: 'On Hiatus', color: 'bg-orange-100 text-orange-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-600' }
  ]

  // Load series data khi modal mở
  useEffect(() => {
    if (isOpen && series) {
      setFormData({
        title: series.title || '',
        originalTitle: series.originalTitle || '',
        description: series.description || '',
        releaseYear: series.releaseYear || new Date().getFullYear(),
        status: series.status || 'ongoing'
      })
      setError('')
      setBannerFile(null)
    }
  }, [isOpen, series])

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.title.trim()) {
      setError('Series title is required')
      return
    }

    if (formData.releaseYear < 1900 || formData.releaseYear > new Date().getFullYear() + 5) {
      setError('Please enter a valid release year')
      return
    }

    setLoading(true)
    setError('')

    try {
      const updateData = {
        title: formData.title.trim(),
        originalTitle: formData.originalTitle.trim() || undefined,
        description: formData.description.trim() || undefined,
        releaseYear: parseInt(formData.releaseYear),
        status: formData.status
      }

      const response = await api.put(`/admin/series/${series._id}`, updateData)

      if (response.data.success) {
        // Upload banner if selected
        if (bannerFile) {
          const bannerFormData = new FormData()
          bannerFormData.append('imageFile', bannerFile)
          
          await api.put(`/admin/series/${series._id}/banner`, bannerFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }

        onSuccess(response.data.data)
        onClose()
      }
    } catch (error) {
      console.error('Update series error:', error)
      setError(error.response?.data?.error || 'Failed to update series')
    } finally {
      setLoading(false)
    }
  }

  const handleBannerChange = (e) => {
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
      
      setBannerFile(file)
      setError('')
    }
  }

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header - Sticky */}
        <div className="bg-gradient-to-r from-primary-400 to-indigo-600 text-white p-6 rounded-t-xl flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-2xl font-bold">Edit Series</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form - Scrollable */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Series Title */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Series Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  placeholder="Enter series title"
                  required
                />
              </div>

              {/* Original Title */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Original Title
                </label>
                <input
                  type="text"
                  value={formData.originalTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, originalTitle: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  placeholder="Original language title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                  placeholder="Brief description of the series"
                />
              </div>

              {/* Banner Upload */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Banner
                </label>
                <div className="flex items-center space-x-4">
                  {/* Current Banner Preview */}
                  {series?.bannerImage && !bannerFile && (
                    <div className="w-32 h-18 rounded-lg overflow-hidden border border-gray-300">
                      <img 
                        src={`http://localhost:5000/${series.bannerImage}`}
                        alt="Current banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* New Banner Preview */}
                  {bannerFile && (
                    <div className="w-32 h-18 rounded-lg overflow-hidden border border-indigo-300">
                      <img 
                        src={URL.createObjectURL(bannerFile)}
                        alt="New banner"
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
                        {bannerFile ? 'Change Banner' : 'Upload New Banner'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">1920x1080 recommended</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Release Year & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Release Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.releaseYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, releaseYear: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    min="1900"
                    max={new Date().getFullYear() + 5}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    required
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
            <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Series
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditSeriesModal
