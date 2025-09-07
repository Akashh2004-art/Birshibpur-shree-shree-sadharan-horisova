import { useState, FormEvent, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { verifyOTP, setNewPassword } from '../utils/api';

const ResetPassword = () => {
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get email from state passed from ForgotPassword
  const emailOrPhone = location.state?.emailOrPhone;

  useEffect(() => {
    // If no email/phone in state, redirect to forgot password
    if (!emailOrPhone) {
      navigate('/forgot-password');
    }
  }, [emailOrPhone, navigate]);

  const validatePassword = (password: string) => {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password) && 
           /[!@#$%^&*]/.test(password);
  };

  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length < 6) {
      setError('Enter the correct OTP (6 digits).');
      return;
    }

    if (!emailOrPhone) {
      setError('Email/phone not found. Please try again.');
      return;
    }

    try {
      setLoading(true);
      const response = await verifyOTP(emailOrPhone, otp);
      
      if (response.success) {
        setIsOtpVerified(true);
        setError('');
      } else {
        setError(response.message || 'ভুল OTP');
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err.message || 'There was a problem verifying the OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!emailOrPhone || !otp || !password) {
      setError('Email, OTP, and password are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password not match.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password requires at least 8 characters, upper/lower case letters, numbers, and special characters.');
      return;
    }

    try {
      setLoading(true);
      const response = await setNewPassword(emailOrPhone, otp, password);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.message || 'There was a problem setting the password.');
      }
    } catch (err: any) {
      console.error('Set password error:', err);
      setError(err.message || 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading if no email/phone
  if (!emailOrPhone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl">🕉️</div>
        <div className="absolute top-32 right-20 text-4xl">🪔</div>
        <div className="absolute bottom-32 left-20 text-5xl">🏛️</div>
        <div className="absolute bottom-10 right-10 text-4xl">🙏</div>
        <div className="absolute top-1/2 left-1/4 text-3xl">🌸</div>
        <div className="absolute top-1/4 right-1/3 text-4xl">📿</div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Logo/Header Section */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg mb-4">
              <span className="text-4xl">{isOtpVerified ? '🔒' : '🔐'}</span>
            </div>
            <p className="text-gray-600">
              {isOtpVerified ? 'নতুন পাসওয়ার্ড সেট করুন' : 'আপনার ইমেইলে পাঠানো OTP দিন'}
            </p>
          </div>

          {/* Reset Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 relative overflow-hidden">
            {/* Decorative Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400"></div>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                {isOtpVerified ? 'নতুন পাসওয়ার্ড তৈরি করুন' : 'OTP ভেরিফাই করুন'}
              </h3>
              <p className="text-gray-600 text-sm">
                {isOtpVerified 
                  ? 'একটি শক্তিশালী পাসওয়ার্ড বেছে নিন 🔐' 
                  : `${emailOrPhone} এ OTP পাঠানো হয়েছে 📧`
                }
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center animate-pulse">
                <span className="text-xl mr-2">⚠️</span>
                {error}
              </div>
            )}

            {success ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center animate-pulse">
                <span className="text-xl mr-2">✅</span>
                <div>
                  <p className="font-medium">পাসওয়ার্ড সফলভাবে সেট হয়েছে!</p>
                  <p className="text-sm">লগইন পেজে যাচ্ছি...</p>
                </div>
              </div>
            ) : (
              <>
                {!isOtpVerified ? (
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="otp" className="block text-gray-700 mb-2 font-medium">
                        🔢 OTP কোড
                      </label>
                      <input
                        id="otp"
                        type="text"
                        required
                        placeholder="৬ সংখ্যার OTP"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 bg-white/50 text-center text-2xl tracking-widest"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength={6}
                        disabled={loading}
                      />
                    </div>
                    <button
                      onClick={handleVerifyOTP}
                      disabled={loading || otp.length !== 6}
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 transform
                        ${loading || otp.length !== 6
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:scale-105 hover:shadow-lg active:scale-95'
                        } 
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
                    >
                      <div className="flex items-center justify-center">
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            <span>ভেরিফাই হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <span className="mr-2">✓</span>
                            OTP ভেরিফাই করুন
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="password" className="block text-gray-700 mb-2 font-medium">
                        🔒 নতুন পাসওয়ার্ড
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="শক্তিশালী পাসওয়ার্ড দিন"
                          className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 bg-white/50"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <span className="text-gray-400 hover:text-gray-600 text-xl transition-colors">
                            {showPassword ? '🙈' : '👁️'}
                          </span>
                        </button>
                      </div>
                      {password && (
                        <div className="mt-1">
                          <div className={`text-xs ${validatePassword(password) ? 'text-green-600' : 'text-red-600'}`}>
                            {validatePassword(password) ? '✅ Strong password' : '❌ Password is weak'}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-gray-700 mb-2 font-medium">
                        🔒 পাসওয়ার্ড নিশ্চিত করুন
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          placeholder="পাসওয়ার্ড আবার দিন"
                          className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 bg-white/50"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <span className="text-gray-400 hover:text-gray-600 text-xl transition-colors">
                            {showConfirmPassword ? '🙈' : '👁️'}
                          </span>
                        </button>
                      </div>
                      {confirmPassword && (
                        <div className="mt-1">
                          <div className={`text-xs ${password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                            {password === confirmPassword ? '✅ Password matched' : '❌ Password not match'}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Password Requirements */}
                    <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl">
                      <p className="text-blue-800 text-sm font-medium mb-1">পাসওয়ার্ডের প্রয়োজনীয়তা:</p>
                      <ul className="text-blue-700 text-xs space-y-1">
                        <li className={password.length >= 8 ? 'text-green-600' : ''}>
                          {password.length >= 8 ? '✅' : '•'} কমপক্ষে ৮ অক্ষর
                        </li>
                        <li className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-green-600' : ''}>
                          {/[A-Z]/.test(password) && /[a-z]/.test(password) ? '✅' : '•'} বড় এবং ছোট হাতের অক্ষর
                        </li>
                        <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                          {/[0-9]/.test(password) ? '✅' : '•'} কমপক্ষে একটি সংখ্যা
                        </li>
                        <li className={/[!@#$%^&*]/.test(password) ? 'text-green-600' : ''}>
                          {/[!@#$%^&*]/.test(password) ? '✅' : '•'} কমপক্ষে একটি বিশেষ অক্ষর (!@#$%^&*)
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={handleSetPassword}
                      disabled={loading || !validatePassword(password) || password !== confirmPassword}
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 transform
                        ${loading || !validatePassword(password) || password !== confirmPassword
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:scale-105 hover:shadow-lg active:scale-95'
                        } 
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
                    >
                      <div className="flex items-center justify-center">
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            <span>সেট হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <span className="mr-2">🔐</span>
                            পাসওয়ার্ড সেট করুন
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Back to Forgot Password Link */}
            <div className="text-center mt-6">
              <Link 
                to="/forgot-password" 
                className="text-orange-500 hover:text-orange-600 font-medium transition-colors duration-200 hover:underline flex items-center justify-center"
              >
                <span className="mr-1">←</span>
                OTP আবার পাঠান
              </Link>
            </div>

            {/* Decorative Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-500">
                <span className="inline-flex items-center">
                  <span className="mr-1">🛡️</span>
                  {isOtpVerified 
                    ? 'আপনার নতুন পাসওয়ার্ড এনক্রিপ্ট করা হবে'
                    : 'OTP ১০ মিনিটের জন্য বৈধ'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;