import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../../components/admin/AdminHeader';
import axios from 'axios';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const usersPerPage = 18; // 6 columns x 3 rows

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('admin-token');
      
      if (!token) {
        navigate('/admin/login');
        return;
      }
      
      const response = await axios.get(
        `${API_URL}/api/admin/users?page=${currentPage}&limit=${usersPerPage}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('👥 Fetched users:', response.data.data.users);

      if (response.data.success) {
        setUsers(response.data.data.users || []);
        setTotalPages(response.data.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('admin-token');
        localStorage.removeItem('admin-user');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    
    // If avatar starts with /assets, it's a default avatar
    if (avatarPath.startsWith('/assets')) {
      return avatarPath;
    }
    
    // Otherwise, prepend API URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${API_URL}${avatarPath}`;
  };

  const getDefaultAvatar = (displayName) => {
    // Generate color based on first letter
    const firstLetter = (displayName || 'U')[0].toUpperCase();
    const colors = [
      'from-red-400 to-pink-400',
      'from-blue-400 to-cyan-400',
      'from-green-400 to-emerald-400',
      'from-purple-400 to-violet-400',
      'from-orange-400 to-amber-400',
      'from-indigo-400 to-blue-400',
    ];
    const colorIndex = firstLetter.charCodeAt(0) % colors.length;
    
    return (
      <div className={`w-full h-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white text-3xl font-bold`}>
        {firstLetter}
      </div>
    );
  };

  const getDefaultAvatarClass = (displayName) => {
    // Same logic as getDefaultAvatar but returns only the color class
    const firstLetter = (displayName || 'U')[0].toUpperCase();
    const colors = [
      'from-red-400 to-pink-400',
      'from-blue-400 to-cyan-400',
      'from-green-400 to-emerald-400',
      'from-purple-400 to-violet-400',
      'from-orange-400 to-amber-400',
      'from-indigo-400 to-blue-400',
    ];
    const colorIndex = firstLetter.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-6 gap-4">
              {[...Array(18)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Danh sách thành viên</h1>
          <p className="text-gray-600 mt-2">
            Tổng số: <span className="font-semibold text-purple-600">{users.length}</span> thành viên
          </p>
        </div>

        {/* Users Grid - Box container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          
          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Không có thành viên nào
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {users.map(user => (
                <div 
                  key={user._id}
                  className="group"
                >
                  {/* User Card */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer">
                    
                    {/* Avatar */}
                    <div className="aspect-square rounded-full overflow-hidden mb-3 ring-2 ring-gray-200 group-hover:ring-purple-400 transition-all">
                      {user.avatar && user.avatar !== '/assets/default-avatar.png' ? (
                        <>
                          <img 
                            src={getAvatarUrl(user.avatar)} 
                            alt={user.displayName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('❌ Avatar load failed for:', user.displayName, user.avatar);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div style={{ display: 'none' }} className={`w-full h-full bg-gradient-to-br ${getDefaultAvatarClass(user.displayName)} flex items-center justify-center text-white text-3xl font-bold`}>
                            {(user.displayName || 'U')[0].toUpperCase()}
                          </div>
                        </>
                      ) : (
                        getDefaultAvatar(user.displayName)
                      )}
                    </div>
                    
                    {/* Name */}
                    <p className="text-sm font-semibold text-gray-900 text-center truncate group-hover:text-purple-600 transition-colors">
                      {user.displayName || 'Unknown User'}
                    </p>
                    
                    {/* Role badge - optional */}
                    {user.role === 'vip' && (
                      <div className="mt-2 text-center">
                        <span className="inline-block px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full">
                          VIP
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Trước
              </button>
              
              <span className="text-gray-700 font-medium">
                Trang {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sau →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
