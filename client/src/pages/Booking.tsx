import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    description: "পূর্ণ সত্যনারায়ণ পূজা ও কথা পাঠ ",
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
    name: '', email: '', phone: '', serviceId: 0, date: '', time: '', message: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState(false);
  const [lastStatusCheck, setLastStatusCheck] = useState<string>('');

  // Date input ref for manual trigger
  const dateInputRef = useRef<HTMLInputElement>(null);

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const checkCurrentBookingStatus = async (silent = false) => {
    if (!user) return;
    if (!silent) setIsLoadingStatus(true);
    
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
        
        const previousStatus = lastStatusCheck;
        setLastStatusCheck(status.status);
        
        if (silent && previousStatus === status.status) {
          setBookingStatus(status);
          return;
        }
        
        setBookingStatus(status);
        setShowStatusSection(true);
        setShowForm(false);
        
        if (status.status === 'pending') {
          if (!isAutoRefreshActive) startAutoRefresh();
        } else {
          stopAutoRefresh();
        }
        
      } else {
        setShowStatusSection(false);
        setBookingStatus(null);
        setLastStatusCheck('');
        stopAutoRefresh();
      }
    } catch (error) {
      setError('There is a problem with your internet connection. Please check your internet');
      if (!silent) {
        setShowStatusSection(false);
        setBookingStatus(null);
        setLastStatusCheck('');
      }
    } finally {
      if (!silent) setIsLoadingStatus(false);
    }
  };

  const startAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) return;
    setIsAutoRefreshActive(true);
    autoRefreshIntervalRef.current = setInterval(() => {
      checkCurrentBookingStatus(true);
    }, 15000);
  };

  const stopAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
      setIsAutoRefreshActive(false);
    }
  };

  const handleServiceSelect = (service: PujaService) => {
    if (!user && !loading) {
      sessionStorage.setItem('selectedServiceId', service.id.toString());
      navigate('/signup', {
        state: { message: "To book a puja, first sign up. It's absolutely free!", returnTo: '/booking' },
      });
      return;
    }
    if (user) {
      setSelectedService(service);
      setFormData((prev) => ({ ...prev, serviceId: service.id }));
      setShowForm(true);
      setShowStatusSection(false);
      setBookingStatus(null);
      setLastStatusCheck('');
      setError('');
      stopAutoRefresh();
    }
  };

  const handleBackToServices = () => {
    setShowForm(false);
    setSelectedService(null);
    setFormData({
      name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
      serviceId: 0, date: '', time: '', message: '',
    });
    setError('');
    stopAutoRefresh();
  };

  const handleNewBooking = () => {
    setShowStatusSection(false);
    setBookingStatus(null);
    setLastStatusCheck('');
    setError('');
    stopAutoRefresh();
    setShowForm(false);
    setSelectedService(null);
    setFormData({
      name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
      serviceId: 0, date: '', time: '', message: '',
    });
  };

  const handleManualRefresh = () => {
    checkCurrentBookingStatus(false);
  };

  // Function to trigger date picker
