import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import NotificationPopup from './NotificationPopup';
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { path: "/", label: "Dashboard" },
    { path: "/booking", label: "Bookings" },
    { path: "/donations", label: "Donations" },
    { path: "/events", label: "Events" },
    { path: "/gallery", label: "Gallery" },
    { path: "/users", label: "Users" },
    { path: "/notes-calc", label: "NoteCalc" },
  ];

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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md relative z-50 w-full">
      {/* ✅ Fixed container with proper responsive padding and flex */}
      <div className="w-full max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-3">
        <div className="flex justify-between items-center">
          
          {/* ✅ Logo section with proper responsive text sizing */}
          <div className="flex-shrink-0">
            <h1 className="text-gray-800 text-lg sm:text-xl lg:text-2xl font-bold truncate">
              <motion.span
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Admin Panel
              </motion.span>
            </h1>
          </div>
          
          {/* ✅ Desktop Menu - better spacing and responsive layout */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-4">
            <div className="flex space-x-1 xl:space-x-3">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-2 xl:px-3 py-2 text-sm xl:text-base text-gray-700 hover:text-gray-900 transition-colors duration-200 whitespace-nowrap
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
            </div>
            
            {/* ✅ Logout Button with proper spacing */}
            <div className="flex items-center space-x-2 ml-2 xl:ml-4">
              <button
                onClick={handleLogout}
                className="px-3 xl:px-4 py-2 bg-red-500 text-white text-sm xl:text-base rounded-md hover:bg-red-600 transition-colors duration-200 whitespace-nowrap"
              >
                Logout
              </button>
              <NotificationPopup />
            </div>
          </div>

          {/* ✅ Tablet Menu (md to lg) */}
          <div className="hidden md:flex lg:hidden items-center space-x-2">
            <div className="flex space-x-1">
              {menuItems.slice(0, 4).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-2 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors duration-200 whitespace-nowrap
                    ${location.pathname === item.path ? 'text-blue-600 font-medium' : ''}
                  `}
                >
                  {item.label}
                  {location.pathname === item.path && (
                    <motion.div
                      layoutId="underline-tablet"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    />
                  )}
                </Link>
              ))}
            </div>
            
            <button
              onClick={() => setIsMobile(!isMobile)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors duration-200"
            >
              Logout
            </button>
            
            <NotificationPopup />
          </div>

          {/* ✅ Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <NotificationPopup />
            <button
              onClick={() => setIsMobile(!isMobile)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            >
              {isMobile ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Mobile/Tablet Menu - improved styling */}
      <AnimatePresence>
        {isMobile && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="md:block lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t overflow-hidden z-40"
          >
            <div className="px-4 py-3 space-y-2">
              {menuItems.map((item) => (
                <motion.div key={item.path} variants={itemVariants}>
                  <Link
                    to={item.path}
                    className={`block px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 ${
                      location.pathname === item.path
                        ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMobile(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              
              {/* ✅ Mobile Logout Button */}
              <motion.div variants={itemVariants}>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobile(false);
                  }}
                  className="w-full text-left block px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
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