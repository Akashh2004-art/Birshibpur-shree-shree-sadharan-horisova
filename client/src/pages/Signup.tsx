import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/signUpWithGoogle';

const Signup = () => {
  const navigate = useNavigate();
  useAuth();
  const [error, setError] = useState('');
  const [, setLoading] = useState(false);

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
        // If no password needed, go to home
        navigate('/');
      }
    } catch (err) {
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
