import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import AdminLogin from './pages/admin/AdminLogin'
import UploadCenter from './pages/admin/UploadCenter'
import WatchPage from './pages/WatchPage'

function App() {
  const [showLogin, setShowLogin] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin-token')
    const adminUser = localStorage.getItem('admin-user')
    
    if (token && adminUser) {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setShowLogin(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin-token')
    localStorage.removeItem('admin-user')
    setIsAuthenticated(false)
    setShowLogin(false)
    setCurrentPage('dashboard')
  }

  // ===== ADMIN PAGES COMPONENT (Existing code) =====
  const AdminPages = () => {
    if (loading) {
      return (
        <div className="min-h-screen bg-light-50 text-light-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto"></div>
            <p className="mt-4 text-light-600">Loading...</p>
          </div>
        </div>
      )
    }

    if (showLogin && !isAuthenticated) {
      return <AdminLogin onLoginSuccess={handleLoginSuccess} />
    }

    if (isAuthenticated) {
      // Upload Center Page
      if (currentPage === 'upload') {
        return (
          <div>
            <nav className="nav-sticky gradient-primary shadow-lg">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setCurrentPage('dashboard')}
                      className="text-white/80 hover:text-white mr-4"
                    >
                      ← Back to Dashboard
                    </button>
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-primary-500 font-bold text-xl">A</span>
                    </div>
                    <h1 className="text-xl font-bold text-white">Upload Center</h1>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleLogout}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </nav>
            <UploadCenter />
          </div>
        )
      }

      // Main Dashboard (keeping all existing code)
      const adminUser = JSON.parse(localStorage.getItem('admin-user') || '{}')
      
      return (
        <div className="min-h-screen bg-light-50">
          {/* Navigation Bar */}
          <nav className="nav-sticky gradient-primary shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-primary-500 font-bold text-xl">A</span>
                  </div>
                  <h1 className="text-xl font-bold text-white">
                    Anime Streaming Admin
                  </h1>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="hidden md:flex space-x-6">
                    <button
                      onClick={() => setCurrentPage('dashboard')}
                      className={`nav-link transition-colors ${
                        currentPage === 'dashboard' 
                          ? 'text-white font-semibold' 
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setCurrentPage('upload')}
                      className={`nav-link transition-colors ${
                        currentPage === 'upload' 
                          ? 'text-white font-semibold' 
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      Upload
                    </button>
                    <button
                      onClick={() => setCurrentPage('management')}
                      className={`nav-link transition-colors ${
                        currentPage === 'management' 
                          ? 'text-white font-semibold' 
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      Management
                    </button>
                    <button
                      onClick={() => setCurrentPage('analytics')}
                      className={`nav-link transition-colors ${
                        currentPage === 'analytics' 
                          ? 'text-white font-semibold' 
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      Analytics
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-white/90 text-sm font-medium">
                        {adminUser.displayName || 'System Admin'}
                      </p>
                      <p className="text-white/70 text-xs">{adminUser.role || 'Administrator'}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          
          {/* Main Content - Keeping all existing dashboard code */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-light-900 mb-2">
                Content Management Dashboard
              </h2>
              <p className="text-light-600">
                Upload anime episodes and manage your streaming content library.
              </p>
            </div>

            {/* Primary Action - Upload Section */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-primary-400 to-primary-500 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mr-4">
                        <span className="text-white font-bold text-2xl">UP</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-1">Episode Upload Center</h3>
                        <p className="text-white/80">Upload and process anime episodes with automatic HLS conversion</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-300 rounded-full mr-2"></span>
                        MP4, MKV Support
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-300 rounded-full mr-2"></span>
                        Auto HLS Processing
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-300 rounded-full mr-2"></span>
                        Subtitle Management
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-8">
                    <button 
                      onClick={() => setCurrentPage('upload')}
                      className="bg-white text-primary-500 hover:bg-light-50 font-bold py-4 px-8 rounded-xl shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                    >
                      Start Upload
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Rest of dashboard - keeping all existing code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 card-hover border-l-4 border-secondary-400">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 gradient-secondary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">M</span>
                  </div>
                  <span className="text-xs bg-secondary-100 text-secondary-700 px-2 py-1 rounded-full font-medium">
                    Content
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-light-900 mb-2">Content Management</h3>
                <p className="text-light-600 mb-4 text-sm">
                  Create and organize anime series, seasons, movies, and OVAs
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-light-600">Series Creation</span>
                    <span className="text-primary-500 font-medium">Available</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-light-600">Season Organization</span>
                    <span className="text-primary-500 font-medium">Available</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-light-600">Metadata Management</span>
                    <span className="text-primary-500 font-medium">Available</span>
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentPage('management')}
                  className="w-full bg-secondary-400 hover:bg-secondary-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
                >
                  Manage Content
                </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 card-hover border-l-4 border-primary-400">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">A</span>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    Analytics
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-light-900 mb-2">Analytics & Monitoring</h3>
                <p className="text-light-600 mb-4 text-sm">
                  Monitor upload progress, view statistics, and system health
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-light-600">Upload Progress</span>
                    <span className="text-green-500 font-medium">Real-time</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-light-600">Content Statistics</span>
                    <span className="text-green-500 font-medium">Live Data</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-light-600">System Health</span>
                    <span className="text-green-500 font-medium">Monitoring</span>
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentPage('analytics')}
                  className="w-full bg-primary-400 hover:bg-primary-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
                >
                  View Analytics
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-light-900 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-green-400 rounded-full mr-3"></span>
                  System Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-green-800 font-medium">Authentication</span>
                    <span className="text-green-600 text-sm">Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-green-800 font-medium">Backend API</span>
                    <span className="text-green-600 text-sm">localhost:5000</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-green-800 font-medium">Upload Service</span>
                    <span className="text-green-600 text-sm">Ready</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-light-900 mb-4">Content Library</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-light-50 rounded-lg">
                    <div className="text-2xl font-bold text-secondary-500 mb-1">0</div>
                    <div className="text-sm text-light-600">Total Series</div>
                  </div>
                  <div className="text-center p-4 bg-light-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-500 mb-1">0</div>
                    <div className="text-sm text-light-600">Total Episodes</div>
                  </div>
                  <div className="text-center p-4 bg-light-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-500 mb-1">0</div>
                    <div className="text-sm text-light-600">Processing</div>
                  </div>
                  <div className="text-center p-4 bg-light-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-500 mb-1">Ready</div>
                    <div className="text-sm text-light-600">System Status</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Landing page
    return (
      <div className="min-h-screen bg-light-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="mb-8">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">A</span>
              </div>
              <h1 className="text-4xl font-bold text-light-900 mb-4">
                Anime Streaming Platform
              </h1>
              <p className="text-light-600 mb-8">
                Content Management System - Phase 1 Development
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="space-y-3">
                <div className="flex items-center justify-center text-green-600">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Frontend Setup Complete
                </div>
                <div className="flex items-center justify-center text-primary-500">
                  <span className="w-2 h-2 bg-primary-400 rounded-full mr-3"></span>
                  Modern UI Theme Applied
                </div>
                <div className="flex items-center justify-center text-secondary-500">
                  <span className="w-2 h-2 bg-secondary-400 rounded-full mr-3"></span>
                  Upload-Focused Interface
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowLogin(true)}
              className="gradient-primary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Access Admin Panel
            </button>
            <p className="text-light-500 text-sm mt-4">
              Backend server: localhost:5000
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ===== MAIN APP WITH ROUTER =====
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes */}
        <Route path="/*" element={<AdminPages />} />
        
        {/* Watch page - Public route */}
        <Route path="/watch/:episodeId" element={<WatchPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App