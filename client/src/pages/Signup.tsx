import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/signUpWithGoogle';

const Signup = () => {
  const navigate = useNavigate();
  useAuth(); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = async (userData: { needsPassword: any; user: any; token: any; }) => {
    try {
      setLoading(true);
      setError('');
      
      if (userData.needsPassword) {
        navigate('/set-password', { 
          state: { 
            user: userData.user,
            token: userData.token 
          }
        });
      } else {
        
        // Clear any stored data from signup process
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        
        alert('✅ Sign up successful! Login now');
        
        navigate('/login');
      }
    } catch (err) {
      console.error('Google signup error:', err);
      setError('Google sign-up failed. Try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 text-6xl">🕉️</div>
        <div className="absolute top-32 left-20 text-4xl">🪔</div>
        <div className="absolute bottom-32 right-20 text-5xl">🏛️</div>
        <div className="absolute bottom-10 left-10 text-4xl">🙏</div>
        <div className="absolute top-1/2 right-1/4 text-3xl">🌸</div>
        <div className="absolute top-1/4 left-1/3 text-4xl">📿</div>
        <div className="absolute top-3/4 left-1/2 text-3xl">🌺</div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Logo/Header Section */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg mb-4">
              <span className="text-4xl">🏛️</span>
            </div>
            <p className="text-gray-600">নতুন সদস্য হিসেবে যোগ দিন</p>
          </div>

          {/* Signup Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 relative overflow-hidden">
            {/* Decorative Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400"></div>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">নতুন অ্যাকাউন্ট তৈরি করুন</h3>
              <p className="text-gray-600">
                ইতিমধ্যে সদস্য?{" "}
                <Link 
                  to="/login" 
                  className="text-orange-500 hover:text-orange-600 font-medium transition-colors duration-200 hover:underline"
                >
                  এখানে লগইন করুন
                </Link>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center animate-pulse">
                <span className="text-xl mr-2">⚠️</span>
                <div>
                  <p className="font-medium">There was a problem!</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl mb-6 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <div>
                  <p className="font-medium">Please wait...</p>
                  <p className="text-sm">is in process</p>
                </div>
              </div>
            )}

            {/* Google Signup Section */}
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-700 font-medium mb-4 flex items-center justify-center">
                  <span className="mr-2">🚀</span>
                  সহজ সাইন আপ
                </p>
                <div className="border-t border-gray-200 mb-6"></div>
              </div>

              {/* Wrapper for Google Button with enhanced styling */}
              <div className={`transition-all duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'hover:scale-105'}`}>
                <div className="relative">
                  {loading && (
                    <div className="absolute inset-0 bg-white/50 rounded-xl flex items-center justify-center z-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    </div>
                  )}
                  
                  <GoogleSignInButton
                    onSuccess={(userData) => handleGoogleSignup(userData)}
                    onError={(errorMessage) => setError(errorMessage)}
                  />
                </div>
              </div>
            </div>


            {/* Decorative Footer */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                🙏 আমাদের সাথে যুক্ত হওয়ার জন্য ধন্যবাদ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;