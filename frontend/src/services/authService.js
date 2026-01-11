import axios from 'axios';

/**
 * ===== USER AUTH API SERVICE =====
 * Service để gọi các API endpoints cho user authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = `${API_BASE_URL}/api/users/auth`;

// Create axios instance
const authAPI = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Thêm access token vào header
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('user-access-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet, try refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('user-refresh-token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/refresh-token`, {
            refreshToken
          });

          const { accessToken } = response.data.data;
          
          // Save new access token
          localStorage.setItem('user-access-token', accessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return authAPI(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('user-access-token');
        localStorage.removeItem('user-refresh-token');
        localStorage.removeItem('auth-storage');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Auth Service Object
 */
const authService = {
  /**
   * Register new user
   */
  register: async (email, username, displayName, password) => {
    try {
      const response = await authAPI.post('/register', {
        email,
        username,
        displayName,
        password
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Registration failed' };
    }
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token) => {
    try {
      const response = await authAPI.get(`/verify-email/${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Email verification failed' };
    }
  },

  /**
   * Resend verification email
   */
  resendVerification: async (email) => {
    try {
      const response = await authAPI.post('/resend-verification', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to resend verification email' };
    }
  },

  /**
   * Login user
   */
  login: async (emailOrUsername, password) => {
    try {
      const response = await authAPI.post('/login', {
        emailOrUsername,
        password
      });

      const { accessToken, refreshToken, user } = response.data.data;

      // Save tokens to localStorage
      localStorage.setItem('user-access-token', accessToken);
      localStorage.setItem('user-refresh-token', refreshToken);

      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await authAPI.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens regardless of API call success
      localStorage.removeItem('user-access-token');
      localStorage.removeItem('user-refresh-token');
      localStorage.removeItem('auth-storage');
    }
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async () => {
    try {
      const response = await authAPI.get('/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get user profile' };
    }
  },

  /**
   * Request password reset
   */
  forgotPassword: async (email) => {
    try {
      const response = await authAPI.post('/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to send password reset email' };
    }
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token, newPassword, confirmPassword) => {
    try {
      const response = await authAPI.post('/reset-password', {
        token,
        newPassword,
        confirmPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Password reset failed' };
    }
  },

  /**
   * Change password (for logged-in users)
   */
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    try {
      const response = await authAPI.post('/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Password change failed' };
    }
  },

  /**
   * Refresh access token
   */
  refreshAccessToken: async (refreshToken) => {
    try {
      const response = await axios.post(`${API_URL}/refresh-token`, {
        refreshToken
      });
      
      const { accessToken } = response.data.data;
      localStorage.setItem('user-access-token', accessToken);
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Token refresh failed' };
    }
  }
};

export default authService;
