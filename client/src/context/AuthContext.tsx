import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { auth } from '../config/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import bookingSocketService from '../config/socket';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  isAdmin: boolean;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  currentUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  clearError: () => void;
  loginWithGoogleToken: (token: string, userData: any) => Promise<void>;
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

  useEffect(() => {
    checkAuth();
    
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setCurrentUser(firebaseUser);
    });

    return () => {
      unsubscribe();
      // Disconnect all booking connections when app unmounts
      bookingSocketService.disconnectAll();
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
        // Validate token with server
        const response = await api.get('/user-auth/me');
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    } catch (err) {
      console.error('Auth check error:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
      bookingSocketService.disconnectAll();
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Google token login method for signUpWithGoogle component
  const loginWithGoogleToken = async (token: string, userData: any) => {
    try {
      setError(null);
      setLoading(true);
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('loginTime', Date.now().toString());
      
      setUser(userData);
      
      console.log('✅ Google login successful in AuthContext');
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'লগইন ব্যর্থ';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
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
      
      // Disconnect all booking connections on logout
      bookingSocketService.disconnectAll();
      
      setUser(null);
      setCurrentUser(null);
      
      console.log('✅ Logout successful, all booking sockets disconnected');
      
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
    logout,
    clearError,
    loginWithGoogleToken
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