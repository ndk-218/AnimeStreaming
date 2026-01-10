import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

export default function AdminHeader() {
  const navigate = useNavigate();
  const { admin, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate('/admin/login');
  };

  return (
    <header className="bg-gradient-to-r from-primary-400 to-primary-500 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo + Title */}
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => navigate('/admin')}
          >
            {/* Golden Logo */}
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            
            {/* Title */}
            <div>
              <h1 className="text-white font-bold text-xl">Golden</h1>
              <p className="text-white/80 text-xs">Admin Panel</p>
            </div>
          </div>

          {/* Right: Admin Info + Logout */}
          <div className="flex items-center space-x-4">
            {/* Admin Name */}
            <div className="text-right hidden sm:block">
              <p className="text-white text-sm font-medium">
                {admin?.username || 'Admin'}
              </p>
              <p className="text-white/70 text-xs">Administrator</p>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all backdrop-blur-sm"
            >
              Logout
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
