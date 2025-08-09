import React, { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import adminSocketService from '../services/socketService';

interface Booking {
  _id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  serviceName: string;
  date: string;
  time: string;
  people?: number;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  amount?: number;
  createdAt: string;
  rejectionReason?: string;
}

interface Stats {
  _id: string;
  count: number;
  totalAmount?: number;
}

interface ConnectionStats {
  totalConnections: number;
  adminConnections: number;
  userConnections: number;
  timestamp: string;
}

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [stats, setStats] = useState<Stats[]>([]);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [realtimeUpdates, setRealtimeUpdates] = useState(0); // Counter for real-time updates
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // ✅ SOCKET CONNECTION AND EVENT HANDLERS
  useEffect(() => {
    // Initialize socket connection
    adminSocketService.connect();
    setSocketConnected(adminSocketService.isConnected());

    // Listen for connection status changes
    const socket = adminSocketService.getSocket();
    if (socket) {
      socket.on('connect', () => {
        console.log('✅ Admin socket connected');
        setSocketConnected(true);
        setError(''); // Clear connection errors
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Admin socket disconnected:', reason);
        setSocketConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setSocketConnected(false);
        setError('Real-time connection failed. Data may not be up to date.');
      });

      // Listen for admin room join confirmation
      socket.on('admin-room-joined', (data) => {
        console.log('👨‍💼 Joined admin room:', data);
        if (data.connectionStats) {
          setConnectionStats(data.connectionStats);
        }
      });
    }

    // ✅ REAL-TIME EVENT LISTENERS
    // Listen for new bookings
    adminSocketService.onNewBooking((data) => {
      console.log('🆕 New booking received:', data);
      setRealtimeUpdates(prev => prev + 1);
      
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`নতুন পূজা বুকিং - ${data.serviceName}`, {
          body: `${data.userName} একটি নতুন বুকিং করেছেন`,
          icon: '/favicon.ico'
        });
      }

      // Refresh bookings to get the latest data
      fetchBookings(pagination.current, selectedStatus, searchTerm);
    });

    // Listen for booking status updates
    adminSocketService.onBookingStatusUpdate((data) => {
      console.log('📝 Booking status updated:', data);
      setRealtimeUpdates(prev => prev + 1);
      
      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === data.bookingId 
            ? { ...booking, status: data.status }
            : booking
        )
      );
    });

    // Listen for booking deletions
    adminSocketService.onBookingDeleted((data) => {
      console.log('🗑️ Booking deleted:', data);
      setRealtimeUpdates(prev => prev + 1);
      
      // Remove from local state
      setBookings(prevBookings => 
        prevBookings.filter(booking => booking._id !== data.bookingId)
      );
    });

    // Listen for connection stats updates
    adminSocketService.onConnectionStats((data) => {
      setConnectionStats(data);
    });

    // Cleanup on unmount
    return () => {
      adminSocketService.offNewBooking();
      adminSocketService.offBookingStatusUpdate();
      adminSocketService.offBookingDeleted();
      adminSocketService.offConnectionStats();
      adminSocketService.disconnect();
    };
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ✅ FIXED: Use consistent token key
  const fetchBookings = async (page = 1, status = 'all', search = '') => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      // ✅ FIXED: Use 'token' instead of 'adminToken'
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(status !== 'all' && { status }),
        ...(search && { search })
      });

      // ✅ FIXED: Better API URL construction
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const url = `${apiUrl}/api/bookings/admin/all?${queryParams}`;
      
      console.log('📡 Fetching bookings from:', url); // Debug log

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status); // Debug log

      // ✅ FIXED: Better error handling for 401
      if (response.status === 401) {
        localStorage.removeItem('token');
        setError('Session expired. Please login again.');
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response received:', text);
        throw new Error('Server returned non-JSON response. Please check server status.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Received data:', data); // Debug log
      
      if (data.success) {
        setBookings(data.data || []);
        setStats(data.stats || []);
        setPagination(data.pagination || { current: 1, pages: 1, total: 0 });
        setError(''); // Clear any existing errors
      } else {
        setError(data.message || 'Failed to fetch bookings');
      }
    } catch (err: any) {
      console.error('❌ Error fetching bookings:', err);
      setError(err.message || 'Network error occurred while fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Use consistent token key
  const updateBookingStatus = async (bookingId: string, status: 'approved' | 'rejected', reason = '') => {
    try {
      setError('');
      // ✅ FIXED: Use 'token' instead of 'adminToken'
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const url = `${apiUrl}/api/bookings/admin/${bookingId}/status`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          status,
          ...(status === 'rejected' && reason && { rejectionReason: reason })
        })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        setError('Session expired. Please login again.');
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      
      if (data.success) {
        // ✅ NO NEED TO REFRESH - Socket will handle the update
        setShowModal(false);
        setRejectionReason('');
        setSelectedBooking(null);
        
        // Show success notification
        if ('Notification' in window && Notification.permission === 'granted') {
          const statusText = status === 'approved' ? 'অনুমোদিত' : 'বাতিল';
          new Notification(`বুকিং ${statusText}`, {
            body: `${selectedBooking?.userName} এর বুকিং ${statusText} করা হয়েছে`,
            icon: '/favicon.ico'
          });
        }
      } else {
        setError(data.message || 'Failed to update booking status');
      }
    } catch (err: any) {
      console.error('❌ Error updating booking status:', err);
      setError(err.message || 'Failed to update booking status');
    }
  };

  // ✅ FIXED: Use consistent token key
  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      setError('');
      // ✅ FIXED: Use 'token' instead of 'adminToken'
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const url = `${apiUrl}/api/bookings/admin/${bookingId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        setError('Session expired. Please login again.');
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      
      if (data.success) {
        // ✅ NO NEED TO REFRESH - Socket will handle the update
        // Show success notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('বুকিং মুছে ফেলা হয়েছে', {
            body: 'বুকিং সফলভাবে মুছে ফেলা হয়েছে',
            icon: '/favicon.ico'
          });
        }
      } else {
        setError(data.message || 'Failed to delete booking');
      }
    } catch (err: any) {
      console.error('❌ Error deleting booking:', err);
      setError(err.message || 'Failed to delete booking');
    }
  };

  // Initial load
  useEffect(() => {
    fetchBookings();
  }, []);

  // Handle filter changes
  useEffect(() => {
    fetchBookings(1, selectedStatus, searchTerm);
  }, [selectedStatus, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusBangla = (status: string) => {
    switch (status) {
      case 'approved':
        return 'অনুমোদিত';
      case 'rejected':
        return 'বাতিল';
      default:
        return 'অপেক্ষমান';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD');
  };

  const handleReject = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleApprove = (booking: Booking) => {
    updateBookingStatus(booking._id, 'approved');
  };

  const confirmReject = () => {
    if (selectedBooking) {
      updateBookingStatus(selectedBooking._id, 'rejected', rejectionReason);
    }
  };

  const getStatsForStatus = (status: string) => {
    const stat = stats.find(s => s._id === status);
    return stat ? stat.count : 0;
  };

  const getTotalRevenue = () => {
    return stats
      .filter(s => s._id === 'approved')
      .reduce((total, stat) => total + (stat.totalAmount || 0), 0);
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="mt-10 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-6 p-4 md:p-6">
      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">পূজা বুকিং ম্যানেজমেন্ট</h1>
          <div className="flex gap-4 mt-2 text-sm text-gray-600">
            <span>মোট: {getStatsForStatus('pending') + getStatsForStatus('approved') + getStatsForStatus('rejected')}</span>
            <span>অপেক্ষমান: {getStatsForStatus('pending')}</span>
            <span>অনুমোদিত: {getStatsForStatus('approved')}</span>
            <span>বাতিল: {getStatsForStatus('rejected')}</span>
            <span>আয়: ₹{getTotalRevenue()}</span>
          </div>
        </div>

        {/* ✅ SOCKET CONNECTION STATUS */}
        <div className="flex flex-col items-end gap-2 mt-4 sm:mt-0">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
            socketConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${
              socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></span>
            {socketConnected ? 'রিয়েল-টাইম সংযুক্ত' : 'সংযোগ বিচ্ছিন্ন'}
          </div>

          {/* Connection Stats */}
          {connectionStats && (
            <div className="text-xs text-gray-500 text-right">
              <div>মোট: {connectionStats.totalConnections} | অ্যাডমিন: {connectionStats.adminConnections} | ইউজার: {connectionStats.userConnections}</div>
            </div>
          )}

          {/* Real-time Updates Counter */}
          {realtimeUpdates > 0 && (
            <div className="text-xs text-blue-600">
              রিয়েল-টাইম আপডেট: {realtimeUpdates}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="গ্রাহকের নাম, ইমেইল বা পূজার নাম খুঁজুন..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="pending">অপেক্ষমান</option>
              <option value="approved">অনুমোদিত</option>
              <option value="rejected">বাতিল</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          {error.includes('non-JSON') && (
            <div className="mt-2 text-sm">
              <p>Possible solutions:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Check if server is running on correct port</li>
                <li>Verify API_URL environment variable</li>
                <li>Check server logs for errors</li>
                <li>Ensure booking routes are registered in server</li>
              </ul>
            </div>
          )}
          {error.includes('Authentication') && (
            <div className="mt-2">
              <button 
                onClick={() => window.location.href = '/login'}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">গ্রাহক</th>
                <th className="px-4 py-3 text-left">পূজার নাম</th>
                <th className="px-4 py-3 text-left">তারিখ</th>
                <th className="px-4 py-3 text-left">সময়</th>
                <th className="px-4 py-3 text-left">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'লোড হচ্ছে...' : 'কোন বুকিং পাওয়া যায়নি'}
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id} className="text-sm sm:text-base hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{booking.userName}</div>
                        <div className="text-gray-500 text-xs">{booking.userEmail}</div>
                        <div className="text-gray-500 text-xs">{booking.userPhone}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{booking.serviceName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(booking.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{booking.time}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {getStatusBangla(booking.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end gap-2">
                        {/* View Details */}
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            // You can implement a view details modal here
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>

                        {/* Approve/Reject buttons for pending bookings */}
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(booking)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleReject(booking)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={() => deleteBooking(booking._id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center">
          <div className="flex gap-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => fetchBookings(page, selectedStatus, searchTerm)}
                className={`px-3 py-2 rounded ${
                  page === pagination.current
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">বুকিং বাতিল করুন</h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedBooking?.userName} এর বুকিং বাতিল করছেন। কারণ উল্লেখ করুন:
            </p>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="বাতিলের কারণ লিখুন..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setRejectionReason('');
                  setSelectedBooking(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                বাতিল
              </button>
              <button
                onClick={confirmReject}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;