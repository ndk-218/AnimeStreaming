import axios from 'axios'

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000, // 30 seconds for video uploads
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    // Check for admin token first (for admin routes)
    const adminToken = localStorage.getItem('admin-token')
    if (adminToken && config.url?.includes('/admin')) {
      config.headers.Authorization = `Bearer ${adminToken}`
      return config
    }
    
    // Then check for user token (for user routes)
    const userToken = localStorage.getItem('user-access-token')
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling + token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors
    if (error.response?.status === 401) {
      
      // Admin route - logout admin
      if (originalRequest.url?.includes('/admin')) {
        localStorage.removeItem('admin-token')
        window.location.href = '/admin/login'
        return Promise.reject(error);
      }
      
      // User route - try refresh token (only once)
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('user-refresh-token');
          
          if (refreshToken) {
            console.log('🔄 Attempting to refresh access token...');
            
            // Call refresh token endpoint
            const response = await axios.post(
              `${API_BASE_URL}/api/users/auth/refresh-token`,
              { refreshToken }
            );

            if (response.data.success) {
              const { accessToken } = response.data.data;
              
              // Save new access token
              localStorage.setItem('user-access-token', accessToken);
              console.log('✅ Access token refreshed successfully');
              
              // Update auth store if needed
              const authStorage = localStorage.getItem('auth-storage');
              if (authStorage) {
                try {
                  const authData = JSON.parse(authStorage);
                  authData.state.accessToken = accessToken;
                  localStorage.setItem('auth-storage', JSON.stringify(authData));
                } catch (e) {
                  console.error('Failed to update auth storage:', e);
                }
              }
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return api(originalRequest);
            }
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          
          // Refresh failed - logout user
          localStorage.removeItem('user-access-token');
          localStorage.removeItem('user-refresh-token');
          localStorage.removeItem('auth-storage');
          
          // Don't redirect, just let component handle it
          // User can continue as anonymous
          return Promise.reject(error);
        }
      }
      
      // If retry already attempted or no refresh token
      return Promise.reject(error);
    }
    
    return Promise.reject(error)
  }
)

export default api
