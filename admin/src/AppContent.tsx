import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import BookingManagement from "./pages/BookingManagement";
import EventManagement from "./pages/EventManagement";
import GalleryManagement from "./pages/GalleryManagement";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserManagement from "./pages/UserManagement";
import Navbar from "./components/Navbar";
import SetPasswordPage from "./pages/SetPasswordPage";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./components/NotFound";

// ✅ Updated imports
import NotesAndCalculations from './components/NotesAndCalculations';
import NotePage from './pages/NotePage';
import CalcPage from './pages/CalcPage';

// Protected Route Component
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    const currentPath = window.location.pathname;
    if (currentPath !== "/login") {
      sessionStorage.setItem("redirectAfterLogin", currentPath);
    }
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Public Route Component
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
        <h3 className="text-lg text-gray-600">🕉️ জয় শ্রী রাম</h3>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {user && <Navbar />}

      <div className="flex-1 p-4 container mx-auto">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/set-password"
            element={
              <PublicRoute>
                <SetPasswordPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/booking"
            element={
              <PrivateRoute>
                <BookingManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/donations"
            element={
              <PrivateRoute>
                <NotFound />
              </PrivateRoute>
            }
          />
          <Route
            path="/events"
            element={
              <PrivateRoute>
                <EventManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/gallery"
            element={
              <PrivateRoute>
                <GalleryManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <UserManagement />
              </PrivateRoute>
            }
          />

          {/* ✅ Updated Routes */}
          <Route path="/notes-calc" element={<NotesAndCalculations />} />
          <Route path="/notes" element={<NotePage />} />  
          <Route path="/calc" element={<CalcPage />} />

          {/* Global 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      <footer className="text-center py-4 text-gray-600 bg-gray-100">
        <p>🕉️ জয় শ্রী রাম - {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default AppContent;
