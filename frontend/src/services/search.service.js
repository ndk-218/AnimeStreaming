import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

class SearchService {
  /**
   * Advanced search seasons với filters
   */
  async advancedSearch(filters = {}) {
    try {
      const {
        seasonTypes = [],
        genres = [],
        studios = [],
        yearStart = null,
        yearEnd = null,
        excludeYears = [],
        sortBy = 'updatedAt',
        page = 1,
        limit = 24
      } = filters;

      // Build query params
      const params = new URLSearchParams();
      
      if (seasonTypes.length > 0) {
        params.append('seasonTypes', seasonTypes.join(','));
      }
      
      if (genres.length > 0) {
        params.append('genres', genres.join(','));
      }
      
      if (studios.length > 0) {
        params.append('studios', studios.join(','));
      }
      
      if (yearStart) {
        params.append('yearStart', yearStart);
      }
      
      if (yearEnd) {
        params.append('yearEnd', yearEnd);
      }
      
      if (excludeYears.length > 0) {
        params.append('excludeYears', excludeYears.join(','));
      }
      
      // Add sortBy parameter
      params.append('sortBy', sortBy);
      
      params.append('page', page);
      params.append('limit', limit);

      const response = await axios.get(
        `${API_URL}/seasons/advanced-search?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error('Advanced search error:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả genres
   */
  async getAllGenres() {
    try {
      const response = await axios.get(`${API_URL}/content/genres`);
      return response.data;
    } catch (error) {
      console.error('Get genres error:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả studios
   */
  async getAllStudios() {
    try {
      const response = await axios.get(`${API_URL}/content/studios`);
      return response.data;
    } catch (error) {
      console.error('Get studios error:', error);
      throw error;
    }
  }
}

export default new SearchService();
