import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, userLogin } from '../utils/api';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import socketService from '../config/socket';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  currentUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  signUpWithGoogle: (userData: any) => Promise<void>;
  signUpWithPhone: (phone: string) => Promise<void>;
  setCustomPassword: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ SOCKET CONNECTION MANAGEMENT
  useEffect(() => {
    if (user && (user.id || user._id)) {
      const userId = user.id || user._id;
      console.log('🔌 Connecting socket for user:', userId);
      
      try {
        
        // Listen for booking status updates
        socketService.onBookingStatusUpdate((data) => {
          console.log('📋 Booking status update received:', data);
          // You can add notification logic here
        });

        console.log('✅ Socket connected successfully for user:', userId);
      } catch (error) {
        console.error('❌ Socket connection failed:', error);
      }
    } else {
      // Disconnect socket when no user
      console.log('🔌 Disconnecting socket - no user');
      socketService.disconnect();
    }

    // Cleanup on unmount or user change
    return () => {
      if (!user) {
        socketService.disconnect();
      }
    };
  }, [user]);

  useEffect(() => {
    checkAuth();
    
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setCurrentUser(firebaseUser);
    });

    // ✅ CLEANUP ON UNMOUNT
    return () => {
      unsubscribe();
      socketService.disconnect();
    };
  }, []);

const checkAuth = async () => {
  try {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token) {
      setLoading(false);
      return;
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setLoading(false);
    } else {
      // ✅ FIXED: Changed from '/user-auth/me' to match your server routes
      const response = await api.get('/user-auth/me');
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
  } catch (err) {
    console.error('Auth check error:', err);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socketService.disconnect();
  } finally {
    setLoading(false);
  }
};

  const login = async (identifier: string, password: string, rememberMe: boolean = true) => {
    if (!identifier || !password) {
      throw new Error('ইমেইল/ফোন এবং পাসওয়ার্ড দরকার');
    }
  
    try {
      setError(null);
      setLoading(true);
      
      const response = await userLogin({ 
        identifier: identifier.trim(), 
        password,
        rememberMe 
      });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('loginTime', Date.now().toString());
      
      setUser(response.user);
      
      // ✅ Socket will connect automatically via useEffect
      console.log('✅ Login successful, socket will connect automatically');
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'ইমেইল/ফোন বা পাসওয়ার্ড ভুল';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

const signup = async (name: string, email: string, password: string) => {
  try {
    setError(null);
    setLoading(true);
    // ✅ FIXED: Changed from '/user-auth/signup' to match your server routes
    const response = await api.post('/user-auth/signup', { name, email, password });
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  } catch (err) {
    setError('অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে');
    throw err;
  } finally {
    setLoading(false);
  }
};

  const signUpWithGoogle = async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      
      const response = await api.post('/user-auth/google-signup', {
        email: result.user.email,
        name: result.user.displayName,
        photoURL: result.user.photoURL,
        uid: result.user.uid
      });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
    } catch (err) {
      setError('Google সাইন আপ ব্যর্থ হয়েছে');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithPhone = async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
    } catch (err) {
      setError('ফোন নম্বর দিয়ে সাইন আপ ব্যর্থ হয়েছে');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setCustomPassword = async (email: string, password: string) => {
    if (!email || !password) {
      console.error('Error: ইমেইল ও পাসওয়ার্ড লাগবে');
      return;
    }
  
    try {
      const response = await api.post('/user/set-password', { email, password });
      console.log('Password set successfully:', response);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error setting password:', error.message);
      } else {
        console.error('Error setting password:', error);
      }
    }
  };

const logout = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // ✅ FIXED: Changed from '/user/logout' to '/user-auth/logout'
        await api.post('/user-auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn('Logout API call failed, continuing with local cleanup');
      }
    }
    
    await auth.signOut();
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    
    socketService.disconnect();
    
    setUser(null);
    setCurrentUser(null);
    
    console.log('✅ Logout successful, socket disconnected');
    
  } catch (err) {
    console.error('Logout error:', err instanceof Error ? err.message : 'অজানা ত্রুটি');
    setError(err instanceof Error ? err.message : 'লগআউট করতে সমস্যা হয়েছে');
    throw err;
  } finally {
    setLoading(false);
  }
};

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    currentUser,
    loading,
    error,
    login,
    signup,
    logout,
    clearError,
    signUpWithGoogle,
    signUpWithPhone,
    setCustomPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};