import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import profileService from '../../services/profileService';
import authService from '../../services/authService';

const BACKEND_URL = 'http://localhost:5000';

const ProfileAccount = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('Không xác định');
  const [avatarPreview, setAvatarPreview] = useState('');
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setGender(user.gender || 'Không xác định');
      
      if (user.avatar) {
        const avatarUrl = user.avatar.startsWith('/assets') 
          ? user.avatar 
          : `${BACKEND_URL}${user.avatar}`;
        setAvatarPreview(avatarUrl);
      } else {
        setAvatarPreview('/assets/default-avatar.png');
      }
    }
  }, [user]);

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
      
      // Update authStore with new data
      if (result.success && result.data) {
        console.log('📝 Updating user in authStore:', result.data);
        
        // Make sure to update with the exact data from backend
        updateUser({
          displayName: result.data.displayName,
          gender: result.data.gender
        });
        
        console.log('✅ AuthStore updated successfully');
      }
      
      setSuccess('Cập nhật thông tin thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Update profile error:', err);
      setError(err.error || 'Cập nhật thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước file tối đa 5MB');
      return;
    }

    setError('');
    setSuccess('');

    try {
      setIsLoading(true);
      const result = await profileService.uploadAvatar(file);
      const newAvatarUrl = `${BACKEND_URL}${result.data.avatar}`;
      setAvatarPreview(newAvatarUrl);
      updateUser({ avatar: result.data.avatar });
      setSuccess('Cập nhật ảnh đại diện thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.error || 'Tải ảnh thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Bạn có chắc muốn xóa ảnh đại diện?')) return;

    setError('');
    setSuccess('');

    try {
      setIsLoading(true);
      await profileService.deleteAvatar();
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
      await authService.changePassword(currentPassword, newPassword, confirmPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
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
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ảnh đại diện
          </h3>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <img
                src={avatarPreview || '/assets/default-avatar.png'}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={handleAvatarClick}
                  className="text-white text-sm"
                  disabled={isLoading}
                >
                  📷 Đổi
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

            <div className="flex gap-3">
              <button
                onClick={handleAvatarClick}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                Đổi ảnh
              </button>
              {!avatarPreview?.includes('default-avatar') && (
                <button
                  onClick={handleDeleteAvatar}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  Xóa ảnh
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Thông tin cá nhân
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed border border-gray-200"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Tên hiển thị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên hiển thị"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Giới tính</label>
              <div className="flex gap-4">
                {['Nam', 'Nữ', 'Không xác định'].map((g) => (
                  <label key={g} className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={gender === g}
                      onChange={(e) => setGender(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-gray-900">{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-black font-semibold rounded-lg transition-colors"
            >
              {isLoading ? 'Đang lưu...' : 'Cập nhật'}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Bảo mật
          </h3>
          <p className="text-gray-600 mb-4">
            Đổi mật khẩu của bạn
          </p>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 rounded-lg transition-colors"
          >
            Đổi mật khẩu
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Đổi mật khẩu
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Mật khẩu cũ <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mật khẩu cũ"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-black font-semibold rounded-lg transition-colors"
                >
                  {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors"
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileAccount;
