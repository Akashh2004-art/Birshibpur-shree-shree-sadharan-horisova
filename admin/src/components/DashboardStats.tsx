import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';

interface StatCardProps {
  title: string;
  value: string | number;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, isLoading }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 flex flex-col items-center text-center">
      <h3 className="text-xs sm:text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-center space-x-2">
        {isLoading ? (
          <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
        ) : (
          <p className="text-xl sm:text-2xl font-semibold text-gray-900">{value}</p>
        )}
      </div>
    </div>
  );
};

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState([
    { title: 'Total Users', value: '0', isLoading: true },
    { title: 'Events', value: '0', isLoading: true },
    { title: 'Total Bookings', value: '0', isLoading: true },
    { title: 'Total Donations', value: '0', isLoading: true }
  ]);

  // Auto-refresh setup (same as BookingManagement)
  const [, setIsAutoRefreshActive] = useState(false);
  const autoRefreshIntervalRef = useRef<number | null>(null);

  // ✅ ENHANCED FETCH FUNCTION WITH BOOKING COUNT SYNC
  const fetchDashboardStats = async (silent = false) => {
    try {
      if (!silent) {
        setStats(prev => prev.map(s => ({ ...s, isLoading: true })));
      }

      // ১) Dashboard stats (users, donations)
      const dashRes = await axios.get('/dashboard/stats');
      
      // ২) Event count
      const eventRes = await axios.get('/events/count');
      
      // ✅ ৩) REAL-TIME BOOKING COUNT (same API as BookingManagement)
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const bookingResponse = await fetch(`${apiUrl}/api/bookings/admin/all?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      let totalBookings = 0;
      if (bookingResponse.ok) {
        const bookingData = await bookingResponse.json();
        if (bookingData.success && bookingData.pagination) {
          totalBookings = bookingData.pagination.total || 0;
        }
      }

      // Update all stats
      if (dashRes.data.success && eventRes.data.success) {
        setStats([
          { 
            title: 'Total Users', 
            value: dashRes.data.stats.totalUsers?.count?.toLocaleString() || '0', 
            isLoading: false
          },
          { 
            title: 'Events', 
            value: eventRes.data.count?.toLocaleString() || '0', 
            isLoading: false
          },
          { 
            title: 'Total Bookings', 
            value: totalBookings.toLocaleString(), // ✅ Real-time booking count
            isLoading: false
          },
          { 
            title: 'Total Donations', 
            value: dashRes.data.stats.totalDonations?.amount?.toLocaleString() || '0', 
            isLoading: false
          }
        ]);

        if (silent) {
          console.log('🔄 Dashboard stats refreshed silently at:', new Date().toLocaleTimeString());
        }
      } else {
        setStats(prev => prev.map(s => ({ ...s, isLoading: false })));
      }
    } catch (error) {
      console.error('Dashboard stats fetch error:', error);
      if (!silent) {
        setStats(prev => prev.map(s => ({ ...s, isLoading: false })));
      }
    }
  };

  // ✅ AUTO-REFRESH FUNCTIONS (same interval as BookingManagement)
  const startAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) return;
    
    console.log('🚀 Starting dashboard auto-refresh (20s interval)');
    setIsAutoRefreshActive(true);
    
    autoRefreshIntervalRef.current = window.setInterval(() => {
      fetchDashboardStats(true); // Silent refresh
    }, 20000); // Same 20 second interval as BookingManagement
  };

  const stopAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) {
      console.log('⏹️ Stopping dashboard auto-refresh');
      window.clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
      setIsAutoRefreshActive(false);
    }
  };

  // ✅ EFFECTS
  useEffect(() => {
    // Initial load
    fetchDashboardStats();
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Cleanup on unmount
    return () => {
      stopAutoRefresh();
    };
  }, []);



  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;