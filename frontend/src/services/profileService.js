import axios from 'axios';

/**
 * ===== USER PROFILE API SERVICE =====
 * Service để gọi các API endpoints cho user profile management
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/user/profile`;

// Create axios instance
const profileAPI = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds for file uploads
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Thêm access token vào header
profileAPI.interceptors.request.use(
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
profileAPI.interceptors.response.use(
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
 * Profile Service Object
 */
const profileService = {
  /**
   * Get user profile
   */
  getProfile: async () => {
    try {
      const response = await profileAPI.get('/');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get profile' };
    }
  },

  /**
   * Update profile (displayName, gender)
   */
  updateProfile: async (displayName, gender) => {
    try {
      const updates = {};
      if (displayName !== undefined) updates.displayName = displayName;
      if (gender !== undefined) updates.gender = gender;

      const response = await profileAPI.put('/', updates);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update profile' };
    }
  },

  /**
   * Upload avatar
   */
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await profileAPI.post('/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to upload avatar' };
    }
  },

  /**
   * Delete avatar (revert to default)
   */
  deleteAvatar: async () => {
    try {
      const response = await profileAPI.delete('/avatar');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to delete avatar' };
    }
  }
};

export default profileService;