const triggerDatePicker = () => {
  if (dateInputRef.current) {
    const input = dateInputRef.current as HTMLInputElement & { showPicker?: () => void };
    
    if (input.showPicker && typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch (error) {
        input.focus();
      }
    } else {
      input.focus();
    }
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!selectedService || !user) {
      setError('There was a problem selecting the service. Please try again');
      setIsSubmitting(false);
      return;
    }

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setError("Today's date or a previous date cannot be selected. Please select tomorrow or the next date");
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
        setSelectedService(null);
        setFormData({
          name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
          serviceId: 0, date: '', time: '', message: '',
        });
        setShowForm(false);
        setShowStatusSection(true);
        setLastStatusCheck('');
        await checkCurrentBookingStatus();
      } else {
        setError(data.message || 'There was a problem submitting the booking. Please try again');
      }
    } catch (err: any) {
      setError(err.message || 'There is a problem with your internet connection. Please check your connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
      case 'approved': return 'bg-gradient-to-r from-green-500 to-teal-500 text-white';
      case 'rejected': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user && !loading) checkCurrentBookingStatus();
    return () => stopAutoRefresh();
  }, [user, loading]);

  useEffect(() => {
    if (user && showForm) {
      setFormData((prev) => ({
        ...prev, name: user.name || '', email: user.email || '', phone: user.phone || '',
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

  useEffect(() => {
    return () => stopAutoRefresh();
  }, []);

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-16">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
        <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-orange-300 opacity-75"></div>
      </div>
      <span className="ml-4 text-gray-600 text-lg font-medium">দয়া করে অপেক্ষা করুন...</span>
    </div>
  );

  if (loading || isLoadingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Hero Section */}
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
              {showStatusSection
                ? '🔔 আপনার বুকিংয়ের সর্বশেষ অবস্থা এখানে দেখুন'
                : showForm
                ? '📝 আপনার পূজার জন্য ফর্ম পূরণ করুন'
                : ' আপনার মনের শান্তি ও সুখের জন্য পছন্দের পূজা সেবা বেছে নিন 🤍'}
            </p>
            
            <div className="flex justify-center mt-8 space-x-4">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-100"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-200"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-8 py-6 rounded-2xl max-w-md mx-auto shadow-lg mb-8 animate-fadeInUp">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">{error}</p>
              </div>
              <p className="text-center text-sm mt-2 opacity-80">😊 চিন্তা করবেন না, আবার চেষ্টা করুন!</p>
            </div>
          )}

          {/* Enhanced Status Section */}
          {showStatusSection && bookingStatus && (
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-8 animate-fadeInUp">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-8 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">📊 বুকিং স্ট্যাটাস</h2>
                    <p className="text-blue-100 mb-3">আপনার পূজা বুকিংয়ের বর্তমান অবস্থা</p>
                    <div className="flex items-center">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${getStatusColor(bookingStatus.status)}`}>
                        {bookingStatus.status === 'pending' && '⏳ অনুমোদনের জন্য প্রক্রিয়াধীন'}
                        {bookingStatus.status === 'approved' && '✅ সফলভাবে অনুমোদিত হয়েছে!'}
                        {bookingStatus.status === 'rejected' && '❌ দুঃখিত, বাতিল করা হয়েছে'}
                      </span>
                      {isAutoRefreshActive && (
                        <div className="ml-4 flex items-center">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse mr-2"></div>
                          <span className="text-sm opacity-90">Live</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleManualRefresh}
                    disabled={isLoadingStatus}
                    className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    title="এখনই স্ট্যাটাস চেক করুন"
                  >
                    <svg className={`w-6 h-6 ${isLoadingStatus ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-8">
                {/* Booking Details Card */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">📋 বুকিং বিস্তারিত তথ্য</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center group hover:bg-orange-50 p-3 rounded-xl transition-all">
                        <div className="p-2 bg-orange-100 rounded-full mr-4 group-hover:bg-orange-200 transition-colors">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h4a1 1 0 011 1v5m-6 0V9a1 1 0 011-1h4a1 1 0 011 1v11" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-800 font-semibold">{bookingStatus.serviceName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center group hover:bg-blue-50 p-3 rounded-xl transition-all">
                        <div className="p-2 bg-blue-100 rounded-full mr-4 group-hover:bg-blue-200 transition-colors">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-800 font-semibold">{formatDate(bookingStatus.date)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center group hover:bg-green-50 p-3 rounded-xl transition-all">
                        <div className="p-2 bg-green-100 rounded-full mr-4 group-hover:bg-green-200 transition-colors">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-800 font-semibold">{bookingStatus.time}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center group hover:bg-purple-50 p-3 rounded-xl transition-all">
                        <div className="p-2 bg-purple-100 rounded-full mr-4 group-hover:bg-purple-200 transition-colors">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-800 font-mono text-xs">🆔 {bookingStatus.bookingId}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {bookingStatus.message && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="text-gray-700">
                        <span className="font-semibold text-gray-800">💬 বিশেষ নির্দেশনা:</span> {bookingStatus.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Status-specific messages */}
                {bookingStatus.status === 'pending' && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 p-6 rounded-2xl mb-6">
                    <div className="text-center">
                      <div className="text-4xl mb-3">⏳</div>
                      <h3 className="text-xl font-bold text-yellow-800 mb-2">ধৈর্য ধরুন! অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন</h3>
                      <p className="text-yellow-700">🙏 আমরা খুব শীঘ্রই আপনার বুকিং পর্যালোচনা করে জানিয়ে দেব</p>
                      <p className="text-sm text-yellow-600 mt-2">💡 টিপস: এই পেজটি খোলা রাখুন, স্বয়ংক্রিয় আপডেট পাবেন!</p>
                    </div>
                  </div>
                )}

                {bookingStatus.status === 'approved' && (
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 p-6 rounded-2xl mb-6">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="text-2xl font-bold text-green-800 mb-2">🎊 অভিনন্দন! আপনার বুকিং সফলভাবে অনুমোদিত হয়েছে! 🎊</h3>
                                              <p className="text-green-700 text-lg mb-3">✅ নির্ধারিত তারিখ ও সময়ে পূজা স্থানে উপস্থিত থাকুন</p>
                      <div className="bg-green-100 rounded-xl p-4 mt-4">
                        <p className="text-green-800 font-medium">🙏 আমরা আপনার পূজার সব ব্যবস্থা সুন্দরভাবে করে দেবো</p>
                                                <p className="text-green-700 text-sm mt-2">
                          🌺 <strong>{bookingStatus.serviceName}</strong> এর জন্য <strong>{pujaServices.find(service => service.name === bookingStatus.serviceName)?.items.join(', ') || 'সকল প্রয়োজনীয় সামগ্রী'}</strong> আপনাদের আনতে হবে
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {bookingStatus.status === 'rejected' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 p-6 rounded-2xl">
                      <div className="text-center mb-4">
                        <div className="text-4xl mb-3">😔</div>
                        <h3 className="text-xl font-bold text-red-800">দুঃখিত, আপনার বুকিং বাতিল করা হয়েছে</h3>
                        <p className="text-red-600 mt-2">💔 তবে চিন্তা করবেন না, আবার বুকিং করতে পারেন!</p>
                      </div>
                      
                      {bookingStatus.rejectionReason && (
                        <div className="bg-red-100 border-l-4 border-red-400 p-4 rounded">
                          <p className="text-red-700">
                            <strong>🚫 বাতিলের কারণ:</strong> {bookingStatus.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <button
                        onClick={handleNewBooking}
                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg transform hover:-translate-y-1"
                      >
                        🆕 নতুন বুকিং করুন
                      </button>
                      <p className="text-gray-600 text-sm mt-3">🔄 আবার বুকিং করতে উপরের বাটনে ক্লিক করুন</p>
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t text-center">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
                    <p className="text-gray-700 mb-2">
                      📞 যেকোনো সহায়তার জন্য যোগাযোগ করুন: 
                      <a href="tel:+916290187210" className="text-orange-500 font-semibold ml-1 hover:text-orange-600">+91 6290187210</a>
                    </p>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service Selection */}
          {!showStatusSection && !showForm && (
            <div>
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4"> পূজা সেবাসমূহ </h2>
                <div className="w-32 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto rounded-full"></div>
                <p className="text-gray-600 mt-4 text-lg">🙏 সকল পূজা অভিজ্ঞ পুরোহিতদের দ্বারা সম্পন্ন হবে </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {pujaServices.map((service, index) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="group bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-3 transition-all duration-500 cursor-pointer"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both`,
                    }}
                  >
                    <div className="relative bg-gradient-to-br from-orange-500 to-red-500 p-6 text-white">
                      <div className="absolute top-4 right-4 w-3 h-3 bg-white rounded-full opacity-70 animate-pulse"></div>
                      <div className="absolute bottom-4 left-4 w-2 h-2 bg-yellow-300 rounded-full animate-bounce"></div>
                      
                      <h3 className="text-2xl font-bold mb-2">{service.name}</h3>
                      <p className="text-orange-100 leading-relaxed">{service.description}</p>
                      
                      <div className="mt-4 flex items-center">
                        <div className="p-2 bg-white/20 rounded-full mr-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="font-semibold">⏰ {service.duration}</span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">🕐 উপলব্ধ সময়সূচী:</h4>
                          <div className="flex flex-wrap gap-2">
                            {service.time.map((time) => (
                              <span
                                key={time}
                                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                              >
                                {time}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">🌺 পূজা সামগ্রী:</h4>
                          <div className="flex flex-wrap gap-2">
                            {service.items.slice(0, 3).map((item) => (
                              <span
                                key={item}
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                {item}
                              </span>
                            ))}
                            {service.items.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                +{service.items.length - 3} আরো
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button className="mt-6 w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-2xl font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-md transform group-hover:scale-105">
                        {user ? '🎯 এখনই বুকিং করুন' : '📝 সাইন আপ করুন (বিনামূল্যে)'}
                      </button>
                      <p className="text-center text-xs text-gray-500 mt-2">
                        {user ? '✅ সহজ ও দ্রুত প্রক্রিয়া' : '💝 মাত্র ২ মিনিটে সাইন আপ'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional encouraging text */}
              <div className="text-center mt-12">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-3xl p-8 max-w-4xl mx-auto">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">🌟 কেন আমাদের বেছে নেবেন? 🌟</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="group hover:bg-white rounded-2xl p-4 transition-all">
                      <div className="text-3xl mb-2">👨‍🦳</div>
                      <h4 className="font-semibold text-gray-800">অভিজ্ঞ পুরোহিত</h4>
                      <p className="text-gray-600 text-sm">৫০+ বছরের অভিজ্ঞতা</p>
                    </div>
                    <div className="group hover:bg-white rounded-2xl p-4 transition-all">
                      <div className="text-3xl mb-2">🎯</div>
                      <h4 className="font-semibold text-gray-800">সঠিক বিধি-বিধান</h4>
                      <p className="text-gray-600 text-sm">শাস্ত্রীয় নিয়ম অনুসরণ</p>
                    </div>
                    <div className="group hover:bg-white rounded-2xl p-4 transition-all">
                      <div className="text-3xl mb-2">💝</div>
                      <h4 className="font-semibold text-gray-800">সাশ্রয়ী মূল্য</h4>
                      <p className="text-gray-600 text-sm">সবার সামর্থ্যের মধ্যে</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Booking Form */}
          {!showStatusSection && showForm && selectedService && (
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden animate-fadeInUp">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-8 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">📝 {selectedService.name}</h2>
                    <p className="text-purple-100 text-lg">{selectedService.description}</p>
                  </div>
                  <button
                    onClick={handleBackToServices}
                    className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    title="পিছনে যান"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8">
                <div className="text-center mb-6">
                  <p className="text-gray-600">সব তথ্য সঠিকভাবে পূরণ করুন, যাতে আমরা আপনাকে সেরা সেবা দিতে পারি</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="group">
                    <label className="block text-gray-700 font-semibold mb-3">👤 আপনার নাম *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        readOnly
                        className="w-full p-4 border-2 rounded-2xl bg-gray-50 focus:ring-4 focus:ring-orange-300 focus:border-orange-500 transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="আপনার পূর্ণ নাম লিখুন"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">👤 আপনার রেজিস্টার করা নাম</p>
                  </div>
                  
                  <div className="group">
                    <label className="block text-gray-700 font-semibold mb-3">📱 মোবাইল নম্বর *</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        className="w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-orange-300 focus:border-orange-500 transition-all"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="01XXXXXXXXX"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">📞 আপডেটের জন্য প্রয়োজন</p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-3">📧 ইমেইল ঠিকানা *</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      readOnly
                      className="w-full p-4 border-2 rounded-2xl bg-gray-50 focus:ring-4 focus:ring-orange-300 focus:border-orange-500 transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@email.com"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">📨 বুকিং কনফার্মেশন ইমেইলে পাবেন</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-3">📅 পূজার তারিখ *</label>
                    <div className="relative">
                      <input
                        ref={dateInputRef}
                        type="date"
                        required
                        min={getMinDate()}
                        className="w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-orange-300 focus:border-orange-500 transition-all cursor-pointer"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={triggerDatePicker}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 cursor-pointer"
                      >
                        <svg className="w-5 h-5 text-gray-400 hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">📅 কমপক্ষে ১ দিন আগে থেকে বুকিং করুন</p>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-3">🕐 পছন্দের সময় *</label>
                    <div className="relative">
                      <select
                        required
                        className="w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-orange-300 focus:border-orange-500 transition-all appearance-none cursor-pointer"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      >
                        <option value="">⏰ সময় বেছে নিন</option>
                        {selectedService.time.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">⚡ উপলব্ধ সময় বেছে নিন</p>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-gray-700 font-semibold mb-3">💬 বিশেষ নির্দেশনা বা অনুরোধ</label>
                  <div className="relative">
                    <textarea
                      rows={4}
                      className="w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-orange-300 focus:border-orange-500 transition-all resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="কোন বিশেষ প্রয়োজন বা অনুরোধ থাকলে এখানে লিখুন... (যেমন: বিশেষ প্রার্থনা, পারিবারিক অনুষ্ঠান ইত্যাদি)"
                    />
                    <div className="absolute top-4 right-4">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleBackToServices}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-4 rounded-2xl font-bold hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 transition-all duration-300 shadow-md"
                  >
                    ⬅️ পিছনে যান
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-bold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all duration-300 shadow-md transform hover:-translate-y-1"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        অপেক্ষা করুন...
                      </div>
                    ) : (
                      '🎯 বুকিং নিশ্চিত করুন'
                    )}
                  </button>
                </div>

                {/* Service Details Summary */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-4">📋 আপনার নির্বাচিত সেবার বিস্তারিত:</h4>
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-2"><strong>⏰ সময়কাল:</strong> {selectedService.duration}</p>
                        <p className="text-gray-600"><strong>🕐 উপলব্ধ সময়:</strong> {selectedService.time.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-2"><strong>🌺 পূজা সামগ্রী:</strong></p>
                        <p className="text-gray-600">{selectedService.items.join(', ')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reassuring message */}
                <div className="mt-6 text-center">
                  <div className="bg-blue-50 rounded-2xl p-4">
                    <p className="text-blue-600 text-xs mt-1">📱 পূজা বুকিং করার ১২ ঘন্টার মধ্যে বুকিং পেজ + Email/Call এর মাধ্যমে কনফার্মেশন পাবেন</p>
                  </div>
                </div>
              </form>
            </div>
          )}
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
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out;
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
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        /* Custom date input styling */
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: invert(0.6);
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          filter: invert(0.4);
        }
      `}</style>
    </div>
  );
};

export default Booking;