import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import api from '../../services/api'

const EpisodeSelector = ({ seasonId, onEpisodeSelect, selectedEpisode }) => {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedBatch, setSelectedBatch] = useState(1)

  // Fetch existing episodes for the season
  useEffect(() => {
    if (seasonId) {
      fetchEpisodes()
    }
  }, [seasonId])

  const fetchEpisodes = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log(`📥 Fetching episodes for season: ${seasonId}`)
      const response = await api.get(`/admin/episodes/season/${seasonId}`)
      
      if (response.data.success) {
        const sortedEpisodes = response.data.data.sort((a, b) => a.episodeNumber - b.episodeNumber)
        setEpisodes(sortedEpisodes)
        console.log(`✅ Loaded ${sortedEpisodes.length} episodes`)
        
        // Auto select first batch if episodes exist
        if (sortedEpisodes.length > 0) {
          setSelectedBatch(1)
        }
      }
    } catch (error) {
      console.error('❌ Error fetching episodes:', error)
      setError('Failed to load episodes')
    } finally {
      setLoading(false)
    }
  }

  // Generate batch options based on episode count
  const getBatchOptions = () => {
    const totalEpisodes = episodes.length
    if (totalEpisodes === 0) return []

    const batches = []
    const batchSize = 36
    let currentBatch = 1
    let startEpisode = 1

    while (startEpisode <= totalEpisodes) {
      const endEpisode = Math.min(startEpisode + batchSize - 1, totalEpisodes)
      batches.push({
        batch: currentBatch,
        label: `Episodes ${startEpisode}-${endEpisode}`,
        start: startEpisode,
        end: endEpisode
      })
      
      currentBatch++
      startEpisode += batchSize
    }

    return batches
  }

  // Get episodes for current batch
  const getCurrentBatchEpisodes = () => {
    const batches = getBatchOptions()
    if (batches.length === 0) return []

    const currentBatchInfo = batches.find(batch => batch.batch === selectedBatch)
    if (!currentBatchInfo) return []

    return episodes.filter(ep => 
      ep.episodeNumber >= currentBatchInfo.start && 
      ep.episodeNumber <= currentBatchInfo.end
    )
  }

  // Handle episode selection
  const handleEpisodeClick = (episode) => {
    console.log(`📺 Selected existing episode: ${episode.episodeNumber}`, episode)
    onEpisodeSelect({
      episodeNumber: episode.episodeNumber,
      title: episode.title || `Episode ${episode.episodeNumber}`,
      description: episode.description || '',
      isExisting: true,
      episodeId: episode._id,
      processingStatus: episode.processingStatus
    })
  }

  // Handle add new episode
  const handleAddNewEpisode = () => {
    const nextEpisodeNumber = episodes.length > 0 ? Math.max(...episodes.map(ep => ep.episodeNumber)) + 1 : 1
    
    console.log(`🆕 Creating new episode slot: ${nextEpisodeNumber}`)
    onEpisodeSelect({
      episodeNumber: nextEpisodeNumber,
      title: `Episode ${nextEpisodeNumber}`,
      description: '',
      isExisting: false,
      episodeId: null,
      processingStatus: null
    })
  }

  // Get episode status color
  const getEpisodeStatusColor = (episode) => {
    const isSelected = selectedEpisode?.episodeId === episode._id
    
    if (isSelected) {
      return 'bg-pink-500 text-white border-pink-600 hover:bg-pink-600' // Selected - Pink
    }
    
    switch (episode.processingStatus) {
      case 'completed':
        return 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600' // Completed - Blue
      case 'processing':
        return 'bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600' // Processing - Yellow
      case 'failed':
        return 'bg-red-500 text-white border-red-600 hover:bg-red-600' // Failed - Red
      default:
        return 'bg-gray-500 text-white border-gray-600 hover:bg-gray-600' // Pending - Gray
    }
  }

  // Get episode tooltip text
  const getEpisodeTooltip = (episode) => {
    const fileSize = episode.fileSize ? `${(episode.fileSize / (1024 * 1024)).toFixed(1)}MB` : 'Unknown size'
    const status = episode.processingStatus || 'pending'
    const uploadDate = episode.uploadDate ? new Date(episode.uploadDate).toLocaleDateString() : 'Unknown date'
    
    return `${episode.title}\nStatus: ${status}\nSize: ${fileSize}\nUploaded: ${uploadDate}\nClick to replace`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Episode List</h3>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
        <div className="text-sm text-gray-500">Loading episodes...</div>
      </div>
    )
  }

  const batchOptions = getBatchOptions()
  const currentBatchEpisodes = getCurrentBatchEpisodes()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Episode List</h3>
          <p className="text-sm text-gray-500">
            {episodes.length} episodes uploaded • Click to edit/replace existing episodes
          </p>
        </div>
        
        {/* Batch Selector */}
        {batchOptions.length > 1 && (
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Batch:</label>
            <select 
              value={selectedBatch} 
              onChange={(e) => setSelectedBatch(parseInt(e.target.value))}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {batchOptions.map(batch => (
                <option key={batch.batch} value={batch.batch}>
                  {batch.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Episodes List */}
      {episodes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No episodes uploaded yet</p>
          <button
            onClick={handleAddNewEpisode}
            className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload First Episode
          </button>
        </div>
      ) : (
        <>
          {/* Episode Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
            {currentBatchEpisodes.map(episode => {
              const isSelected = selectedEpisode?.episodeId === episode._id
              
              return (
                <button
                  key={episode._id}
                  onClick={() => handleEpisodeClick(episode)}
                  title={getEpisodeTooltip(episode)}
                  className={`
                    relative h-12 w-12 rounded border-2 transition-all duration-200 font-medium text-sm
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    ${getEpisodeStatusColor(episode)}
                  `}
                >
                  {/* Episode Number */}
                  <span className="relative z-10">
                    {episode.episodeNumber.toString().padStart(2, '0')}
                  </span>
                  
                  {/* Processing Status Indicator */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white">
                    {episode.processingStatus === 'completed' && (
                      <div className="w-full h-full bg-green-500 rounded-full" title="Processing Complete" />
                    )}
                    {episode.processingStatus === 'processing' && (
                      <div className="w-full h-full bg-yellow-500 rounded-full animate-pulse" title="Processing" />
                    )}
                    {episode.processingStatus === 'failed' && (
                      <div className="w-full h-full bg-red-500 rounded-full" title="Processing Failed" />
                    )}
                    {episode.processingStatus === 'pending' && (
                      <div className="w-full h-full bg-gray-400 rounded-full" title="Processing Pending" />
                    )}
                  </div>
                </button>
              )
            })}
            
            {/* Add New Episode Button */}
            <button
              onClick={handleAddNewEpisode}
              title="Upload new episode"
              className="relative h-12 w-12 rounded border-2 border-dashed border-gray-400 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </button>
          </div>

          {/* Episode Details List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {currentBatchEpisodes.map(episode => (
              <div 
                key={episode._id}
                onClick={() => handleEpisodeClick(episode)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedEpisode?.episodeId === episode._id
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-8 h-8 rounded flex items-center justify-center text-sm font-medium
                      ${selectedEpisode?.episodeId === episode._id ? 'bg-pink-500 text-white' : 'bg-blue-500 text-white'}
                    `}>
                      {episode.episodeNumber.toString().padStart(2, '0')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{episode.title}</p>
                      {episode.description && (
                        <p className="text-sm text-gray-500 truncate">{episode.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      episode.processingStatus === 'completed' ? 'bg-green-100 text-green-600' :
                      episode.processingStatus === 'processing' ? 'bg-yellow-100 text-yellow-600' :
                      episode.processingStatus === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {episode.processingStatus || 'pending'}
                    </span>
                    {episode.fileSize && (
                      <p className="text-xs text-gray-400 mt-1">
                        {(episode.fileSize / (1024 * 1024)).toFixed(1)}MB
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Legend:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded"></div>
              <span className="text-gray-600">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 border border-yellow-600 rounded"></div>
              <span className="text-gray-600">Processing</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-pink-500 border border-pink-600 rounded"></div>
              <span className="text-gray-600">Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 border border-red-600 rounded"></div>
              <span className="text-gray-600">Failed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EpisodeSelector
