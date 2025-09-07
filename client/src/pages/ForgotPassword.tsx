import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { validateEmail } from '../utils/validate';
import { sendForgotPasswordRequest } from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please provide a valid email address');
      return;
    }

    try {
      setLoading(true);
      const response = await sendForgotPasswordRequest(email);
      if (response.success) {
        navigate('/reset-password', { state: { emailOrPhone: email, isPhone: false } });
      } else {
        setError(response.message || 'There was a problem sending OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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
              <span className="text-4xl">🔑</span>
            </div>
            <p className="text-gray-600">আপনার ইমেইলে OTP পাঠাবো</p>
          </div>

          {/* Reset Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 relative overflow-hidden">
            {/* Decorative Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400"></div>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">পাসওয়ার্ড ভুলে গেছেন?</h3>
              <p className="text-gray-600">
                চিন্তার কিছু নেই! আমরা আপনাকে সাহায্য করবো 💝
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center animate-pulse">
                <span className="text-xl mr-2">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">
                  📧 ইমেইল 
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="example@gmail.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 bg-white/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 transform
                  ${loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:scale-105 hover:shadow-lg active:scale-95'
                  } 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
              >
                <div className="flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📨</span>
                      OTP পাঠান
                    </>
                  )}
                </div>
              </button>

              <div className="text-center mt-6">
                <Link 
                  to="/login" 
                  className="text-orange-500 hover:text-orange-600 font-medium transition-colors duration-200 hover:underline flex items-center justify-center"
                >
                  <span className="mr-1">←</span>
                  লগইন পেজে ফিরে যান
                </Link>
              </div>
            </form>

            {/* Decorative Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-500">
                <span className="inline-flex items-center">
                  <span className="mr-1">🔐</span>
                  আপনার তথ্য সুরক্ষিত
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;