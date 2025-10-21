import api from './api'

/**
 * Studio Service - API calls for studio data
 */
class StudioService {
  // Search studios với autocomplete
  static async searchStudios(searchTerm) {
    try {
      const response = await api.get(`/admin/studios/search?q=${encodeURIComponent(searchTerm)}&limit=10`)
      if (response.data.success) {
        // Ensure consistent format: Array of objects with 'name' property
        return response.data.data.map(studio => ({
          name: studio.name || studio,
          count: studio.count || 0
        }))
      }
      return []
    } catch (error) {
      console.error('Studio search error:', error)
      // Return some default studios for testing
      const mockStudios = [
        { name: 'Mappa', count: 15 },
        { name: 'Studio Pierrot', count: 12 },
        { name: 'Madhouse', count: 20 },
        { name: 'Wit Studio', count: 8 },
        { name: 'Bones', count: 10 },
        { name: 'Toei Animation', count: 25 },
        { name: 'Studio Ghibli', count: 18 }
      ].filter(studio => 
        studio.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      return mockStudios
    }
  }

  // Get all studios
  static async getAllStudios() {
    try {
      const response = await api.get('/admin/studios')
      if (response.data.success) {
        return response.data.data
      }
      return []
    } catch (error) {
      console.error('Get all studios error:', error)
      return []
    }
  }

  // Get popular studios
  static async getPopularStudios(limit = 10) {
    try {
      const response = await api.get(`/admin/studios/popular?limit=${limit}`)
      if (response.data.success) {
        return response.data.data
      }
      return []
    } catch (error) {
      console.error('Get popular studios error:', error)
      return []
    }
  }
}

/**
 * Genre Service - API calls for genre data  
 */
class GenreService {
  // Search genres với autocomplete
  static async searchGenres(searchTerm) {
    try {
      const response = await api.get(`/admin/genres/search?q=${encodeURIComponent(searchTerm)}&limit=15`)
      if (response.data.success) {
        // Ensure consistent format: Array of objects with 'name' property
        return response.data.data.map(genre => ({
          name: genre.name || genre,
          count: genre.count || 0
        }))
      }
      return []
    } catch (error) {
      console.error('Genre search error:', error)
      // Return some default genres for testing
      const mockGenres = [
        { name: 'Action', count: 45 },
        { name: 'Adventure', count: 32 },
        { name: 'Comedy', count: 28 },
        { name: 'Drama', count: 38 },
        { name: 'Fantasy', count: 24 },
        { name: 'Romance', count: 22 },
        { name: 'Sci-Fi', count: 18 },
        { name: 'Thriller', count: 15 },
        { name: 'Horror', count: 12 },
        { name: 'Mystery', count: 16 },
        { name: 'Slice of Life', count: 20 },
        { name: 'Sports', count: 14 },
        { name: 'Supernatural', count: 19 },
        { name: 'Mecha', count: 11 },
        { name: 'School', count: 25 },
        { name: 'Military', count: 8 },
        { name: 'Historical', count: 13 },
        { name: 'Psychological', count: 10 },
        { name: 'Shounen', count: 35 },
        { name: 'Shoujo', count: 18 },
        { name: 'Seinen', count: 22 },
        { name: 'Josei', count: 12 }
      ].filter(genre => 
        genre.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      return mockGenres
    }
  }

  // Get all genres
  static async getAllGenres() {
    try {
      const response = await api.get('/admin/genres')
      if (response.data.success) {
        return response.data.data
      }
      return []
    } catch (error) {
      console.error('Get all genres error:', error)
      return []
    }
  }

  // Get popular genres
  static async getPopularGenres(limit = 15) {
    try {
      const response = await api.get(`/admin/genres/popular?limit=${limit}`)
      if (response.data.success) {
        return response.data.data
      }
      return []
    } catch (error) {
      console.error('Get popular genres error:', error)
      return []
    }
  }

  // Get trending genres với seasons (Top 3 genres + 5 seasons each)
  static async getTrendingGenres() {
    try {
      const response = await api.get('/content/trending-genres')
      if (response.data.success) {
        return response.data.data
      }
      return []
    } catch (error) {
      console.error('Get trending genres error:', error)
      return []
    }
  }
}

// Export services
export const studioService = StudioService
export const genreService = GenreService

// Export individual methods for easier imports
export const {
  searchStudios,
  getAllStudios,
  getPopularStudios
} = StudioService

export const {
  searchGenres,
  getAllGenres,
  getPopularGenres,
  getTrendingGenres
} = GenreService

export default {
  studioService: StudioService,
  genreService: GenreService
}
