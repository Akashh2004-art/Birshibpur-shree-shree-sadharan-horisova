import React from 'react';
import DashboardStats from '../components/DashboardStats';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto h-screen pb-20" 
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <style>
          {`
            .max-w-7xl::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>

        <h1 className="text-2xl font-semibold text-gray-900 slide-up">
          Dashboard
        </h1>
        
        <div className="mt-8 slide-up" style={{ animationDelay: '0.1s' }}>
          <DashboardStats />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 hover-scale slide-up transform transition-all duration-300 hover:shadow-xl"
               style={{ animationDelay: '0.3s' }}>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((_, index) => (
                <div key={index} 
                     className="flex items-center p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all duration-200">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Pooja is scheduled</p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 hover-scale slide-up transform transition-all duration-300 hover:shadow-xl"
               style={{ animationDelay: '0.4s' }}>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((_, index) => (
                <div key={index} 
                     className="p-4 rounded-lg border-l-4 border-indigo-400 bg-white hover:bg-gray-50 transition-all duration-200">
                  <h3 className="text-sm font-medium text-gray-900">Saraswati Puja</h3>
                  <p className="mt-1 text-sm text-gray-500">February 14, 2024</p>
                  <p className="mt-1 text-sm text-gray-500">Expected fans: 150</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
