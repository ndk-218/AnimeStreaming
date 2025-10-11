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
      const response = await api.get(`/episodes/season/${seasonId}`)
      
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

  // Generate batch options based on max episode count or 1000
  const getBatchOptions = () => {
    const maxEpisode = episodes.length > 0 
      ? Math.max(...episodes.map(ep => ep.episodeNumber))
      : 36 // Default to 1 batch if no episodes

    const batches = []
    const batchSize = 36
    let currentBatch = 1
    let startEpisode = 1

    while (startEpisode <= maxEpisode + batchSize) {
      const endEpisode = startEpisode + batchSize - 1
      batches.push({
        batch: currentBatch,
        label: `Tập ${startEpisode} - ${endEpisode}`,
        start: startEpisode,
        end: endEpisode
      })
      
      currentBatch++
      startEpisode += batchSize
      
      // Limit to reasonable number of batches
      if (currentBatch > 28) break // Max ~1000 episodes
    }

    return batches
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
    const status = episode.processingStatus || 'pending'
    return `${episode.title}\nStatus: ${status}\nClick to replace`
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

  return (
    <div className="space-y-4">
      {/* Header với Batch Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Episode List</h3>
          <p className="text-sm text-gray-500">
            {episodes.length} episodes uploaded • Click to edit/replace existing episodes
          </p>
        </div>
        
        {/* Batch Selector Dropdown - Giống hình mẫu */}
        {batchOptions.length > 0 && (
          <div className="relative">
            <select 
              value={selectedBatch} 
              onChange={(e) => setSelectedBatch(parseInt(e.target.value))}
              className="appearance-none bg-gray-800 text-white font-medium px-4 py-2 pr-10 rounded-lg border-2 border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:bg-gray-700 transition-colors"
            >
              {batchOptions.map(batch => (
                <option key={batch.batch} value={batch.batch} className="bg-gray-800">
                  {batch.label}
                </option>
              ))}
            </select>
            {/* Dropdown Arrow Icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Episodes Grid hoặc Empty State */}
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
          {/* Episode Grid - 3 rows × 12 columns = 36 episodes per batch */}
          <div className="grid grid-cols-12 gap-2">
            {/* Render current batch episodes */}
            {Array.from({ length: 36 }, (_, index) => {
              const batchInfo = batchOptions.find(b => b.batch === selectedBatch)
              if (!batchInfo) return null
              
              const episodeNumber = batchInfo.start + index
              
              // Don't render if beyond batch range
              if (episodeNumber > batchInfo.end) {
                return (
                  <div key={`empty-${index}`} className="h-12 w-full" />
                )
              }
              
              // Find existing episode with this number
              const episode = episodes.find(ep => ep.episodeNumber === episodeNumber)
              
              if (episode) {
                // Existing episode button
                return (
                  <button
                    key={episode._id}
                    onClick={() => handleEpisodeClick(episode)}
                    title={getEpisodeTooltip(episode)}
                    className={`
                      relative h-12 w-full rounded border-2 transition-all duration-200 font-medium text-sm
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
              } else {
                // Empty slot - show episode number placeholder
                return (
                  <button
                    key={`slot-${episodeNumber}`}
                    onClick={() => {
                      onEpisodeSelect({
                        episodeNumber: episodeNumber,
                        title: `Episode ${episodeNumber}`,
                        description: '',
                        isExisting: false,
                        episodeId: null,
                        processingStatus: null
                      })
                    }}
                    className="relative h-12 w-full rounded border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 font-medium text-sm text-gray-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title={`Upload Episode ${episodeNumber}`}
                  >
                    <Plus className="w-4 h-4 mx-auto" />
                  </button>
                )
              }
            })}
          </div>
        </>
      )}

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Color Legend:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded"></div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 border border-yellow-600 rounded"></div>
            <span className="text-gray-600">Processing</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 border border-red-600 rounded"></div>
            <span className="text-gray-600">Failed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 border border-gray-600 rounded"></div>
            <span className="text-gray-600">Pending</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EpisodeSelector
