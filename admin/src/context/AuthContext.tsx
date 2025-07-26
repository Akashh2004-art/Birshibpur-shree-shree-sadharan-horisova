import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void; // Added setUser
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing token and user data on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Get user profile with the stored token
        const response = await api.get('/auth/profile');
        
        if (response.data.success) {
          setUser(response.data.admin);
        } else {
          // Clear invalid token
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const response = await api.get("/api/auth/google-login");
      const { token, user, requiresPasswordSet } = response.data;
      
      if (requiresPasswordSet) {
        navigate(`/set-password?token=${token}`);
      } else {
        localStorage.setItem("token", token);
        setUser(user);
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error("Google Login Failed", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginWithGoogle, 
      logout,
      setUser // Added setUser to context
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};