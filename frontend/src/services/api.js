import axios from 'axios'

// API Base Configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if it's an admin route
      if (error.config?.url?.includes('/admin')) {
        localStorage.removeItem('admin-token')
        window.location.href = '/admin/login'
      }
      // For user routes, just remove token but don't redirect
      // Let the component handle the 401 error
    }
    return Promise.reject(error)
  }
)

export default api
