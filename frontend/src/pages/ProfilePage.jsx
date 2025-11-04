import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import profileService from '../services/profileService';
import authService from '../services/authService';
import Header from '../components/public/Header';

const BACKEND_URL = 'http://localhost:5000';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout, isAuthenticated } = useAuthStore();
  const fileInputRef = useRef(null);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile form
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('Không xác định');
  const [avatarPreview, setAvatarPreview] = useState('');

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    // Load profile data
    if (user) {
      setDisplayName(user.displayName || '');
      setGender(user.gender || 'Không xác định');
      
      // Set avatar preview
      if (user.avatar) {
        const avatarUrl = user.avatar.startsWith('/assets') 
          ? user.avatar 
          : `${BACKEND_URL}${user.avatar}`;
        setAvatarPreview(avatarUrl);
      } else {
        setAvatarPreview('/assets/default-avatar.png');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!displayName.trim()) {
      setError('Tên hiển thị không được để trống');
      return;
    }

    try {
      setIsLoading(true);
      const result = await profileService.updateProfile(displayName, gender);
      
      // Update store
      updateUser(result.data);
      
      setSuccess('Cập nhật thông tin thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.error || 'Cập nhật thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước file tối đa 5MB');
      return;
    }

    setError('');
    setSuccess('');

    try {
      setIsLoading(true);
      const result = await profileService.uploadAvatar(file);
      
      // Update avatar preview
      const newAvatarUrl = `${BACKEND_URL}${result.data.avatar}`;
      setAvatarPreview(newAvatarUrl);
      
      // Update store
      updateUser({ avatar: result.data.avatar });
      
      setSuccess('Cập nhật ảnh đại diện thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.error || 'Tải ảnh thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete avatar
  const handleDeleteAvatar = async () => {
    if (!confirm('Bạn có chắc muốn xóa ảnh đại diện?')) return;

    setError('');
    setSuccess('');

    try {
      setIsLoading(true);
      await profileService.deleteAvatar();
      
      // Update to default avatar
      setAvatarPreview('/assets/default-avatar.png');
      updateUser({ avatar: '/assets/default-avatar.png' });
      
      setSuccess('Đã xóa ảnh đại diện!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.error || 'Xóa ảnh thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setIsLoading(true);
      await authService.changePassword(currentPassword, newPassword);
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      
      // Logout and redirect
      logout();
      alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      navigate('/');
    } catch (err) {
      setError(err.error || 'Đổi mật khẩu thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <Header />
      
      <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tài khoản</h1>
          <p className="text-gray-600">Cập nhật thông tin tài khoản</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-500">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg">
            <p className="text-green-500">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Avatar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <img
                    src={avatarPreview || '/assets/default-avatar.png'}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={handleAvatarClick}
                      className="text-white text-sm"
                      disabled={isLoading}
                    >
                      📷 Ảnh có sẵn
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {user?.displayName}
                </h3>
                <p className="text-gray-500 text-sm">{user?.email}</p>

                {/* Premium Badge */}
                {user?.isPremium && (
                  <span className="mt-2 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                    ⭐ PREMIUM
                  </span>
                )}

                {/* Avatar Actions */}
                <div className="mt-4 space-y-2 w-full">
                  <button
                    onClick={handleAvatarClick}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Đổi ảnh
                  </button>
                  {!avatarPreview?.includes('default-avatar') && (
                    <button
                      onClick={handleDeleteAvatar}
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Thông tin cá nhân
              </h2>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Email (Read-only) */}
                <div>
                  <label className="block text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed border border-gray-200"
                  />
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-gray-700 mb-2">
                    Tên hiển thị <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tên hiển thị"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-gray-700 mb-2">Giới tính</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="Nam"
                        checked={gender === 'Nam'}
                        onChange={(e) => setGender(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Nam</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="Nữ"
                        checked={gender === 'Nữ'}
                        onChange={(e) => setGender(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Nữ</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="Không xác định"
                        checked={gender === 'Không xác định'}
                        onChange={(e) => setGender(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Không xác định</span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-black font-semibold rounded-lg transition-colors"
                >
                  {isLoading ? 'Đang lưu...' : 'Cập nhật'}
                </button>
              </form>
            </div>

            {/* Password Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Bảo mật
              </h2>
              <p className="text-gray-600 mb-4">
                Đổi mật khẩu, nhấn vào <span className="text-yellow-500 cursor-pointer" onClick={() => setShowPasswordModal(true)}>đây</span>
              </p>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 rounded-lg transition-colors"
              >
                Đổi mật khẩu
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Đổi mật khẩu
                </h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-gray-300 mb-2">
                    Mật khẩu cũ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mật khẩu cũ"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-gray-300 mb-2">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-gray-300 mb-2">
                    Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-black font-semibold rounded-lg transition-colors"
                  >
                    {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default ProfilePage;
