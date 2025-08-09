import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socketService from '../config/socket';
import { getCurrentBookingStatus } from '../utils/api';

export interface PujaService {
  id: number;
  name: string;
  description: string;
  duration: string;
  time: string[];
  items: string[];
}

// Updated puja services data
export const pujaServices: PujaService[] = [
  {
    id: 1,
    name: "নিত্য পূজা",
    description: "প্রতিদিনের নিয়মিত পূজা অর্চনা",
    duration: "৩০ মিনিট",
    time: ["সকাল ৮:০০", "সকাল ১০:০০", "বিকাল ৪:০০"],
    items: ["ফুল", "বেলপাতা", "চন্দন", "ধূপ", "দীপ"]
  },
  {
    id: 2,
    name: "বিশেষ অর্চনা",
    description: "বিশেষ পূজা অর্চনা ও প্রসাদ বিতরণ",
    duration: "১ ঘণ্টা",
    time: ["সকাল ৯:০০", "দুপুর ১২:০০", "সন্ধ্যা ৬:০০"],
    items: ["ফুল", "বেলপাতা", "চন্দন", "ধূপ", "দীপ", "মিষ্টি", "ফল"]
  },
  {
    id: 3,
    name: "সত্যনারায়ণ পূজা",
    description: "পূর্ণ সত্যনারায়ণ পূজা ও কথা পাঠ",
    duration: "২ ঘণ্টা",
    time: ["সকাল ১০:০০", "বিকাল ৪:০০"],
    items: ["ফুল", "বেলপাতা", "চন্দন", "ধূপ", "দীপ", "নৈবেদ্য", "ফল", "মিষ্টি"]
  }
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
    message: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const statusUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Parse time string properly (Bangla to 24-hour format)
  const parseTimeString = (timeStr: string): { hour: number, minute: number } => {
    const timeMap: { [key: string]: { hour: number, minute: number } } = {
      'সকাল ৮:০০': { hour: 8, minute: 0 },
      'সকাল ৯:০০': { hour: 9, minute: 0 },
      'সকাল ১০:০০': { hour: 10, minute: 0 },
      'দুপুর ১২:০০': { hour: 12, minute: 0 },
      'বিকাল ৪:০০': { hour: 16, minute: 0 },
      'সন্ধ্যা ৬:০০': { hour: 18, minute: 0 }
    };

    return timeMap[timeStr] || { hour: 0, minute: 0 };
  };

  // Calculate exact expiry time based on user's selected date/time
  const calculateExpiryTime = (dateStr: string, timeStr: string): Date => {
    const selectedDate = new Date(dateStr);
    const { hour, minute } = parseTimeString(timeStr);
    
    selectedDate.setHours(hour, minute + 5, 0, 0); // Add 5 minutes
    
    return selectedDate;
  };

  // Set timeout based on user's actual selected time
  const setStatusExpiryTimeout = (dateStr: string, timeStr: string) => {
    const expiryTime = calculateExpiryTime(dateStr, timeStr);
    const now = new Date();
    const timeUntilExpiry = expiryTime.getTime() - now.getTime();
    
    console.log('⏰ Setting timeout for:', {
      selectedDate: dateStr,
      selectedTime: timeStr,
      expiryTime: expiryTime.toLocaleString(),
      timeUntilExpiry: `${Math.round(timeUntilExpiry / 1000)} seconds`
    });

    if (timeUntilExpiry > 0) {
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }

      statusUpdateTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Status expired, hiding status section');
        setShowStatusSection(false);
        setShowForm(false);
        setBookingStatus(null);
        setTimeRemaining('');
      }, timeUntilExpiry);

      startCountdown(expiryTime);
    } else {
      console.log('⏰ Time already passed, hiding status immediately');
      setShowStatusSection(false);
      setShowForm(false);
      setBookingStatus(null);
    }
  };

  // Countdown timer to show remaining time
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

  // Check user's current booking status from DB
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
          message: response.data.message
        };

        setBookingStatus(status);
        setShowStatusSection(true);
        setShowForm(false);
        
        if (response.data.status === 'approved') {
          setStatusExpiryTimeout(response.data.date, response.data.time);
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

  // Check booking status on component mount and user login
  useEffect(() => {
    if (user && !loading) {
      checkCurrentBookingStatus();
    }
  }, [user, loading]);

  // Socket connection and real-time event handlers
  useEffect(() => {
    if (user?._id || user?.id) {
      const userId = user._id || user.id;
      
      socketService.connect(userId);
      socketService.joinUserRoom(userId);
      setSocketConnected(socketService.isConnected());

      socketService.onBookingStatusUpdate((data: any) => {
        console.log('📨 Real-time booking status update received:', data);
        
        if (bookingStatus && data.bookingId === bookingStatus.bookingId) {
          console.log('📨 Update is for current user\'s booking:', data.bookingId);
          
          if (data.status === 'approved') {
            console.log('✅ Booking approved - updating status with timer');
            
            setBookingStatus(prev => prev ? {
              ...prev,
              status: 'approved',
              message: data.message
            } : null);

            if (bookingStatus) {
              setStatusExpiryTimeout(bookingStatus.date, bookingStatus.time);
            }

          } else if (data.status === 'rejected') {
            console.log('❌ Booking rejected - updating status with reason');
            
            setBookingStatus(prev => prev ? {
              ...prev,
              status: 'rejected',
              rejectionReason: data.rejectionReason
            } : null);
            
            if (statusUpdateTimeoutRef.current) {
              clearTimeout(statusUpdateTimeoutRef.current);
            }
            setTimeRemaining('');
          }
        } else {
          console.log('📨 Update not for current booking, checking if need to refresh status');
          if (!bookingStatus) {
            checkCurrentBookingStatus();
          }
        }
      });

      const socket = socketService.getSocket();
      if (socket) {
        socket.on('connect', () => {
          console.log('✅ User socket connected');
          setSocketConnected(true);
          socketService.joinUserRoom(userId);
        });
        
        socket.on('disconnect', () => {
          console.log('❌ User socket disconnected');
          setSocketConnected(false);
        });

        socket.on('connect_error', (error) => {
          console.error('❌ User socket connection error:', error);
          setSocketConnected(false);
        });

        socket.on('user-room-joined', (data) => {
          console.log('👤 Joined user room:', data);
        });
      }
    }

    return () => {
      socketService.offBookingStatusUpdate();
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }
    };
  }, [user, bookingStatus?.bookingId]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user && showForm) {
      setFormData(prev => ({
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
        const service = pujaServices.find(s => s.id === serviceId);
        if (service) {
          setSelectedService(service);
          setFormData(prev => ({ ...prev, serviceId: service.id }));
          setShowForm(true);
        }
        sessionStorage.removeItem('selectedServiceId');
      }
    }
  }, [user]);

  const handleServiceSelect = (service: PujaService) => {
    if (!user && !loading) {
      sessionStorage.setItem('selectedServiceId', service.id.toString());
      navigate('/signup', { 
        state: { 
          message: 'পূজা বুকিং করতে প্রথমে সাইন আপ করুন',
          returnTo: '/booking'
        }
      });
      return;
    }

    if (user) {
      setSelectedService(service);
      setFormData(prev => ({ ...prev, serviceId: service.id }));
      setShowForm(true);
      setShowStatusSection(false);
      setBookingStatus(null);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!selectedService) {
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

      const response = await fetch(`${apiUrl}/bookings/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Booking created successfully:', data.data);
        
        setShowForm(false);
        setShowStatusSection(true);
        setBookingStatus({
          bookingId: data.data.bookingId,
          serviceName: data.data.serviceName,
          date: data.data.date,
          time: data.data.time,
          status: 'pending'
        });

        setSelectedService(null);
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          serviceId: 0,
          date: '',
          time: '',
          message: ''
        });
      } else {
        setError(data.message || 'বুকিং করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'বুকিং করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
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
      message: ''
    });
    setError('');
  };

  const handleNewBooking = () => {
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

  if (loading || isLoadingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-orange-300 opacity-75"></div>
          </div>
          <p className="text-gray-600 text-lg font-medium">
            {loading ? 'লোড হচ্ছে...' : 'বুকিং স্ট্যাটাস চেক করা হচ্ছে...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
        {/* Enhanced Hero Section */}
        <div className="relative bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-64 h-64 bg-white opacity-10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-yellow-300 opacity-20 rounded-full animate-bounce"></div>
            <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-pink-300 opacity-15 rounded-full animate-ping"></div>
          </div>
          
          <div className="relative container mx-auto px-4 py-20">
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fadeInUp">
                পূজা বুকিং
              </h1>
              <div className="w-24 h-1 bg-white mx-auto mb-6 rounded-full"></div>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed animate-fadeInUp animation-delay-300">
                {showStatusSection ? 'আপনার বুকিংয়ের অবস্থা' :
                 showForm ? 'বুকিং ফর্ম পূরণ করুন' : 
                 'আপনার পছন্দের পূজা সেবা নির্বাচন করুন'}
              </p>
              {!user && !showStatusSection && (
                <p className="text-center mt-6 text-orange-100 text-lg">
                  পূজা বুকিং করতে প্রথমে সাইন আপ করুন
                </p>
              )}
              
              {/* Enhanced Socket Connection Status */}
              {user && (
                <div className="text-center mt-8 space-y-3">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-lg ${
                    socketConnected 
                      ? 'bg-green-500 bg-opacity-20 text-green-100' 
                      : 'bg-red-500 bg-opacity-20 text-red-100'
                  }`}>
                    <span className={`w-3 h-3 rounded-full mr-3 ${
                      socketConnected ? 'bg-green-300 animate-pulse' : 'bg-red-300'
                    }`}></span>
                    {socketConnected ? 'রিয়েল-টাইম সংযুক্ত' : 'সংযোগ বিচ্ছিন্ন'}
                  </div>
                  
                  {/* Show current booking status in header */}
                  {bookingStatus && (
                    <div className="text-center">
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                        bookingStatus.status === 'pending' ? 'bg-yellow-500 bg-opacity-20 text-yellow-100' :
                        bookingStatus.status === 'approved' ? 'bg-green-500 bg-opacity-20 text-green-100' :
                        'bg-red-500 bg-opacity-20 text-red-100'
                      }`}>
                        {bookingStatus.status === 'pending' && '⏳ অপেক্ষমান'}
                        {bookingStatus.status === 'approved' && '✅ অনুমোদিত'}
                        {bookingStatus.status === 'rejected' && '❌ বাতিল'}
                        {bookingStatus.status === 'approved' && timeRemaining && ` (${timeRemaining})`}
                      </span>
                    </div>
                  )}
                  
                  {/* Decorative elements */}
                  <div className="flex justify-center mt-6 space-x-4">
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-100"></div>
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-200"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 shadow-lg">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-lg font-medium">{error}</span>
                </div>
                {!socketConnected && user && (
                  <div className="mt-4">
                    <button 
                      onClick={() => {
                        setError('');
                        socketService.disconnect();
                        const userId = user._id || user.id;
                        socketService.connect(userId);
                        socketService.joinUserRoom(userId);
                        setSocketConnected(socketService.isConnected());
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors duration-300"
                    >
                      পুনরায় সংযোগ করুন
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Status Section */}
            {showStatusSection && bookingStatus && (
              <div className="max-w-2xl mx-auto mb-16">
                <div className={`rounded-3xl p-8 shadow-2xl border-2 ${
                  bookingStatus.status === 'pending' ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' :
                  bookingStatus.status === 'approved' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' :
                  'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                }`}>
                  <div className="text-center">
                    <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg ${
                      bookingStatus.status === 'pending' ? 'bg-gradient-to-br from-yellow-200 to-orange-200' :
                      bookingStatus.status === 'approved' ? 'bg-gradient-to-br from-green-200 to-emerald-200' :
                      'bg-gradient-to-br from-red-200 to-pink-200'
                    }`}>
                      {bookingStatus.status === 'pending' && (
                        <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-yellow-600"></div>
                      )}
                      {bookingStatus.status === 'approved' && (
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                      {bookingStatus.status === 'rejected' && (
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      )}
                    </div>

                    <h3 className={`text-2xl md:text-3xl font-bold mb-4 ${
                      bookingStatus.status === 'pending' ? 'text-yellow-800' :
                      bookingStatus.status === 'approved' ? 'text-green-800' :
                      'text-red-800'
                    }`}>
                      {bookingStatus.status === 'pending' && 'বুকিং প্রক্রিয়াধীন'}
                      {bookingStatus.status === 'approved' && 'বুকিং অনুমোদিত!'}
                      {bookingStatus.status === 'rejected' && 'বুকিং বাতিল'}
                    </h3>

                    <div className={`bg-white rounded-2xl p-6 mb-6 shadow-inner border ${
                      bookingStatus.status === 'pending' ? 'border-yellow-100' :
                      bookingStatus.status === 'approved' ? 'border-green-100' :
                      'border-red-100'
                    }`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-orange-100 rounded-full mr-4">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">পূজার নাম</p>
                            <p className="text-gray-800 font-bold">{bookingStatus.serviceName}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-blue-100 rounded-full mr-4">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">তারিখ</p>
                            <p className="text-gray-800 font-bold">{formatDate(bookingStatus.date)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-purple-100 rounded-full mr-4">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">সময়</p>
                            <p className="text-gray-800 font-bold">{bookingStatus.time}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-indigo-100 rounded-full mr-4">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">বুকিং আইডি</p>
                            <p className="text-gray-800 font-bold text-xs">{bookingStatus.bookingId}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Countdown Timer for Approved Bookings */}
                    {bookingStatus.status === 'approved' && timeRemaining && (
                      <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-200 rounded-2xl p-4 mb-6 shadow-lg">
                        <div className="flex items-center justify-center">
                          <div className="p-2 bg-blue-200 rounded-full mr-4">
                            <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <p className="text-blue-800 text-lg font-bold">
                              ⏰ স্ট্যাটাস পেজ লুকিয়ে যাবে: {timeRemaining} মিনিট
                            </p>
                            <p className="text-blue-700 text-sm mt-1">
                              (নির্ধারিত সময়ের ৫ মিনিট পর স্বয়ংক্রিয়ভাবে সেবা তালিকা দেখাবে)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {bookingStatus.status === 'pending' && (
                      <div className="bg-yellow-100 border-2 border-yellow-200 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center justify-center">
                          <div className="p-2 bg-yellow-200 rounded-full mr-4">
                            <svg className="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-yellow-800 font-medium text-lg">
                            অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন। আপনি রিয়েল-টাইম আপডেট পাবেন।
                          </p>
                        </div>
                      </div>
                    )}

                    {bookingStatus.status === 'approved' && (
                      <div className="space-y-4">
                        <div className="bg-green-100 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
                          <div className="flex items-start">
                            <div className="p-2 bg-green-200 rounded-full mr-4 mt-1">
                              <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-green-800 font-medium text-lg mb-4">
                                আপনার বুকিং অনুমোদিত হয়েছে! নির্ধারিত সময়ের ৫ মিনিট পর স্বয়ংক্রিয়ভাবে নতুন পূজা সেবা দেখাবে।
                              </p>
                              <div className="bg-white rounded-xl p-4 border border-green-200">
                                <p className="text-sm text-green-800">
                                  <strong className="text-base">নির্দেশনা:</strong><br/>
                                  • নির্ধারিত তারিখ ও সময়ে মন্দিরে উপস্থিত হন<br/>
                                  • পূজার ১৫ মিনিট আগে পৌঁছান<br/>
                                  • প্রয়োজনীয় উপকরণ সাথে রাখুন
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* ✅ REMOVED: "এখনই নতুন বুকিং করুন" button for approved bookings */}
                      </div>
                    )}

                    {bookingStatus.status === 'rejected' && (
                      <div className="space-y-4">
                        {bookingStatus.rejectionReason && (
                          <div className="bg-red-100 border-2 border-red-200 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-start">
                              <div className="p-2 bg-red-200 rounded-full mr-4 mt-1">
                                <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm text-red-800 font-bold mb-2">বাতিলের কারণ:</p>
                                <p className="text-red-700">{bookingStatus.rejectionReason}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="bg-red-100 border-2 border-red-200 rounded-2xl p-6 shadow-lg">
                          <p className="text-red-800 font-medium text-lg mb-4">
                            দুঃখিত, আপনার বুকিং বাতিল করা হয়েছে। অন্য তারিখে আবার বুকিং করতে পারেন।
                          </p>
                          <button
                            onClick={handleNewBooking}
                            className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
                          >
                            নতুন বুকিং করুন
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Services Selection */}
            {!showStatusSection && !showForm && (
              <div className="mb-16">
                <div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">পূজা সেবাসমূহ</h2>
                  <div className="w-32 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto rounded-full"></div>
                  <p className="text-gray-600 mt-4 text-lg">আপনার পছন্দের পূজা সেবা নির্বাচন করুন</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {pujaServices.map((service, index) => (
                    <div
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                      className="group bg-white rounded-3xl cursor-pointer transition-all duration-500 shadow-lg hover:shadow-2xl border border-gray-100 hover:border-orange-200 hover:-translate-y-3 overflow-hidden"
                      style={{
                        animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both`,
                      }}
                    >
                      <div className="relative p-8">
                        <div className="absolute top-4 right-4 w-3 h-3 bg-orange-300 rounded-full opacity-70 animate-pulse"></div>
                        
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:from-orange-200 group-hover:to-red-200 transition-all duration-300">
                            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold mb-3 text-gray-800 group-hover:text-orange-600 transition-colors duration-300">{service.name}</h3>
                          <p className="text-gray-600 leading-relaxed">{service.description}</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center p-3 bg-gray-50 rounded-xl group-hover:bg-orange-50 transition-colors duration-300">
                            <div className="p-2 bg-blue-100 rounded-full mr-4 group-hover:bg-blue-200 transition-colors duration-300">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 font-medium">সময়কাল</p>
                              <p className="text-gray-800 font-bold">{service.duration}</p>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-orange-50 transition-colors duration-300">
                            <div className="flex items-center mb-2">
                              <div className="p-2 bg-green-100 rounded-full mr-4 group-hover:bg-green-200 transition-colors duration-300">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 font-medium">উপকরণ</p>
                                <p className="text-gray-800 text-sm">{service.items.join(', ')}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-orange-50 transition-colors duration-300">
                            <div className="flex items-center mb-2">
                              <div className="p-2 bg-purple-100 rounded-full mr-4 group-hover:bg-purple-200 transition-colors duration-300">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 font-medium">সময়সূচী</p>
                                <p className="text-gray-800 text-sm">{service.time.join(', ')}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-8 text-center">
                          <span className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg group-hover:from-orange-600 group-hover:to-red-600 transition-all duration-300 transform group-hover:-translate-y-1">
                            {user ? 'বুকিং করুন' : 'সাইন আপ করে বুকিং করুন'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Booking Form */}
            {!showStatusSection && showForm && selectedService && (
              <div className="max-w-2xl mx-auto">
                {/* Selected Service Summary */}
                <div className="bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-200 rounded-2xl p-6 mb-8 shadow-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-200 to-red-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-orange-800 mb-2">নির্বাচিত সেবা</h3>
                    <p className="text-orange-700 font-bold text-lg">{selectedService.name}</p>
                    <p className="text-sm text-orange-600 mt-1">{selectedService.description}</p>
                    <button
                      onClick={handleBackToServices}
                      className="mt-4 text-orange-600 hover:text-orange-800 text-sm underline font-medium transition-colors duration-300"
                    >
                      অন্য সেবা নির্বাচন করুন
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-gray-700 mb-3 font-semibold" htmlFor="name">
                        নাম *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        readOnly
                        className="w-full px-4 py-3 border-2 rounded-xl bg-gray-50 border-gray-200 font-medium"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-3 font-semibold" htmlFor="phone">
                        ফোন নম্বর *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        required
                        className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 mb-3 font-semibold" htmlFor="email">
                      ইমেইল *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      readOnly
                      className="w-full px-4 py-3 border-2 rounded-xl bg-gray-50 border-gray-200 font-medium"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-gray-700 mb-3 font-semibold" htmlFor="date">
                        তারিখ * (আগামীকাল থেকে)
                      </label>
                      <input
                        type="date"
                        id="date"
                        required
                        min={getMinDate()}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-3 font-semibold" htmlFor="time">
                        সময় *
                      </label>
                      <select
                        id="time"
                        required
                        className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
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

                  <div className="mb-8">
                    <label className="block text-gray-700 mb-3 font-semibold" htmlFor="message">
                      বিশেষ নির্দেশনা (যদি থাকে)
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="কোন বিশেষ প্রয়োজন বা নির্দেশনা থাকলে লিখুন..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleBackToServices}
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-4 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 disabled:opacity-50 font-semibold shadow-lg"
                    >
                      পিছনে যান
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center font-semibold shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                          বুকিং করা হচ্ছে...
                        </>
                      ) : (
                        'বুকিং নিশ্চিত করুন'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        
        .animation-delay-100 {
          animation-delay: 0.1s;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
};

export default Booking;