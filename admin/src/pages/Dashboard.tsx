import React, { useEffect, useState } from 'react';
import DashboardStats from '../components/DashboardStats';
import axios from '../api/axios';

interface Event {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
}

const Dashboard: React.FC = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);

  // ✅ FIXED: Status calculate function with proper end date handling
  const getEventStatus = (startDate: string, endDate: string): string => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // End date ke 11:59:59 PM porjonto extend kora
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);

    if (now < start) return 'আসন্ন';
    if (now >= start && now <= endOfDay) return 'অনুষ্ঠান চলছে';
    return 'সম্পন্ন';
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [upcomingRes, pastRes] = await Promise.all([
          axios.get('/events/upcoming'),
          axios.get('/events/history'),
        ]);
        setUpcomingEvents(upcomingRes.data.data || []);
        setPastEvents(pastRes.data.data || []);
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 60000); // fetch every 60 sec
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto h-screen pb-20">
        <style>
          {`
            .max-w-7xl::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>

        <h1 className="text-2xl font-semibold text-gray-900 slide-up">Dashboard</h1>

        <div className="mt-8 slide-up" style={{ animationDelay: '0.1s' }}>
          <DashboardStats />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* ✅ Event History */}
          <div
            className="bg-white rounded-lg shadow-lg p-6 hover-scale slide-up transform transition-all duration-300 hover:shadow-xl"
            style={{ animationDelay: '0.3s' }}
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">Event History</h2>
            <div
              className="space-y-4 overflow-y-auto"
              style={{ maxHeight: '260px', paddingRight: '4px' }}
            >
              {pastEvents.length === 0 ? (
                <p className="text-gray-500 text-sm">No past events found.</p>
              ) : (
                pastEvents.map(event => (
                  <div
                    key={event._id}
                    className="flex items-center p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="flex-shrink-0">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="h-12 w-12 rounded-full object-cover border border-gray-200"
                      />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.startDate).toLocaleDateString()} -{' '}
                        {new Date(event.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ✅ Upcoming Events */}
          <div
            className="bg-white rounded-lg shadow-lg p-6 hover-scale slide-up transform transition-all duration-300 hover:shadow-xl"
            style={{ animationDelay: '0.4s' }}
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h2>
            <div
              className="space-y-4 overflow-y-auto"
              style={{ maxHeight: '260px', paddingRight: '4px' }}
            >
              {upcomingEvents.length === 0 ? (
                <p className="text-gray-500 text-sm">No upcoming events found.</p>
              ) : (
                upcomingEvents.map(event => {
                  const status = getEventStatus(event.startDate, event.endDate);
                  return (
                    <div
                      key={event._id}
                      className="flex items-center p-4 rounded-lg border-l-4 border-indigo-400 bg-white hover:bg-gray-50 transition-all duration-200"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="h-12 w-12 rounded-full object-cover border border-gray-200"
                        />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(event.startDate).toLocaleDateString()} -{' '}
                          {new Date(event.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-semibold text-indigo-600">{status}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;