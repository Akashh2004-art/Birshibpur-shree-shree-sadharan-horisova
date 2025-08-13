import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// 🔥 NEW IMPORT - Using our new booking socket service
import bookingSocketService from '../config/socket';
import { getCurrentBookingStatus } from '../utils/api';

export interface PujaService {
  id: number;
  name: string;
  description: string;
  duration: string;
  time: string[];
  items: string[];
}

export const pujaServices: PujaService[] = [
  {
    id: 1,
    name: "নিত্য পূজা",
    description: "প্রতিদিনের নিয়মিত পূজা অর্চনা",
    duration: "৩০ মিনিট",
    time: ["সকাল ৮:০০", "সকাল ১০:০০", "বিকাল ৪:০০"],
    items: ["ফুল", "বেলপাতা", "চন্দন", "ধূপ", "দীপ"],
  },
  {
    id: 2,
    name: "বিশেষ অর্চনা",
    description: "বিশেষ পূজা অর্চনা ও প্রসাদ বিতরণ",
    duration: "১ ঘণ্টা",
    time: ["সকাল ৯:০০", "দুপুর ১২:০০", "সন্ধ্যা ৬:০০"],
    items: ["ফুল", "বেলপাতা", "চন্দন", "ধূপ", "দীপ", "মিষ্টি", "ফল"],
  },
  {
    id: 3,
    name: "সত্যনারায়ণ পূজা",
    description: "পূর্ণ সত্যনারায়ণ পূজা ও কথা পাঠ",
    duration: "২ ঘণ্টা",
    time: ["সকাল ১০:০০", "বিকাল ৪:০০"],
    items: ["ফুল", "বেলপাতা", "চন্দন", "ধূপ", "দীপ", "নৈবেদ্য", "ফল", "মিষ্টি"],
  },
];

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  serviceId: number;
  date: string;
  time: string;
  message: string;
}

interface BookingStatus {
  bookingId: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  message?: string;
}

