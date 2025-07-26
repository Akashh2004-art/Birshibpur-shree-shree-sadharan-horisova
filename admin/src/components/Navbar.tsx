import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Add useNavigate
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import NotificationPopup from './NotificationPopup';
import { useAuth } from "../context/AuthContext"; // Import useAuth

const Navbar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // Add navigate hook
  const { logout } = useAuth(); // Get logout function from auth context

  const menuItems = [
    { path: "/", label: "Dashboard" },
    { path: "/booking", label: "Bookings" },
    { path: "/donations", label: "Donations" },
    { path: "/events", label: "Events" },
    { path: "/gallery", label: "Gallery" },
    { path: "/users", label: "Users" },
  ];

  // Menu animation variants remain unchanged
  const menuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    },
    open: {
      opacity: 1,
      height: "auto",
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: -16 },
    open: { opacity: 1, x: 0 }
  };

  // Handle logout function
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md relative z-50">
      <div className="flex justify-between items-center px-4 py-4">
        <h1 className="text-gray-800 text-2xl font-bold">
          <motion.span
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Admin Panel
          </motion.span>
        </h1>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6 items-center">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative px-3 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200
                ${location.pathname === item.path ? 'text-blue-600 font-medium' : ''}
              `}
            >
              {item.label}
              {location.pathname === item.path && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                />
              )}
            </Link>
          ))}
          
          {/* Add Logout Button */}
          <button
            onClick={handleLogout}
            className="ml-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
          >
            Logout
          </button>
          
          <NotificationPopup />
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <NotificationPopup />
          <button
            onClick={() => setIsMobile(!isMobile)}
            className="ml-2 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
          >
            {isMobile ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobile && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="md:hidden overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
              {menuItems.map((item) => (
                <motion.div key={item.path} variants={itemVariants}>
                  <Link
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === item.path
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMobile(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              
              {/* Add Logout Button to Mobile Menu */}
              <motion.div variants={itemVariants}>
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;