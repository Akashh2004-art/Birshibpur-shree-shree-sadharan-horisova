import React, { useState, useEffect, useRef } from 'react';
import { CheckIcon, XMarkIcon, TrashIcon, EyeIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';

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

const BookingManagement: React.FC = () => {
  // Core state variables
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [stats, setStats] = useState<Stats[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // AUTO-REFRESH STATE
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState(false);
  const autoRefreshIntervalRef = useRef<number | null>(null);

  // ACTION LOADING STATES
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // SUCCESS MESSAGE STATE
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ENHANCED API FUNCTION WITH SILENT MODE
  const fetchBookings = async (page = 1, status = 'all', search = '', silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError('');
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(status !== 'all' && { status }),
        ...(search && { search })
      });

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const url = `${apiUrl}/api/bookings/admin/all?${queryParams}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        setError('Session expired. Please log in again.');
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server. Please check server status.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setBookings(data.data || []);
        setStats(data.stats || []);
        setPagination(data.pagination || { current: 1, pages: 1, total: 0 });
        setError('');
        
        if (!silent) {
          setMessage({ type: 'success', text: 'Data loaded successfully!' });
          setTimeout(() => setMessage(null), 3000);
        }
      } else {
        if (!silent) setError(data.message || 'Failed to load bookings');
      }
    } catch (err: any) {
      if (!silent) {
        setError(err.message || 'Network error occurred. Please try again.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // AUTO-REFRESH MANAGEMENT
  const startAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) return;
    
    setIsAutoRefreshActive(true);
    
    autoRefreshIntervalRef.current = window.setInterval(() => {
      fetchBookings(pagination.current, selectedStatus, searchTerm, true);
    }, 20000);
  };

  const stopAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) {
      window.clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
      setIsAutoRefreshActive(false);
    }
  };

  // STATUS UPDATE FUNCTION WITH LOADING STATES
  const updateBookingStatus = async (bookingId: string, status: 'approved' | 'rejected', reason = '') => {
    try {
      setError('');
      
      // Set loading state for specific action
      if (status === 'approved') {
        setApprovingId(bookingId);
      } else {
        setRejectingId(bookingId);
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
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
        setError('Session expired. Please log in again.');
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server');
      }

      const data = await response.json();
      
      if (data.success) {
        // Immediate refresh after status update
        await fetchBookings(pagination.current, selectedStatus, searchTerm, false);
        
        setShowModal(false);
        setRejectionReason('');
        setSelectedBooking(null);
        
        const statusText = status === 'approved' ? 'approved' : 'rejected';
        setMessage({ type: 'success', text: `Booking successfully ${statusText}!` });
        setTimeout(() => setMessage(null), 4000);
      } else {
        setError(data.message || 'Failed to update booking status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update booking status');
    } finally {
      setApprovingId(null);
      setRejectingId(null);
    }
  };

  // DELETE FUNCTION WITH LOADING STATE
  const deleteBooking = async (bookingId: string) => {
    try {
      setError('');
      setDeletingId(bookingId);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
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
        setError('Session expired. Please log in again.');
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server');
      }

      const data = await response.json();
      
      if (data.success) {
        // Immediate refresh after deletion
        await fetchBookings(pagination.current, selectedStatus, searchTerm, false);
        
        setMessage({ type: 'success', text: 'Booking deleted successfully!' });
        setTimeout(() => setMessage(null), 4000);
      } else {
        setError(data.message || 'Failed to delete booking');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete booking');
    } finally {
      setDeletingId(null);
    }
  };

  // EFFECTS
  useEffect(() => {
    fetchBookings();
    startAutoRefresh();
    
    return () => {
      stopAutoRefresh();
    };
  }, []);

  useEffect(() => {
    fetchBookings(1, selectedStatus, searchTerm);
    
    stopAutoRefresh();
    startAutoRefresh();
  }, [selectedStatus, searchTerm]);

  useEffect(() => {
    return () => {
      stopAutoRefresh();
    };
  }, []);

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-50 text-red-800 border-red-300';
      default:
        return 'bg-orange-50 text-orange-800 border-orange-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  const handleReject = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleApprove = (booking: Booking) => {
    updateBookingStatus(booking._id, 'approved');
  };

  const handleDeleteClick = (booking: Booking) => {
    setBookingToDelete(booking);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (bookingToDelete) {
      deleteBooking(bookingToDelete._id);
      setShowDeleteModal(false);
      setBookingToDelete(null);
    }
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

  // Loading state
  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Management</h1>
          <p className="text-gray-600">Manage all customer bookings</p>
          
          {/* STATS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-gray-900">{getStatsForStatus('pending') + getStatsForStatus('approved') + getStatsForStatus('rejected')}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{getStatsForStatus('pending')}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
              <div className="text-2xl font-bold text-green-600">{getStatsForStatus('approved')}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200">
              <div className="text-2xl font-bold text-red-600">{getStatsForStatus('rejected')}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
          </div>

          {/* AUTO-REFRESH INDICATOR */}
          <div className="mt-4 flex justify-center items-center gap-4">
            {isAutoRefreshActive && (
              <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700">Auto-refresh active</span>
              </div>
            )}
          </div>
        </div>

        {/* FILTERS SECTION */}
        <div className="bg-white rounded-lg p-4 shadow-sm border mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by customer name, email or service..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[160px]"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* SUCCESS/ERROR MESSAGE */}
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
            {error.includes('Invalid response from server') && (
              <div className="mt-4 text-sm bg-red-100 rounded-lg p-3">
                <p className="font-medium mb-2">Solution steps:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check if server is running on correct port</li>
                  <li>Verify API_URL environment variable</li>
                  <li>Check server logs</li>
                  <li>Ensure booking routes are registered on server</li>
                </ul>
              </div>
            )}
            {error.includes('log in') && (
              <div className="mt-2">
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS TABLE */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="text-gray-600">Loading bookings...</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings found</h3>
                          <p className="text-gray-500">New bookings will appear here</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">{booking.userName}</div>
                            <div className="text-gray-500 text-sm">{booking.userEmail}</div>
                            <div className="text-gray-500 text-sm">{booking.userPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{booking.serviceName}</div>
                        {booking.message && (
                          <div className="text-sm text-gray-500 mt-1 truncate max-w-32" title={booking.message}>
                            {booking.message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{formatDate(booking.date)}</td>
                      <td className="px-6 py-4 text-gray-900">{booking.time}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                        {booking.status === 'rejected' && booking.rejectionReason && (
                          <div className="text-xs text-red-600 mt-1 truncate max-w-32" title={booking.rejectionReason}>
                            {booking.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          {/* View Details */}
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>

                          {/* Approve/Reject buttons for pending bookings */}
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(booking)}
                                disabled={approvingId === booking._id}
                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                                title="Approve"
                              >
                                {approvingId === booking._id ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <CheckIcon className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(booking)}
                                disabled={rejectingId === booking._id}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                title="Reject"
                              >
                                {rejectingId === booking._id ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <XMarkIcon className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          )}

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteClick(booking)}
                            disabled={deletingId === booking._id}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === booking._id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
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

        {/* PAGINATION */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchBookings(page, selectedStatus, searchTerm)}
                  className={`px-3 py-2 text-sm font-medium rounded ${
                    page === pagination.current
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BOOKING DETAILS MODAL */}
        {selectedBooking && !showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Booking Details</h3>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Customer Name</label>
                    <p className="text-gray-900">{selectedBooking.userName}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                    <p className="text-gray-900">{selectedBooking.userEmail}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
                    <p className="text-gray-900">{selectedBooking.userPhone}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Service Name</label>
                    <p className="text-gray-900">{selectedBooking.serviceName}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
                    <p className="text-gray-900">{formatDate(selectedBooking.date)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Time</label>
                    <p className="text-gray-900">{selectedBooking.time}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedBooking.status)}`}>
                      {getStatusText(selectedBooking.status)}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Booking ID</label>
                    <p className="text-gray-900 text-xs font-mono">{selectedBooking._id}</p>
                  </div>
                </div>
                
                {selectedBooking.status === 'rejected' && selectedBooking.rejectionReason && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <label className="text-sm font-medium text-red-700 mb-2 block">Rejection Reason</label>
                    <p className="text-red-800">{selectedBooking.rejectionReason}</p>
                  </div>
                )}

                {/* Action buttons in modal */}
                {selectedBooking.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowModal(true)}
                      disabled={rejectingId === selectedBooking._id}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {rejectingId === selectedBooking._id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Rejecting...
                        </>
                      ) : (
                        'Reject'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        handleApprove(selectedBooking);
                        setSelectedBooking(null);
                      }}
                      disabled={approvingId === selectedBooking._id}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {approvingId === selectedBooking._id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Approving...
                        </>
                      ) : (
                        'Approve'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REJECTION MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <XMarkIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Booking</h3>
                <p className="text-gray-600">
                  Rejecting booking for <span className="font-medium text-red-600">{selectedBooking?.userName}</span>
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason:</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                  rows={3}
                  placeholder="Please provide a reason for rejecting this booking..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setRejectionReason('');
                    setSelectedBooking(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={rejectingId === selectedBooking?._id}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {rejectingId === selectedBooking?._id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrashIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Booking</h3>
                <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700">Warning: This action cannot be undone!</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setBookingToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletingId === bookingToDelete?._id}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deletingId === bookingToDelete?._id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookingManagement;