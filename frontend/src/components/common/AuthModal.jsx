import { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader } from 'lucide-react';
import authService from '../../services/authService';
import useAuthStore from '../../stores/authStore';

/**
 * Auth Modal Component
 * Modal đăng nhập/đăng ký cho user
 */
const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'verify'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Remember me checkbox
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: ''
  });

  // Auth store
  const { login } = useAuthStore();

  // Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login(
        formData.emailOrUsername,
        formData.password
      );

      const { user, accessToken, refreshToken } = response.data;

      // Save to auth store
      login(user, accessToken, refreshToken);

      // If "Remember me" is NOT checked, set session to expire when browser closes
      if (!rememberMe) {
        // Clear localStorage after closing browser
        // Note: We'll still save to localStorage but mark it as session-only
        localStorage.setItem('user-session-only', 'true');
      } else {
        localStorage.removeItem('user-session-only');
      }

      setSuccess('Đăng nhập thành công!');
      
      // Close modal after 1 second
      setTimeout(() => {
        onClose();
        window.location.reload(); // Reload to update UI
      }, 1000);

    } catch (err) {
      setError(err.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.username || !formData.displayName || !formData.password) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register(
        formData.email,
        formData.username,
        formData.displayName,
        formData.password
      );

      setSuccess(response.message);
      setMode('verify');
      
      // Clear form
      setFormData({
        emailOrUsername: '',
        email: '',
        username: '',
        displayName: '',
        password: '',
        confirmPassword: ''
      });

    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        setError(err.errors.map(e => e.msg).join(', '));
      } else {
        setError(err.error || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend verification
  const handleResendVerification = async () => {
    if (!formData.email) {
      setError('Vui lòng nhập email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.resendVerification(formData.email);
      setSuccess('Email xác thực đã được gửi lại!');
    } catch (err) {
      setError(err.error || 'Gửi email thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {mode === 'login' && 'Đăng nhập'}
              {mode === 'register' && 'Đăng ký'}
              {mode === 'verify' && 'Xác thực Email'}
            </h2>
            <p className="text-slate-400">
              {mode === 'login' && (
                <>
                  Nếu bạn chưa có tài khoản,{' '}
                  <button
                    onClick={() => {
                      setMode('register');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-yellow-400 hover:text-yellow-300 font-medium"
                  >
                    đăng ký ngay
                  </button>
                </>
              )}
              {mode === 'register' && (
                <>
                  Đã có tài khoản?{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-yellow-400 hover:text-yellow-300 font-medium"
                  >
                    Đăng nhập
                  </button>
                </>
              )}
              {mode === 'verify' && 'Kiểm tra email để xác thực tài khoản'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-200 text-sm flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email/Username */}
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    name="emailOrUsername"
                    value={formData.emailOrUsername}
                    onChange={handleChange}
                    placeholder="Email hoặc Username"
                    className="w-full bg-slate-700 text-white pl-11 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mật khẩu"
                    className="w-full bg-slate-700 text-white pl-11 pr-11 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-yellow-400 bg-slate-700 border-slate-600 rounded focus:ring-yellow-400 focus:ring-2"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-300 select-none cursor-pointer">
                  Lưu đăng nhập
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>

              {/* Forgot password */}
              <div className="text-center">
                <button
                  type="button"
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Quên mật khẩu?
                </button>
              </div>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Email */}
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full bg-slate-700 text-white pl-11 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username"
                    className="w-full bg-slate-700 text-white pl-11 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                </div>
              </div>

              {/* Display Name */}
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="Tên hiển thị"
                    className="w-full bg-slate-700 text-white pl-11 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mật khẩu"
                    className="w-full bg-slate-700 text-white pl-11 pr-11 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Xác nhận mật khẩu"
                    className="w-full bg-slate-700 text-white pl-11 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng ký'
                )}
              </button>
            </form>
          )}

          {/* Verify Email Screen */}
          {mode === 'verify' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-yellow-400" size={32} />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                Kiểm tra Email của bạn
              </h3>
              
              <p className="text-slate-400 mb-6">
                Chúng tôi đã gửi email xác thực đến <strong className="text-white">{formData.email}</strong>
              </p>

              <div className="bg-slate-700 rounded-lg p-4 mb-6">
                <p className="text-slate-300 text-sm">
                  Không nhận được email?{' '}
                  <button
                    onClick={handleResendVerification}
                    disabled={isLoading}
                    className="text-yellow-400 hover:text-yellow-300 font-medium"
                  >
                    Gửi lại
                  </button>
                </p>
              </div>

              <button
                onClick={() => {
                  setMode('login');
                  setSuccess('');
                }}
                className="text-slate-400 hover:text-white"
              >
                Quay lại đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
