import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await axios.get('/dashboard/stats');

        if (response.data.success) {
          setStats([
            { 
              title: 'Total Users', 
              value: response.data.stats.totalUsers.count.toLocaleString(), 
              isLoading: false
            },
            { 
              title: 'Events', 
              value: response.data.stats.activeEvents.count.toString(), 
              isLoading: false
            },
            { 
              title: 'Total Bookings', 
              value: response.data.stats.totalBookings.count.toLocaleString(), 
              isLoading: false
            },
            { 
              title: 'Total Donations', 
              value: `${response.data.stats.totalDonations.amount.toLocaleString()}`, 
              isLoading: false
            }
          ]);
        }
      } catch (error) {
        console.error('ড্যাশবোর্ড স্ট্যাট লোড করতে সমস্যা হয়েছে:', error);
        setStats(stats.map(stat => ({ ...stat, isLoading: false })));
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;
