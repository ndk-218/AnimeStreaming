import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Heart, Clock, Bell } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import Header from '../components/public/Header';
import ProfileAccount from '../components/profile/ProfileAccount';
import ProfileFavorites from '../components/profile/ProfileFavorites';
import ProfileContinueWatching from '../components/profile/ProfileContinueWatching';
import ProfileNotifications from '../components/profile/ProfileNotifications';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  
  // Get current tab from URL params, default to 'account'
  const currentTab = searchParams.get('tab') || 'account';

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  // Sidebar menu items
  const menuItems = [
    { id: 'account', label: 'Tài khoản', icon: User },
    { id: 'favorites', label: 'Yêu thích', icon: Heart },
    { id: 'continue', label: 'Xem tiếp', icon: Clock },
    { id: 'notifications', label: 'Thông báo', icon: Bell }
  ];

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Sidebar - Menu */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden sticky top-24">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Quản lý tài khoản
                  </h2>
                </div>
                
                <nav className="p-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={20} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-3">
              {currentTab === 'account' && <ProfileAccount />}
              {currentTab === 'favorites' && <ProfileFavorites />}
              {currentTab === 'continue' && <ProfileContinueWatching />}
              {currentTab === 'notifications' && <ProfileNotifications />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
