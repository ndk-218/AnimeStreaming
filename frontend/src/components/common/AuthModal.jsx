import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader } from 'lucide-react';
import authService from '../../services/authService';
import useAuthStore from '../../stores/authStore';

/**
 * Auth Modal Component
 * Modal đăng nhập/đăng ký cho user
 */
const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'success' | 'forgot' | 'verify-otp' | 'reset-password'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Remember me checkbox
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // OTP state
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    otp: '' // For OTP input
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
      
      // Switch to success screen
      setMode('success');
      
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

  // Removed: handleResendVerification function - no longer needed

  /**
   * ===== OTP FORGOT PASSWORD HANDLERS =====
   */

  // Handle request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email) {
      setError('Vui lòng nhập email');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.requestOTP(formData.email);
      setSuccess(response.message);
      
      // Switch to verify OTP screen
      setMode('verify-otp');
      
      // Start countdown (120 seconds)
      setOtpCountdown(120);
      setCanResend(false);

    } catch (err) {
      setError(err.error || 'Gửi mã OTP thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.otp || formData.otp.length !== 6) {
      setError('Vui lòng nhập mã OTP 6 số');
      return;
    }

    setIsLoading(true);

    try {
      await authService.verifyOTP(formData.email, formData.otp);
      setSuccess('Mã OTP đúng! Vui lòng nhập mật khẩu mới.');
      
      // Switch to reset password screen
      setTimeout(() => {
        setMode('reset-password');
        setSuccess('');
      }, 1000);

    } catch (err) {
      setError(err.error || 'Mã OTP không đúng');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset password with OTP
  const handleResetPasswordOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.password || formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPasswordWithOTP(
        formData.email,
        formData.password
      );
      
      setSuccess(response.message);
      
      // Clear form and go back to login after 2 seconds
      setTimeout(() => {
        setMode('login');
        setFormData({
          emailOrUsername: '',
          email: '',
          username: '',
          displayName: '',
          password: '',
          confirmPassword: '',
          otp: ''
        });
        setSuccess('');
        setError('');
      }, 2000);

    } catch (err) {
      setError(err.error || 'Đặt lại mật khẩu thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;

    setError('');
    setIsLoading(true);

    try {
      const response = await authService.requestOTP(formData.email);
      setSuccess('Mã OTP mới đã được gửi!');
      
      // Restart countdown
      setOtpCountdown(120);
      setCanResend(false);
      
      // Clear OTP input
      setFormData(prev => ({ ...prev, otp: '' }));

    } catch (err) {
      setError(err.error || 'Gửi lại mã OTP thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => {
        setOtpCountdown(otpCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (otpCountdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [otpCountdown, canResend]);

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
              {mode === 'success' && 'Đăng ký thành công!'}
              {mode === 'forgot' && 'Quên mật khẩu'}
              {mode === 'verify-otp' && 'Xác thực OTP'}
              {mode === 'reset-password' && 'Đặt lại mật khẩu'}
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
                  onClick={() => {
                    setMode('forgot');
                    setError('');
                    setSuccess('');
                  }}
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

          {/* Success Screen */}
          {mode === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                Chúc mừng!
              </h3>
              
              <p className="text-slate-300 mb-6">
                Tài khoản của bạn đã được tạo thành công. <br />
                Bạn có thể đăng nhập ngay bây giờ!
              </p>

              <button
                onClick={() => {
                  setMode('login');
                  setSuccess('');
                  setError('');
                }}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 rounded-lg transition-colors"
              >
                Chuyển đến Đăng nhập
              </button>
            </div>
          )}

          {/* Forgot Password Screen */}
          {mode === 'forgot' && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <p className="text-slate-300 text-center mb-4">
                Nhập email của bạn, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
              </p>

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

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi mã OTP'
                )}
              </button>

              {/* Back to login */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </form>
          )}

          {/* Verify OTP Screen */}
          {mode === 'verify-otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="text-purple-400" size={32} />
                </div>
                <p className="text-slate-300">
                  Mã OTP đã được gửi đến <strong className="text-white">{formData.email}</strong>
                </p>
              </div>

              {/* OTP Input */}
              <div>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Nhập mã OTP 6 số"
                  maxLength={6}
                  className="w-full bg-slate-700 text-white text-center text-2xl font-bold tracking-widest px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>

              {/* Countdown */}
              <div className="text-center">
                {otpCountdown > 0 ? (
                  <p className="text-slate-400 text-sm">
                    Mã OTP còn hiệu lực trong <strong className="text-yellow-400">{otpCountdown}s</strong>
                  </p>
                ) : (
                  <p className="text-red-400 text-sm">
                    Mã OTP đã hết hạn
                  </p>
                )}
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
                    Đang xác thực...
                  </>
                ) : (
                  'Xác thực OTP'
                )}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={!canResend || isLoading}
                  className="text-slate-400 hover:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {canResend ? 'Gửi lại mã OTP' : `Gửi lại sau ${otpCountdown}s`}
                </button>
              </div>
            </form>
          )}

          {/* Reset Password Screen */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPasswordOTP} className="space-y-4">
              <p className="text-slate-300 text-center mb-4">
                Nhập mật khẩu mới của bạn
              </p>

              {/* New Password */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mật khẩu mới"
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
                  'Đổi mật khẩu'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
