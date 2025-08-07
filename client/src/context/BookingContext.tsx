import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

export interface BookingStatusData {
  bookingId: string;
  status: 'pending' | 'approved' | 'rejected';
  serviceName: string;
  date: string;
  time: string;
  message?: string;
  rejectionReason?: string;
  userId: string;
}

interface BookingContextType {
  currentBooking: BookingStatusData | null;
  socket: Socket | null;
  isConnected: boolean;
  showStatusPage: boolean;
  setCurrentBooking: (booking: BookingStatusData | null) => void;
  setShowStatusPage: (show: boolean) => void;
  startStatusTracking: (bookingData: BookingStatusData) => void;
  stopStatusTracking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

interface BookingProviderProps {
  children: ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<BookingStatusData | null>(null);
  const [showStatusPage, setShowStatusPage] = useState(false);
  const [autoCloseTimeout, setAutoCloseTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const serverURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    const newSocket = io(serverURL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    // Booking status update events
    newSocket.on('bookingStatusUpdate', (data: BookingStatusData) => {
      console.log('📨 Received booking status update:', data);
      
      if (currentBooking && data.bookingId === currentBooking.bookingId) {
        setCurrentBooking(prev => prev ? { ...prev, ...data } : data);
        
        // Handle auto-close logic for approved bookings
        if (data.status === 'approved') {
          scheduleAutoClose(data);
        }
        
        // Clear auto-close timeout for rejected bookings (manual close required)
        if (data.status === 'rejected' && autoCloseTimeout) {
          clearTimeout(autoCloseTimeout);
          setAutoCloseTimeout(null);
        }
      }
    });

    newSocket.on('error', (error) => {
      console.error('🚫 Socket error:', error);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (autoCloseTimeout) {
        clearTimeout(autoCloseTimeout);
      }
      newSocket.disconnect();
    };
  }, []);

  // Schedule auto-close for approved bookings
  const scheduleAutoClose = (booking: BookingStatusData) => {
    if (autoCloseTimeout) {
      clearTimeout(autoCloseTimeout);
    }

    // Calculate time until 5 minutes after booking end time
    const bookingDateTime = new Date(`${booking.date} ${convertBengaliTime(booking.time)}`);
    const endTime = new Date(bookingDateTime.getTime() + (getServiceDuration(booking.serviceName) * 60 * 1000));
    const autoCloseTime = new Date(endTime.getTime() + (5 * 60 * 1000)); // 5 minutes after service ends
    
    const timeUntilAutoClose = autoCloseTime.getTime() - Date.now();

    if (timeUntilAutoClose > 0) {
      console.log(`⏰ Status page will auto-close in ${Math.round(timeUntilAutoClose / 1000 / 60)} minutes`);
      
      const timeout = setTimeout(() => {
        console.log('⏰ Auto-closing status page');
        stopStatusTracking();
      }, timeUntilAutoClose);
      
      setAutoCloseTimeout(timeout);
    }
  };

  // Convert Bengali time to 24-hour format
  const convertBengaliTime = (bengaliTime: string): string => {
    const timeMap: { [key: string]: string } = {
      'সকাল ৮:০০': '08:00',
      'সকাল ৯:০০': '09:00',
      'সকাল ১০:০০': '10:00',
      'দুপুর ১২:০০': '12:00',
      'বিকাল ৪:০০': '16:00',
      'সন্ধ্যা ৬:০০': '18:00',
    };
    return timeMap[bengaliTime] || '10:00';
  };

  // Get service duration in minutes
  const getServiceDuration = (serviceName: string): number => {
    const durationMap: { [key: string]: number } = {
      'নিত্য পূজা': 30,
      'বিশেষ অর্চনা': 60,
      'সত্যনারায়ণ পূজা': 120,
    };
    return durationMap[serviceName] || 60;
  };

  // Start tracking booking status
  const startStatusTracking = (bookingData: BookingStatusData) => {
    console.log('🔄 Starting status tracking for booking:', bookingData.bookingId);
    
    setCurrentBooking(bookingData);
    setShowStatusPage(true);
    
    // Join booking room for real-time updates
    if (socket) {
      socket.emit('joinBookingRoom', bookingData.bookingId);
    }
  };

  // Stop tracking and close status page
  const stopStatusTracking = () => {
    console.log('⏹️ Stopping status tracking');
    
    if (autoCloseTimeout) {
      clearTimeout(autoCloseTimeout);
      setAutoCloseTimeout(null);
    }
    
    if (socket && currentBooking) {
      socket.emit('leaveBookingRoom', currentBooking.bookingId);
    }
    
    setCurrentBooking(null);
    setShowStatusPage(false);
  };

  const value: BookingContextType = {
    currentBooking,
    socket,
    isConnected,
    showStatusPage,
    setCurrentBooking,
    setShowStatusPage,
    startStatusTracking,
    stopStatusTracking,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};