const Booking = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selectedService, setSelectedService] = useState<PujaService | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showStatusSection, setShowStatusSection] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus | null>(null);
  const [formData, setFormData] = useState<BookingForm>({
    name: '',
    email: '',
    phone: '',
    serviceId: 0,
    date: '',
    time: '',
    message: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  
  // 🔥 NEW STATE - Booking-specific socket connection status
  const [bookingSocketConnected, setBookingSocketConnected] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  
  // Timers
  const statusUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const parseTimeString = (timeStr: string): { hour: number; minute: number } => {
    const timeMap: { [key: string]: { hour: number; minute: number } } = {
      'সকাল ৮:০০': { hour: 8, minute: 0 },
      'সকাল ৯:০০': { hour: 9, minute: 0 },
      'সকাল ১০:০০': { hour: 10, minute: 0 },
      'দুপুর ১২:০০': { hour: 12, minute: 0 },
      'বিকাল ৪:০০': { hour: 16, minute: 0 },
      'সন্ধ্যা ৬:০০': { hour: 18, minute: 0 },
    };
    return timeMap[timeStr] || { hour: 0, minute: 0 };
  };

  const calculateBookingEndTime = (dateStr: string, timeStr: string): Date => {
    const selectedDate = new Date(dateStr);
    const { hour, minute } = parseTimeString(timeStr);
    // Set booking end time (puja time + 5 minutes buffer)
    selectedDate.setHours(hour, minute + 5, 0, 0);
    return selectedDate;
  };

  // 🔥 NEW FUNCTION - Start booking-specific socket connection
  const startBookingSocket = async (bookingId: string, bookingEndTime: Date) => {
    if (!user) return;

    const userId = user.id || user._id;
    if (!userId) return;

    try {
      setConnectionMessage('বুকিং সংযোগ স্থাপন করা হচ্ছে...');
      
      // Connect socket specifically for this booking
      const socket = await bookingSocketService.connectForBooking(
        bookingId,
        userId,
        bookingEndTime
      );

      setBookingSocketConnected(true);
      setActiveBookingId(bookingId);
      setConnectionMessage('বুকিং সংযোগ সক্রিয়');

      // 🎯 Listen for booking-specific events
      bookingSocketService.onBookingEvent(bookingId, 'booking_status_update', (data: any) => {
        console.log(`📋 Booking ${bookingId} status update:`, data);
        
        if (data.status === 'approved') {
          setBookingStatus(prev => prev ? { ...prev, status: 'approved', message: data.message } : null);
          setConnectionMessage('বুকিং অনুমোদিত! সংযোগ সক্রিয়');
          // Keep socket connected for real-time updates
        } else if (data.status === 'rejected') {
          setBookingStatus(prev => prev ? { 
            ...prev, 
            status: 'rejected', 
            rejectionReason: data.rejectionReason 
          } : null);
          
          // 🔥 DISCONNECT IMMEDIATELY ON REJECTION
          setConnectionMessage('বুকিং বাতিল - সংযোগ বন্ধ');
          bookingSocketService.disconnectBooking(bookingId);
          setBookingSocketConnected(false);
          setActiveBookingId(null);
          
          if (statusUpdateTimeoutRef.current) {
            clearTimeout(statusUpdateTimeoutRef.current);
          }
          setTimeRemaining('');
        }
      });

      bookingSocketService.onBookingEvent(bookingId, 'booking_accepted', (data: any) => {
        console.log(`✅ Booking ${bookingId} accepted:`, data);
        setConnectionMessage('বুকিং গৃহীত! রিয়েল-টাইম আপডেট চালু');
      });

      bookingSocketService.onBookingEvent(bookingId, 'booking_completed', (data: any) => {
        console.log(`🎉 Booking ${bookingId} completed:`, data);
        setConnectionMessage('পূজা সম্পন্ন - সংযোগ বন্ধ');
        setBookingSocketConnected(false);
        setActiveBookingId(null);
      });

      return socket;

    } catch (error: any) {
      console.error(`🚫 Failed to start booking socket for ${bookingId}:`, error);
      setConnectionMessage(`সংযোগ ত্রুটি: ${error.message}`);
      setBookingSocketConnected(false);
      setActiveBookingId(null);
      throw error;
    }
  };

  // 🔥 NEW FUNCTION - Stop booking socket connection
  const stopBookingSocket = (bookingId?: string) => {
    const idToStop = bookingId || activeBookingId;
    if (idToStop) {
      bookingSocketService.disconnectBooking(idToStop);
      setBookingSocketConnected(false);
      setActiveBookingId(null);
      setConnectionMessage('সংযোগ বন্ধ');
    }
  };

  // 🔥 MODIFIED SUBMIT FUNCTION - With socket integration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!selectedService || !user) {
      setError('অনুগ্রহ করে একটি পূজা সেবা নির্বাচন করুন');
      setIsSubmitting(false);
      return;
    }

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setError('আজকের তারিখ বা আগের তারিখ নির্বাচন করা যাবে না। আগামীকাল থেকে বুকিং করা যাবে।');
      setIsSubmitting(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      // 📡 Step 1: Submit booking to API
      const response = await fetch(`${apiUrl}/bookings/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();

      if (data.success) {
        const bookingId = data.data.bookingId;
        const bookingEndTime = calculateBookingEndTime(formData.date, formData.time);
        
        // 🔌 Step 2: Start booking-specific socket connection
        try {
          await startBookingSocket(bookingId, bookingEndTime);
          console.log(`✅ Booking socket started for: ${bookingId}`);
        } catch (socketError) {
          console.warn('⚠️ Socket connection failed, but booking was created:', socketError);
          // Continue with booking even if socket fails
        }

        // 📋 Step 3: Update UI state
        setShowForm(false);
        setShowStatusSection(true);
        setBookingStatus({
          bookingId: bookingId,
          serviceName: data.data.serviceName,
          date: data.data.date,
          time: data.data.time,
          status: 'pending',
        });

        // 🧹 Step 4: Reset form
        setSelectedService(null);
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          serviceId: 0,
          date: '',
          time: '',
          message: '',
        });

        console.log(`🎯 Booking submitted successfully: ${bookingId}`);

      } else {
        setError(data.message || 'বুকিং করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
      }
    } catch (err: any) {
      console.error('🚫 Booking submission failed:', err);
      setError(err.message || 'বুকিং করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔥 MODIFIED - Check existing booking status (without auto socket connection)
  const checkCurrentBookingStatus = async () => {
    if (!user) return;
    setIsLoadingStatus(true);
    
    try {
      const response = await getCurrentBookingStatus();
      if (response.success && response.data) {
        const status: BookingStatus = {
          bookingId: response.data.bookingId,
          serviceName: response.data.serviceName,
          date: response.data.date,
          time: response.data.time,
          status: response.data.status,
          rejectionReason: response.data.rejectionReason,
          message: response.data.message,
        };
        
        setBookingStatus(status);
        setShowStatusSection(true);
        setShowForm(false);
        
        // 🔌 Auto-connect socket only for approved bookings
        if (response.data.status === 'approved') {
          const bookingEndTime = calculateBookingEndTime(response.data.date, response.data.time);
          const now = new Date();
          
          // Only connect if booking hasn't expired
          if (bookingEndTime > now) {
            try {
              await startBookingSocket(response.data.bookingId, bookingEndTime);
              setStatusExpiryTimeout(response.data.date, response.data.time);
            } catch (error) {
              console.warn('⚠️ Failed to auto-connect to existing booking socket:', error);
            }
          }
        }
      } else {
        setShowStatusSection(false);
        setBookingStatus(null);
      }
    } catch (error) {
      console.error('Error checking booking status:', error);
      setShowStatusSection(false);
      setBookingStatus(null);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const setStatusExpiryTimeout = (dateStr: string, timeStr: string) => {
    const expiryTime = calculateBookingEndTime(dateStr, timeStr);
    const now = new Date();
    const timeUntilExpiry = expiryTime.getTime() - now.getTime();

    if (timeUntilExpiry > 0) {
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }
      statusUpdateTimeoutRef.current = setTimeout(() => {
        setShowStatusSection(false);
        setShowForm(false);
        setBookingStatus(null);
        setTimeRemaining('');
        // Auto disconnect socket when time expires
        if (activeBookingId) {
          stopBookingSocket(activeBookingId);
        }
      }, timeUntilExpiry);
      startCountdown(expiryTime);
    } else {
      setShowStatusSection(false);
      setShowForm(false);
      setBookingStatus(null);
    }
  };

  const startCountdown = (expiryTime: Date) => {
    const updateCountdown = () => {
      const now = new Date();
      const timeLeft = expiryTime.getTime() - now.getTime();
      if (timeLeft <= 0) {
        setTimeRemaining('');
        return;
      }
      const minutes = Math.floor(timeLeft / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      setTimeout(updateCountdown, 1000);
    };
    updateCountdown();
  };

  // 🔥 CLEANUP EFFECT - Disconnect sockets on unmount
  useEffect(() => {
    return () => {
      // Cleanup all socket connections on component unmount
      if (activeBookingId) {
        stopBookingSocket(activeBookingId);
      }
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }
    };
  }, [activeBookingId]);

  // Check booking status on user load
  useEffect(() => {
    if (user && !loading) {
      checkCurrentBookingStatus();
    }
  }, [user, loading]);

  // Other utility functions remain the same...
  const handleServiceSelect = (service: PujaService) => {
    if (!user && !loading) {
      sessionStorage.setItem('selectedServiceId', service.id.toString());
      navigate('/signup', {
        state: { message: 'পূজা বুকিং করতে প্রথমে সাইন আপ করুন', returnTo: '/booking' },
      });
      return;
    }
    if (user) {
      setSelectedService(service);
      setFormData((prev) => ({ ...prev, serviceId: service.id }));
      setShowForm(true);
      setShowStatusSection(false);
      setBookingStatus(null);
      setError('');
    }
  };

  const handleBackToServices = () => {
    setShowForm(false);
    setSelectedService(null);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      serviceId: 0,
      date: '',
      time: '',
      message: '',
    });
    setError('');
  };

  const handleNewBooking = () => {
    // Disconnect current booking socket before starting new booking
    if (activeBookingId) {
      stopBookingSocket(activeBookingId);
    }
    
    setShowStatusSection(false);
    setBookingStatus(null);
    setError('');
    setTimeRemaining('');
    if (statusUpdateTimeoutRef.current) {
      clearTimeout(statusUpdateTimeoutRef.current);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD');
  };

  // 🎯 Continue with Part 2 for UI rendering...
  
  // PART 1 ENDS HERE - Contains all socket logic and booking submission
  // Part 2 will contain the UI rendering components

  // 🎨 PART 2: UI COMPONENTS & RENDERING
  // Continue from Part 1...

  // Auto-fill form data and handle service selection from session
  useEffect(() => {
    window.scrollTo(0, 0);
    if (user && showForm) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user, showForm]);

  useEffect(() => {
    if (user) {
      const storedServiceId = sessionStorage.getItem('selectedServiceId');
      if (storedServiceId) {
        const serviceId = parseInt(storedServiceId);
        const service = pujaServices.find((s) => s.id === serviceId);
        if (service) {
          setSelectedService(service);
          setFormData((prev) => ({ ...prev, serviceId: service.id }));
          setShowForm(true);
        }
        sessionStorage.removeItem('selectedServiceId');
      }
    }
  }, [user]);

  // 🔄 Loading states
  if (loading || isLoadingStatus) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{loading ? 'লোড হচ্ছে...' : 'বুকিং স্ট্যাটাস চেক করা হচ্ছে...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 🎨 ENHANCED HERO SECTION */}
      <div className="bg-orange-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">পূজা বুকিং</h1>
          <p className="text-lg">
            {showStatusSection
              ? 'আপনার বুকিংয়ের অবস্থা'
              : showForm
              ? 'বুকিং ফর্ম পূরণ করুন'
              : 'আপনার পছন্দের পূজা সেবা নির্বাচন করুন'}
          </p>
          
          {!user && !showStatusSection && (
            <p className="mt-4 text-orange-100">পূজা বুকিং করতে প্রথমে সাইন আপ করুন</p>
          )}
          
          {/* 🔥 NEW: BOOKING-SPECIFIC CONNECTION STATUS */}
          {user && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-center items-center space-x-4">
                {/* Booking Socket Status */}
                {activeBookingId && (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      bookingSocketConnected 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-2 ${
                        bookingSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                      }`}
                    ></span>
                    {bookingSocketConnected ? '🔗 বুকিং সংযুক্ত' : '❌ বুকিং বিচ্ছিন্ন'}
                  </span>
                )}

                {/* Booking Status */}
                {bookingStatus && (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      bookingStatus.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : bookingStatus.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {bookingStatus.status === 'pending' && '⏳ অপেক্ষমান'}
                    {bookingStatus.status === 'approved' && '✅ অনুমোদিত'}
                    {bookingStatus.status === 'rejected' && '❌ বাতিল'}
                    {bookingStatus.status === 'approved' && timeRemaining && ` (${timeRemaining})`}
                  </span>
                )}
              </div>
              
              {/* Connection Message */}
              {connectionMessage && (
                <div className="text-center">
                  <p className="text-orange-100 text-sm">{connectionMessage}</p>
                  {/* Active Booking ID Display */}
                  {activeBookingId && (
                    <p className="text-orange-200 text-xs mt-1">
                      সক্রিয় বুকিং: {activeBookingId}
                    </p>
                  )}
                </div>
              )}

              {/* Connection Stats for Debugging (remove in production) */}
              {process.env.NODE_ENV === 'development' && activeBookingId && (
                <div className="text-center mt-2">
                  <button
                    onClick={() => {
                      const info = bookingSocketService.getActiveConnectionsInfo();
                      console.log('🔍 Active Connections:', info);
                    }}
                    className="text-orange-200 text-xs hover:text-white"
                  >
                    Debug: Active Connections ({bookingSocketService.getActiveConnectionsInfo().totalActive})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* 🚨 ERROR MESSAGE */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mb-6">
              <p>{error}</p>
            </div>
          )}

          {/* 📋 ENHANCED STATUS SECTION */}
          {showStatusSection && bookingStatus && (
            <div className="bg-white rounded-lg p-6 mb-8 border shadow-lg">
              <div className="text-center">
                <h3
                  className={`text-xl font-bold mb-4 ${
                    bookingStatus.status === 'pending'
                      ? 'text-yellow-600'
                      : bookingStatus.status === 'approved'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {bookingStatus.status === 'pending' && '⏳ বুকিং প্রক্রিয়াধীন'}
                  {bookingStatus.status === 'approved' && '✅ বুকিং অনুমোদিত!'}
                  {bookingStatus.status === 'rejected' && '❌ বুকিং বাতিল'}
                </h3>

                {/* Booking Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">পূজার নাম</p>
                    <p className="font-semibold">{bookingStatus.serviceName}</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">তারিখ</p>
                    <p className="font-semibold">{formatDate(bookingStatus.date)}</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">সময়</p>
                    <p className="font-semibold">{bookingStatus.time}</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">বুকিং আইডি</p>
                    <p className="font-semibold text-xs">{bookingStatus.bookingId}</p>
                  </div>
                </div>

                {/* 🔥 REAL-TIME CONNECTION STATUS */}
                {bookingStatus.status !== 'rejected' && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      {bookingSocketConnected ? (
                        <div className="flex items-center text-green-600">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                          <span className="text-sm font-medium">রিয়েল-টাইম সংযোগ সক্রিয়</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-orange-600">
                          <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium">সংযোগ বিচ্ছিন্ন</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status-specific Messages */}
                {bookingStatus.status === 'approved' && timeRemaining && (
                  <div className="bg-blue-100 p-4 rounded-lg mb-4">
                    <p className="text-blue-600 font-medium">
                      ⏰ স্ট্যাটাস পেজ স্বয়ংক্রিয়ভাবে বন্ধ হবে: {timeRemaining}
                    </p>
                  </div>
                )}

                {bookingStatus.status === 'pending' && (
                  <div className="bg-yellow-100 p-4 rounded-lg mb-4">
                    <p className="text-yellow-700">
                      🔄 অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন।
                      {bookingSocketConnected && (
                        <span className="block text-sm mt-1">
                          ✨ রিয়েল-টাইম আপডেট চালু আছে
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {bookingStatus.status === 'approved' && (
                  <div className="text-left bg-green-100 p-4 rounded-lg mb-4">
                    <h4 className="font-bold text-green-800 mb-2">📋 নির্দেশনা:</h4>
                    <ul className="text-green-700 space-y-1 text-sm">
                      <li>• নির্ধারিত সময়ে মন্দিরে উপস্থিত হন</li>
                      <li>• পূজার ১৫ মিনিট আগে পৌঁছান</li>
                      <li>• প্রয়োজনীয় উপকরণ সাথে রাখুন</li>
                      <li>• বুকিং আইডি সাথে রাখুন</li>
                    </ul>
                    {bookingSocketConnected && (
                      <p className="text-green-600 text-xs mt-2">
                        🔗 পূজা সম্পন্ন না হওয়া পর্যন্ত রিয়েল-টাইম আপডেট পেতে থাকবেন
                      </p>
                    )}
                  </div>
                )}

                {bookingStatus.status === 'rejected' && (
                  <div className="space-y-4">
                    {bookingStatus.rejectionReason && (
                      <div className="bg-red-100 p-4 rounded-lg">
                        <p className="text-red-600">
                          <strong>❌ বাতিলের কারণ:</strong>
                          <br />
                          {bookingStatus.rejectionReason}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={handleNewBooking}
                      className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      🔄 নতুন বুকিং করুন
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🎯 SERVICES SELECTION */}
          {!showStatusSection && !showForm && (
            <div>
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">পূজা সেবাসমূহ</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pujaServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="bg-white rounded-lg p-6 border hover:border-orange-500 cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{service.name}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>⏱️ সময়কাল:</strong> {service.duration}
                      </p>
                      <p className="text-sm">
                        <strong>🎯 উপকরণ:</strong> {service.items.join(', ')}
                      </p>
                      <p className="text-sm">
                        <strong>🕐 সময়সূচী:</strong> {service.time.join(', ')}
                      </p>
                    </div>
                    <button className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 w-full transition-colors">
                      {user ? '📝 বুকিং করুন' : '📝 সাইন আপ করে বুকিং করুন'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 📝 BOOKING FORM */}
          {!showStatusSection && showForm && selectedService && (
            <div className="bg-white rounded-lg p-6 border max-w-2xl mx-auto shadow-lg">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  📋 {selectedService.name}
                </h3>
                <p className="text-gray-600 mb-4">{selectedService.description}</p>
                <button
                  onClick={handleBackToServices}
                  className="text-orange-500 hover:text-orange-700 text-sm font-medium"
                >
                  ← অন্য সেবা নির্বাচন করুন
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
                      👤 নাম *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      readOnly
                      className="w-full p-3 border rounded-lg bg-gray-100 text-gray-600"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="phone">
                      📞 ফোন নম্বর *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      className="w-full p-3 border rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                    📧 ইমেইল *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    readOnly
                    className="w-full p-3 border rounded-lg bg-gray-100 text-gray-600"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {/* Booking Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="date">
                      📅 তারিখ * (আগামীকাল থেকে)
                    </label>
                    <input
                      type="date"
                      id="date"
                      required
                      min={getMinDate()}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="time">
                      🕐 সময় *
                    </label>
                    <select
                      id="time"
                      required
                      className="w-full p-3 border rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    >
                      <option value="">সময় নির্বাচন করুন</option>
                      {selectedService.time.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="message">
                    💬 বিশেষ নির্দেশনা (যদি থাকে)
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="কোন বিশেষ প্রয়োজন বা নির্দেশনা থাকলে লিখুন..."
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleBackToServices}
                    disabled={isSubmitting}
                    className="flex-1 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 font-medium transition-colors disabled:opacity-50"
                  >
                    ← পিছনে যান
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-orange-500 text-white p-3 rounded-lg hover:bg-orange-600 font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        🔄 বুকিং করা হচ্ছে...
                      </>
                    ) : (
                      '✅ বুকিং নিশ্চিত করুন'
                    )}
                  </button>
                </div>

                {/* Form Info */}
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="text-blue-700 text-sm">
                    ℹ️ <strong>তথ্য:</strong> বুকিং সাবমিট করার পর আপনি স্বয়ংক্রিয়ভাবে রিয়েল-টাইম আপডেট পেতে শুরু করবেন।
                    অ্যাডমিন আপনার বুকিং গ্রহণ বা বাতিল করার সাথে সাথেই আপনি জানতে পারবেন।
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;