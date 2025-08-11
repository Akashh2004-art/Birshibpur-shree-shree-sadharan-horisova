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
  const [socketConnected, setSocketConnected] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const statusUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [connectionError, setConnectionError] = useState<string>('');

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

  const calculateExpiryTime = (dateStr: string, timeStr: string): Date => {
    const selectedDate = new Date(dateStr);
    const { hour, minute } = parseTimeString(timeStr);
    selectedDate.setHours(hour, minute + 5, 0, 0);
    return selectedDate;
  };

  const setStatusExpiryTimeout = (dateStr: string, timeStr: string) => {
    const expiryTime = calculateExpiryTime(dateStr, timeStr);
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

  // ✅ ENHANCED SOCKET CONNECTION MANAGEMENT
  useEffect(() => {
    const setupSocket = () => {
      if (!user) {
        setSocketConnected(false);
        setConnectionError('');
        return;
      }

      // ✅ CONSISTENT USER ID HANDLING
      const userId = user.id || user._id;
      if (!userId) {
        console.error('❌ No user ID found');
        setConnectionError('ব্যবহারকারীর তথ্য পাওয়া যায়নি');
        return;
      }

      try {
        console.log('🔌 Setting up socket for user:', userId);
        
        // ✅ GET OR CREATE SOCKET CONNECTION
        const socket = socketService.getSocket();
        
        if (!socket || !socket.connected) {
          console.log('🔄 Creating new socket connection...');
          socketService.connect(userId);
        }

        const activeSocket = socketService.getSocket();
        if (!activeSocket) {
          setConnectionError('সকেট সংযোগ ব্যর্থ');
          return;
        }

        // ✅ SOCKET STATUS TRACKING
        const updateConnectionStatus = () => {
          const isConnected = socketService.isConnected();
          setSocketConnected(isConnected);
          setConnectionError(isConnected ? '' : 'সংযোগ বিচ্ছিন্ন');
        };

        // ✅ SOCKET EVENT LISTENERS
        activeSocket.on('connect', () => {
          console.log('✅ Socket connected in Booking component');
          updateConnectionStatus();
          // Auto join user room
          socketService.joinUserRoom(userId);
        });

        activeSocket.on('disconnect', (reason) => {
          console.log('❌ Socket disconnected:', reason);
          updateConnectionStatus();
        });

        activeSocket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          setConnectionError('সংযোগে ত্রুটি: ' + error.message);
          updateConnectionStatus();
        });

        activeSocket.on('user-room-joined', (data) => {
          console.log('✅ User room joined:', data);
          setConnectionError('');
        });

        activeSocket.on('duplicate-connection', (message) => {
          console.log('⚠️ Duplicate connection:', message);
        });

        // ✅ BOOKING STATUS UPDATES
        socketService.onBookingStatusUpdate((data: any) => {
          console.log('📋 Booking status update received:', data);
          
          if (bookingStatus && data.bookingId === bookingStatus.bookingId) {
            if (data.status === 'approved') {
              setBookingStatus((prev) =>
                prev ? { ...prev, status: 'approved', message: data.message } : null
              );
              if (bookingStatus) {
                setStatusExpiryTimeout(bookingStatus.date, bookingStatus.time);
              }
            } else if (data.status === 'rejected') {
              setBookingStatus((prev) =>
                prev ? { ...prev, status: 'rejected', rejectionReason: data.rejectionReason } : null
              );
              if (statusUpdateTimeoutRef.current) {
                clearTimeout(statusUpdateTimeoutRef.current);
              }
              setTimeRemaining('');
            }
          } else if (!bookingStatus) {
            checkCurrentBookingStatus();
          }
        });

        // ✅ INITIAL CONNECTION STATUS
        updateConnectionStatus();
        
        // ✅ JOIN USER ROOM IF CONNECTED
        if (activeSocket.connected) {
          socketService.joinUserRoom(userId);
        }

      } catch (error) {
        console.error('❌ Socket setup failed:', error);
        setConnectionError('সকেট সেটআপ ব্যর্থ');
      }
    };

    setupSocket();

    return () => {
      socketService.offBookingStatusUpdate();
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }
    };
  }, [user, bookingStatus?.bookingId]);

  // ✅ CONNECTION RETRY MECHANISM
  const retryConnection = async () => {
    if (!user) return;
    
    const userId = user.id || user._id;
    if (!userId) return;

    try {
      setConnectionError('পুনরায় সংযোগ করা হচ্ছে...');
      
      // Disconnect existing socket
      socketService.disconnect();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reconnect
      socketService.connect(userId);
      socketService.joinUserRoom(userId);
      
      // Check connection after a moment
      setTimeout(() => {
        const isConnected = socketService.isConnected();
        setSocketConnected(isConnected);
        setConnectionError(isConnected ? '' : 'সংযোগ ব্যর্থ');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Retry connection failed:', error);
      setConnectionError('পুনরায় সংযোগ ব্যর্থ');
    }
  };

  useEffect(() => {
    if (user && !loading) {
      checkCurrentBookingStatus();
    }
  }, [user, loading]);

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
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        setShowForm(false);
        setShowStatusSection(true);
        setBookingStatus({
          bookingId: data.data.bookingId,
          serviceName: data.data.serviceName,
          date: data.data.date,
          time: data.data.time,
          status: 'pending',
        });
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
      } else {
        setError(data.message || 'বুকিং করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
      }
    } catch (err: any) {
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
      message: '',
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
      {/* Enhanced Hero Section */}
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
          {user && (
            <div className="mt-4 space-y-2">
              <div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    socketConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}
                  ></span>
                  {socketConnected ? 'রিয়েল-টাইম সংযুক্ত' : 'সংযোগ বিচ্ছিন্ন'}
                </span>
                {bookingStatus && (
                  <span
                    className={`ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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
              {connectionError && (
                <div className="text-center">
                  <p className="text-orange-100 text-sm">{connectionError}</p>
                  {!socketConnected && (
                    <button
                      onClick={retryConnection}
                      className="mt-2 bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                    >
                      পুনরায় সংযোগ করুন
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mb-6">
              <p>{error}</p>
            </div>
          )}

          {/* Status Section - Unchanged */}
          {showStatusSection && bookingStatus && (
            <div className="bg-white rounded-lg p-6 mb-8 border">
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
                  {bookingStatus.status === 'pending' && 'বুকিং প্রক্রিয়াধীন'}
                  {bookingStatus.status === 'approved' && 'বুকিং অনুমোদিত!'}
                  {bookingStatus.status === 'rejected' && 'বুকিং বাতিল'}
                </h3>
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
                    <p className="font-semibold">{bookingStatus.bookingId}</p>
                  </div>
                </div>
                {bookingStatus.status === 'approved' && timeRemaining && (
                  <p className="text-blue-600 mb-4">স্ট্যাটাস পেজ লুকিয়ে যাবে: {timeRemaining}</p>
                )}
                {bookingStatus.status === 'pending' && (
                  <p className="text-yellow-600">
                    অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন।
                  </p>
                )}
                {bookingStatus.status === 'approved' && (
                  <div className="text-left bg-green-100 p-4 rounded-lg">
                    <p className="text-green-700">
                      <strong>নির্দেশনা:</strong>
                      <br />
                      • নির্ধারিত সময়ে মন্দিরে উপস্থিত হন
                      <br />
                      • পূজার ১৫ মিনিট আগে পৌঁছান
                      <br />
                      • প্রয়োজনীয় উপকরণ সাথে রাখুন
                    </p>
                  </div>
                )}
                {bookingStatus.status === 'rejected' && (
                  <div className="space-y-4">
                    {bookingStatus.rejectionReason && (
                      <p className="text-red-600">
                        <strong>বাতিলের কারণ:</strong> {bookingStatus.rejectionReason}
                      </p>
                    )}
                    <button
                      onClick={handleNewBooking}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                      নতুন বুকিং করুন
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Services Selection - Unchanged */}
          {!showStatusSection && !showForm && (
            <div>
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">পূজা সেবাসমূহ</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pujaServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="bg-white rounded-lg p-6 border hover:border-orange-500 cursor-pointer hover:shadow-lg"
                  >
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{service.name}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>সময়কাল:</strong> {service.duration}
                      </p>
                      <p className="text-sm">
                        <strong>উপকরণ:</strong> {service.items.join(', ')}
                      </p>
                      <p className="text-sm">
                        <strong>সময়সূচী:</strong> {service.time.join(', ')}
                      </p>
                    </div>
                    <button className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 w-full">
                      {user ? 'বুকিং করুন' : 'সাইন আপ করে বুকিং করুন'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booking Form - Unchanged */}
          {!showStatusSection && showForm && selectedService && (
            <div className="bg-white rounded-lg p-6 border max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-2">{selectedService.name}</h3>
              <p className="text-gray-600 mb-4">{selectedService.description}</p>
              <button
                onClick={handleBackToServices}
                className="text-orange-500 hover:text-orange-700 mb-4"
              >
                অন্য সেবা নির্বাচন করুন
              </button>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 mb-1" htmlFor="name">
                      নাম *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      readOnly
                      className="w-full p-2 border rounded-lg bg-gray-100"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1" htmlFor="phone">
                      ফোন নম্বর *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      className="w-full p-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-1" htmlFor="email">
                    ইমেইল *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    readOnly
                    className="w-full p-2 border rounded-lg bg-gray-100"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 mb-1" htmlFor="date">
                      তারিখ * (আগামীকাল থেকে)
                    </label>
                    <input
                      type="date"
                      id="date"
                      required
                      min={getMinDate()}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1" htmlFor="time">
                      সময় *
                    </label>
                    <select
                      id="time"
                      required
                      className="w-full p-2 border rounded-lg focus:outline-none focus:border-orange-500"
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
                <div className="mb-4">
                  <label className="block text-gray-700 mb-1" htmlFor="message">
                    বিশেষ নির্দেশনা (যদি থাকে)
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:border-orange-500"
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
                    className="flex-1 bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600"
                  >
                    পিছনে যান
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
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
  );
};

export default Booking;