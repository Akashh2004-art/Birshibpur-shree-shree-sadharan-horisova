import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const NotificationPopup: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [, setSocket] = useState<Socket | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if mobile on mount and when window resizes
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);

    // Connect to socket server
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    setSocket(newSocket);
    
    // Debug socket connection
    newSocket.on('connect', () => {
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Fetch existing notifications
    fetchNotifications();

    // Listen for new notifications
    newSocket.on('newNotification', (notification: Notification) => {
      console.log('New notification received:', notification);
      // নতুন notification যদি unread হয় তাহলে শুধুমাত্র তখনই add করা
      if (!notification.read) {
        setNotifications(prev => [notification, ...prev]);
        setShowPopup(true);
      }
    });
  
    // Add this new listener
    newSocket.on('notificationsUpdated', () => {
      console.log('Notifications updated event received');
      fetchNotifications();
    });
    
    // Add click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      newSocket.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/notifications');
      
      // শুধুমাত্র unread notifications state এ রাখা
      const unreadNotifications = response.data.filter((notif: Notification) => !notif.read);
      setNotifications(unreadNotifications);
      
      // Show popup if there are unread notifications
      if (unreadNotifications.length > 0) {
        setShowPopup(true);
      }
    } catch (error) {
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // ✅ Fixed: Remove extra /api prefix
      await axios.put(`/notifications/${id}/read`);
      
      // State থেকে notification টি remove করা (কারণ এখন এটি read)
      setNotifications(prev => prev.filter(notif => notif._id !== id));
      
      // যদি আর কোন unread notification না থাকে তাহলে popup close করা
      const remainingUnread = notifications.filter(notif => notif._id !== id);
      if (remainingUnread.length === 0) {
        setShowPopup(false);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log("📢 Sending request to mark all as read...");
      
      // Backend এ সব notifications read mark করা
      await axios.put("/notifications/mark-all-read");
      
      // Frontend state clear করা (কারণ সব read হয়ে গেছে)
      setNotifications([]);
      
      // Popup close করা কারণ সব read হয়ে গেছে
      setShowPopup(false);
  
      console.log("✅ All notifications marked as read!");
    } catch (error) {
      console.error("❌ Error marking all notifications as read:", error);
    }
  };
  
  const unreadCount = notifications.filter(notif => !notif.read).length;
  
  // Notification content component - reused in both mobile and desktop views
  const NotificationContent = () => (
    <>
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">কোন নোটিফিকেশন নেই</div>
        ) : (
          // শুধুমাত্র unread notifications show করা
          notifications.filter(notif => !notif.read).length === 0 ? (
            <div className="p-4 text-center text-gray-500">সব নোটিফিকেশন পড়া হয়েছে</div>
          ) : (
            notifications
              .filter(notif => !notif.read) // শুধু unread notifications
              .map(notification => (
                <div 
                  key={notification._id} 
                  className="p-4 hover:bg-gray-50 cursor-pointer bg-blue-50"
                  onClick={() => markAsRead(notification._id)}
                >
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
          )
        )}
      </div>
    </>
  );

  return (
    <div ref={popupRef} className="relative">
      {/* Notification Bell Icon */}
      <button 
        className="p-2 rounded-full hover:bg-gray-200 relative"
        onClick={() => setShowPopup(!showPopup)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showPopup && (
          <>
            {/* Desktop View */}
            {!isMobile && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 max-h-96 overflow-y-auto hidden md:block"
              >
                <NotificationContent />
              </motion.div>
            )}

            {/* Mobile View */}
            {isMobile && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed top-20 left-[12%] -translate-x-1/2 w-[90%] max-w-[320px] bg-white rounded-md shadow-lg z-[1000] max-h-96 overflow-y-auto block md:hidden"
              >
                <NotificationContent />
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPopup;