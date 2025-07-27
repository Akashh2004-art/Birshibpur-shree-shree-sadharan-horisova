import { useState, useEffect } from 'react';
import { getEventsForHome } from '../utils/api'; // ✅ CHANGED: getAllEvents -> getEventsForHome

// Event interface to match backend
interface Event {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  status?: string; // ✅ ADDED: status field
  createdAt: string;
  updatedAt: string;
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events for home (only আসন্ন and অনুষ্ঠান চলছে)
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await getEventsForHome(); // ✅ CHANGED: Use getEventsForHome instead
        if (response.success) {
          setEvents(response.data);
        } else {
          setError('ইভেন্ট লোড করতে সমস্যা হয়েছে');
        }
      } catch (err) {
        console.error('Events fetch error:', err);
        setError('ইভেন্ট লোড করতে সমস্যা হয়েছে');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };


  // ✅ SIMPLIFIED: Use status from backend instead of calculating again
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'আসন্ন':
        return 'bg-blue-100 text-blue-800';
      case 'অনুষ্ঠান চলছে':
        return 'bg-green-100 text-green-800';
      case 'সম্পন্ন':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-orange-500 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            মন্দিরের অনুষ্ঠানসমূহ
          </h1>
          <p className="text-xl text-center max-w-2xl mx-auto">
            আমাদের মন্দিরে অনুষ্ঠিত সকল ধর্মীয় অনুষ্ঠানের তালিকা
          </p>
        </div>
      </div>

      {/* Events Content */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">ইভেন্ট লোড করা হচ্ছে...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
              <p>{error}</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md mx-auto">
              <p>কোনো সক্রিয় ইভেন্ট পাওয়া যায়নি</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => {
              return (
                <div 
                  key={event._id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="relative">
                    <img 
                      src={event.imageUrl} 
                      alt={event.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/assets/image/temple.jpg"; // Fallback image
                      }}
                    />
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status || '')}`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">{event.title}</h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>

                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          <strong>শুরু:</strong> {formatDate(event.startDate)}
                        </span>
                      </div>
                      
                      {event.startDate !== event.endDate && (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            <strong>শেষ:</strong> {formatDate(event.endDate)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>মন্দির প্রাঙ্গণ</span>
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>পূজা কমিটি</span>
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a 
                          href="tel:+911234567890"
                          className="text-orange-500 hover:text-orange-600 transition-colors duration-300"
                        >
                          +91 1234567890
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;