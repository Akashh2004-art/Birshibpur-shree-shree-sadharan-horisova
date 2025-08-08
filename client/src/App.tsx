import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Events from "./pages/Events";
import Gallery from "./pages/Gallery";
import Booking from "./pages/Booking";
// import Donations from "./pages/Donations"; // Original donations page commented out
import About from "./pages/About";
import ForgotPassword from "./pages/ForgotPassword";
import SetPassword from "./pages/SetPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./components/NotFound"; // Import NotFound component

const App = () => {
  return (
    <Router>
      <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/events" element={<Events />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/set-password" element={<SetPassword />} />
                <Route path="/booking" element={<Booking />} />
                
                {/* Donations route now shows NotFound (Coming Soon) page */}
                <Route path="/donations" element={<NotFound />} />
                
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Catch all unknown routes */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
      </AuthProvider>
    </Router>
  );
};

export default App;