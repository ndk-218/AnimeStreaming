import axios from 'axios';

/**
 * ===== USER FAVORITES API SERVICE =====
 * Service để gọi các API endpoints cho user favorites management
 */

const API_URL = 'http://localhost:5000/api/user/favorites';

// Create axios instance
const favoritesAPI = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Thêm access token vào header
favoritesAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('user-access-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
favoritesAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('user-access-token');
      localStorage.removeItem('user-refresh-token');
      localStorage.removeItem('auth-storage');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

/**
 * Favorites Service Object
 */
const favoritesService = {
  /**
   * Get user's favorite series list
   */
  getFavorites: async () => {
    try {
      const response = await favoritesAPI.get('/');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get favorites' };
    }
  },

  /**
   * Add series to favorites
   */
  addFavorite: async (seriesId) => {
    try {
      const response = await favoritesAPI.post(`/${seriesId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to add favorite' };
    }
  },

  /**
   * Remove series from favorites
   */
  removeFavorite: async (seriesId) => {
    try {
      const response = await favoritesAPI.delete(`/${seriesId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to remove favorite' };
    }
  },

  /**
   * Check if series is in favorites
   */
  checkFavorite: async (seriesId) => {
    try {
      const response = await favoritesAPI.get(`/check/${seriesId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to check favorite' };
    }
  }
};

export default favoritesService;
