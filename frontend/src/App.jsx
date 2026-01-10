import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import './index.css'
import AdminLogin from './pages/admin/AdminLogin'
import UploadCenter from './pages/admin/UploadCenter'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminDashboard from './pages/admin/AdminDashboard'
import WatchPage from './pages/WatchPage'
import HomePage from './pages/HomePage'
import SeriesDetail from './pages/SeriesDetail/SeriesDetail'
import AdvancedSearch from './pages/AdvancedSearch/AdvancedSearch'
import ProfilePage from './pages/ProfilePageNew'
import PremiumPage from './pages/PremiumPage'
import useAuthStore from './stores/authStore'
import ChatBubble from './components/ChatBubble'

// Component to conditionally show ChatBubble
function ConditionalChatBubble() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isWatchRoute = location.pathname.startsWith('/watch');
  const showChatBubble = !isAdminRoute && !isWatchRoute;

  return showChatBubble ? <ChatBubble /> : null;
}

// Admin Layout Wrapper
function AdminLayout({ children, handleLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const adminUser = JSON.parse(localStorage.getItem('admin-user') || '{}')
  
  // Determine page title and back button
  const getPageConfig = () => {
    if (location.pathname === '/admin/upload') {
      return {
        title: 'Upload Center',
        showBack: true,
        backAction: () => navigate('/admin')
      }
    }
    if (location.pathname === '/admin/noti') {
      return {
        title: 'Thông báo',
        showBack: false,
        showHomeButton: true,
        homeAction: () => navigate('/admin')
      }
    }
    return {
      title: 'Anime Streaming Admin',
      showBack: false
    }
  }
  
  const config = getPageConfig()
  
  return (
    <div className="min-h-screen bg-light-50">
      <nav className="nav-sticky gradient-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {config.showBack && (
                <button
                  onClick={config.backAction}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  ← Quay lại Dashboard
                </button>
              )}
              
              {config.showHomeButton ? (
                <button
                  onClick={config.homeAction}
                  className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  title="Về trang chủ"
                >
                  <span className="text-primary-500 font-bold text-xl">A</span>
                </button>
              ) : (
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-primary-500 font-bold text-xl">A</span>
                </div>
              )}
              
              <h1 className="text-xl font-bold text-white">{config.title}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-white/90 text-sm font-medium">
                  {adminUser.displayName || 'Admin'}
                </p>
                <p className="text-white/70 text-xs">{adminUser.username}</p>
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
      </nav>
      {children}
    </div>
  )
}

function App() {
  const [showLogin, setShowLogin] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Hydrate user auth from localStorage on app mount
  const authStore = useAuthStore();

  useEffect(() => {
    // Admin auth check (existing)
    const token = localStorage.getItem('admin-token')
    const adminUser = localStorage.getItem('admin-user')
    
    if (token && adminUser) {
      setIsAuthenticated(true)
    }

    // User auth hydration happens automatically via Zustand persist
    const userAccessToken = localStorage.getItem('user-access-token');
    if (userAccessToken && !authStore.isAuthenticated) {
      console.log('User session detected, restoring...');
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
  }

  // ===== ADMIN PAGES COMPONENT =====
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

    if (!isAuthenticated) {
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

    // Authenticated - Show nested routes
    return (
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/upload" element={<UploadCenter />} />
        <Route path="/noti" element={<AdminNotifications />} />
      </Routes>
    )
  }

  // ===== MAIN APP WITH ROUTER =====
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Homepage */}
        <Route path="/" element={<HomePage />} />
        
        {/* Advanced Search page - Public route */}
        <Route path="/search" element={<AdvancedSearch />} />
        
        {/* Series Detail page - Public route */}
        <Route path="/series/:slug" element={<SeriesDetail />} />
        
        {/* Watch page - Public route */}
        <Route path="/watch/:episodeId" element={<WatchPage />} />
        
        {/* User Profile page - Protected route */}
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* Premium page - Public route */}
        <Route path="/premium" element={<PremiumPage />} />
        
        {/* Admin routes */}
        <Route path="/admin/*" element={<AdminPages />} />
      </Routes>
      
      {/* Chat Bubble - Conditional based on route */}
      <ConditionalChatBubble />
    </BrowserRouter>
  )
}

export default App