import { useNavigate } from 'react-router-dom'
import AdminHeader from '../../components/admin/AdminHeader'
import { Upload, Bell } from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      {/* Admin Header */}
      <AdminHeader />
      
      {/* Main Content - Centered with 2 boxes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        
        {/* Two Main Cards - Centered */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: Content Management - Cyan to Pink */}
          <div 
            className="bg-white rounded-2xl shadow-xl p-8 border-l-4 border-cyan-500 hover:shadow-2xl transition-all cursor-pointer group"
            onClick={() => navigate('/admin/upload')}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-light-900 mb-3 group-hover:text-cyan-600 transition-colors">
              Quản lý nội dung
            </h3>
            <p className="text-light-600 mb-6 text-sm leading-relaxed">
              Quản lý nội dung và tải lên
            </p>
            
            <button 
              className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl shadow-md group-hover:shadow-lg transition-all"
            >
              Quản lý →
            </button>
          </div>

          {/* Card 2: Admin Notifications - Pink to Cyan (reversed) */}
          <div 
            className="bg-white rounded-2xl shadow-xl p-8 border-l-4 border-pink-500 hover:shadow-2xl transition-all cursor-pointer group"
            onClick={() => navigate('/admin/noti')}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Bell className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-light-900 mb-3 group-hover:text-pink-600 transition-colors">
              Thông báo quản trị viên
            </h3>
            <p className="text-light-600 mb-6 text-sm leading-relaxed">
              Quản lý thông báo về các hoạt động và tiến trình
            </p>
            
            <button 
              className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-xl shadow-md group-hover:shadow-lg transition-all"
            >
              Xem Thông báo →
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
