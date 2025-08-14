import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/signUpWithGoogle';

const Signup = () => {
  const navigate = useNavigate();
  useAuth(); // Just for context, don't destructure anything
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = async (userData: any) => {
    try {
      setLoading(true);
      setError('');
      
      if (userData.needsPassword) {
        // Redirect to password set page with necessary data
        navigate('/set-password', { 
          state: { 
            user: userData.user,
            token: userData.token 
          }
        });
      } else {
        // ✅ SIMPLE SOLUTION: 
        // 1. Clear any existing auth data (signup complete but not logged in yet)
        // 2. Just redirect to login page
        // 3. Let user manually login from login page
        
        // Clear any stored data from signup process
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        
        // Show success message and redirect to login
        alert('✅ সাইন আপ সফল হয়েছে! এখন লগইন করুন।');
        
        // Direct redirect to login page
        navigate('/login');
      }
    } catch (err) {
      console.error('Google signup error:', err);
      setError('Google সাইন আপ ব্যর্থ হয়েছে। আবার চেষ্টা করুন!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">নতুন অ্যাকাউন্ট খুলুন</h2>
          <p className="mt-2 text-gray-600">
            অথবা{' '}
            <Link to="/login" className="text-orange-500 hover:text-orange-600">
              লগইন করুন
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center mb-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            <p className="mt-2 text-gray-600">প্রক্রিয়াধীন...</p>
          </div>
        )}

        <div className="space-y-6">
          <GoogleSignInButton
            onSuccess={(userData) => handleGoogleSignup(userData)}
            onError={(errorMessage) => setError(errorMessage)}
          />
        </div>
      </div>
    </div>
  );
};

export default Signup;