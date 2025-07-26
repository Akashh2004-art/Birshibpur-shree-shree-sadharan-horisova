import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import toast from 'react-hot-toast';
import axios from '../api/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

interface Props {
  mode: 'login' | 'signup';
}

const GoogleSignInButton: FC<Props> = ({ mode }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const idToken = await result.user.getIdToken();
      
      const endpoint = mode === 'login' ? '/auth/google-login' : '/auth/google-signup';
      
      const response = await axios.post(endpoint, {
        token: idToken,
        email: result.user.email,
        name: result.user.displayName,
        photoURL: result.user.photoURL
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success(response.data.message);
        navigate(response.data.redirectTo);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleAuth}
      disabled={loading}
      className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <FontAwesomeIcon icon={faGoogle} className="mr-2" />
      {loading ? 'Processing...' : `Continue with Google ${mode === 'login' ? '(Login)' : '(Signup)'}`}
    </button>
  );
};

export default GoogleSignInButton;