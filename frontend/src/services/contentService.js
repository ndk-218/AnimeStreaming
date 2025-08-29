// Studio and Genre management services
import api from './api'

// Studio services
export const studioService = {
  // Get all studios
  getStudios: async (search = '') => {
    try {
      const response = await api.get(`/admin/studios${search ? `?search=${search}` : ''}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch studios' }
    }
  },

  // Create new studio
  createStudio: async (name) => {
    try {
      const response = await api.post('/admin/studios', { name: name.trim() })
      return response.data
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create studio' }
    }
  },

  // Search studios with autocomplete
  searchStudios: async (query) => {
    if (!query.trim()) return []
    try {
      const response = await api.get(`/admin/studios/search?q=${encodeURIComponent(query.trim())}&limit=5`)
      return response.data.data || []
    } catch (error) {
      console.error('Studio search failed:', error)
      return []
    }
  }
}

// Genre services
export const genreService = {
  // Get all genres
  getGenres: async (search = '') => {
    try {
      const response = await api.get(`/admin/genres${search ? `?search=${search}` : ''}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch genres' }
    }
  },

  // Create new genre
  createGenre: async (name) => {
    try {
      const response = await api.post('/admin/genres', { name: name.trim() })
      return response.data
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create genre' }
    }
  },

  // Search genres with autocomplete
  searchGenres: async (query) => {
    if (!query.trim()) return []
    try {
      const response = await api.get(`/admin/genres/search?q=${encodeURIComponent(query.trim())}&limit=5`)
      return response.data.data || []
    } catch (error) {
      console.error('Genre search failed:', error)
      return []
    }
  }
}
