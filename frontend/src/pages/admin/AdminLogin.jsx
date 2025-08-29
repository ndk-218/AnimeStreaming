import { useState } from 'react'
import api from '../../services/api'

export default function AdminLogin({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: 'admin@animestreaming.com',
    password: 'admin123456'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/admin/auth/login', formData)
      
      if (response.data.success) {
        const { accessToken, admin } = response.data.data
        
        // Store token and user info
        localStorage.setItem('admin-token', accessToken)
        localStorage.setItem('admin-user', JSON.stringify(admin))
        
        // Call success handler
        onLoginSuccess()
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-light-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold text-light-900 mb-2">
            Admin Login
          </h1>
          <p className="text-light-600">
            Access your anime streaming dashboard
          </p>
        </div>
        
        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center">
              <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-light-700 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-4 bg-light-50 border border-light-200 rounded-lg text-light-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all duration-200"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label className="block text-light-700 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-4 bg-light-50 border border-light-200 rounded-lg text-light-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all duration-200"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white font-bold py-4 px-4 rounded-lg disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-light-200">
            <div className="text-center">
              <div className="bg-light-50 rounded-lg p-4">
                <p className="text-light-600 text-sm mb-2 font-medium">Development Credentials</p>
                <div className="space-y-1 text-xs">
                  <p className="text-light-500">Email: admin@animestreaming.com</p>
                  <p className="text-light-500">Password: admin123456</p>
                  <p className="text-primary-500 mt-2">Backend: localhost:5000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
