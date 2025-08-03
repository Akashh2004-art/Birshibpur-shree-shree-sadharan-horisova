import { useState, useEffect } from 'react';
import { getEventsForHome, getPastEvents } from '../utils/api'; // ✅ ADDED: getPastEvents

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
  // ✅ NEW: Separate state for past events
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [pastLoading, setPastLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events for home (only আসন্ন and অনুষ্ঠান চলছে)
  useEffect(() => {
    window.scrollTo(0, 0); // 🔼 scroll to top

    const fetchActiveEvents = async () => {
      try {
        setLoading(true);
        const response = await getEventsForHome();
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

    // ✅ NEW: Fetch past events separately
    const fetchPastEvents = async () => {
      try {
        setPastLoading(true);
        const response = await getPastEvents();
        if (response.success) {
          // Add status to past events
          const eventsWithStatus = response.data.map((event: Event) => ({
            ...event,
            status: 'সম্পন্ন'
          }));
          setPastEvents(eventsWithStatus);
        }
      } catch (err) {
        console.error('Past events fetch error:', err);
      } finally {
        setPastLoading(false);
      }
    };

    fetchActiveEvents();
    fetchPastEvents();
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
        return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white';
      case 'অনুষ্ঠান চলছে':
        return 'bg-gradient-to-r from-green-500 to-teal-500 text-white';
      case 'সম্পন্ন':
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-16">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
        <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-orange-300 opacity-75"></div>
      </div>
      <span className="ml-4 text-gray-600 text-lg font-medium">ইভেন্ট লোড করা হচ্ছে...</span>
    </div>
  );

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
              মন্দিরের অনুষ্ঠানসমূহ
            </h1>
            <div className="w-24 h-1 bg-white mx-auto mb-6 rounded-full"></div>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed animate-fadeInUp animation-delay-300">
              আমাদের মন্দিরে অনুষ্ঠিত সকল পবিত্র ধর্মীয় অনুষ্ঠান ও উৎসবের সম্পূর্ণ তালিকা
            </p>
            
            {/* Decorative elements */}
            <div className="flex justify-center mt-8 space-x-4">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-100"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-200"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Content */}
      <div className="container mx-auto px-4 py-16">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-16">
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-8 py-6 rounded-2xl max-w-md mx-auto shadow-lg">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium">{error}</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-700 px-8 py-6 rounded-2xl max-w-md mx-auto shadow-lg">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium">কোনো সক্রিয় ইভেন্ট পাওয়া যায়নি</p>
            </div>
          </div>
        ) : (
          <>
            {/* Current & Upcoming Events Section */}
            <div className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">বর্তমান ও আসন্ন অনুষ্ঠানসমূহ</h2>
                <div className="w-32 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto rounded-full"></div>
                <p className="text-gray-600 mt-4 text-lg">আমাদের আসন্ন পবিত্র অনুষ্ঠানসমূহ</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event, index) => (
                  <div 
                    key={event._id} 
                    className="group bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-3 transition-all duration-500"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both`,
                    }}
                  >
                    <div className="relative overflow-hidden">
                      <img 
                        src={event.imageUrl} 
                        alt={event.title}
                        className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/assets/image/temple.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="absolute top-6 right-6">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${getStatusColor(event.status || '')}`}>
                          {event.status}
                        </span>
                      </div>
                      
                      {/* Floating decorative element */}
                      <div className="absolute top-6 left-6 w-3 h-3 bg-white rounded-full opacity-70 animate-pulse"></div>
                    </div>
                    
                    <div className="p-8">
                      <h3 className="text-2xl font-bold text-gray-800 mb-4 line-clamp-2 group-hover:text-orange-600 transition-colors duration-300">
                        {event.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                        {event.description}
                      </p>
                      
                      {/* Enhanced Info Icons */}
                      <div className="space-y-4">
                        <div className="flex items-center group/item hover:bg-orange-50 p-3 rounded-xl transition-all duration-300">
                          <div className="p-2 bg-orange-100 rounded-full mr-4 group-hover/item:bg-orange-200 transition-colors duration-300">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">শুরুর তারিখ</p>
                            <p className="text-gray-800 font-semibold">{formatDate(event.startDate)}</p>
                          </div>
                        </div>
                        
                        {event.startDate !== event.endDate && (
                          <div className="flex items-center group/item hover:bg-red-50 p-3 rounded-xl transition-all duration-300">
                            <div className="p-2 bg-red-100 rounded-full mr-4 group-hover/item:bg-red-200 transition-colors duration-300">
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 font-medium">শেষের তারিখ</p>
                              <p className="text-gray-800 font-semibold">{formatDate(event.endDate)}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center group/item hover:bg-blue-50 p-3 rounded-xl transition-all duration-300">
                          <div className="p-2 bg-blue-100 rounded-full mr-4 group-hover/item:bg-blue-200 transition-colors duration-300">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">স্থান</p>
                            <p className="text-gray-800 font-semibold">মন্দির প্রাঙ্গণ</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center group/item hover:bg-green-50 p-3 rounded-xl transition-all duration-300">
                          <div className="p-2 bg-green-100 rounded-full mr-4 group-hover/item:bg-green-200 transition-colors duration-300">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">আয়োজক</p>
                            <p className="text-gray-800 font-semibold">পূজা কমিটি</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center group/item hover:bg-purple-50 p-3 rounded-xl transition-all duration-300">
                          <div className="p-2 bg-purple-100 rounded-full mr-4 group-hover/item:bg-purple-200 transition-colors duration-300">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium">যোগাযোগ</p>
                            <a 
                              href="tel:+911234567890"
                              className="text-purple-600 hover:text-purple-800 transition-colors duration-300 font-semibold"
                            >
                              +91 1234567890
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ Event History Section: Using Past Events from Backend */}
            <div className="mt-20">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">ইতিহাসের অনুষ্ঠানসমূহ</h2>
                <div className="w-32 h-1 bg-gradient-to-r from-gray-400 to-gray-600 mx-auto rounded-full"></div>
                <p className="text-gray-600 mt-4 text-lg">আমাদের সম্পন্ন হওয়া পবিত্র অনুষ্ঠানসমূহ</p>
              </div>
              
              {pastLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-gray-500"></div>
                    <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-gray-300 opacity-50"></div>
                  </div>
                  <span className="ml-3 text-gray-600 font-medium">ইতিহাস লোড করা হচ্ছে...</span>
                </div>
              ) : pastEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-50 border-2 border-gray-200 text-gray-600 px-8 py-6 rounded-2xl max-w-md mx-auto shadow-sm">
                    <div className="flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium">কোনো পূর্ববর্তী অনুষ্ঠান পাওয়া যায়নি</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {pastEvents.map((event, index) => (
                    <div 
                      key={event._id} 
                      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-gray-200"
                      style={{
                        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                      }}
                    >
                      <div className="relative overflow-hidden">
                        <img 
                          src={event.imageUrl} 
                          alt={event.title} 
                          className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/assets/image/temple.jpg";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1 bg-gray-600 text-white text-xs rounded-full font-semibold shadow-lg">
                            সম্পন্ন
                          </span>
                        </div>
                        
                        <div className="absolute top-3 left-3 w-2 h-2 bg-white rounded-full opacity-60 animate-pulse"></div>
                      </div>
                      
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-gray-600 transition-colors duration-300">
                          {event.title}
                        </h3>
                        
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            <span className="font-medium">শুরু:</span>
                            <span className="ml-1">{formatDate(event.startDate)}</span>
                          </div>
                          
                          {event.startDate !== event.endDate && (
                            <div className="flex items-center text-xs text-gray-500">
                              <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                              <span className="font-medium">শেষ:</span>
                              <span className="ml-1">{formatDate(event.endDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
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
      `}</style>
    </div>
  );
};

export default Events;