import { useEffect, useState } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import AddOrEditEventForm from '../components/AddOrEditEventForm';
import axios from '../api/axios';

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  imageUrl: string;
  imagePublicId: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error';
}

// ✅ FIXED: End date ke 11:59:59 PM porjonto consider kora holo
const getEventStatus = (startDateStr: string, endDateStr: string): string => {
  const now = new Date();
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  // End date ke 11:59:59 PM porjonto extend kora
  const endOfDay = new Date(end);
  endOfDay.setHours(23, 59, 59, 999);

  if (now < start) {
    return 'আসন্ন';
  } else if (now >= start && now <= endOfDay) {
    return 'অনুষ্ঠান চলছে';
  } else {
    return 'সম্পন্ন';
  }
};

const EventManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; publicId: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Add notification function
  const addNotification = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

  // Remove notification manually
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/events');
        const data = res.data.data || [];

        const mappedEvents = data.map((event: any) => ({
          id: event._id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          description: event.description,
          imageUrl: event.imageUrl,
          imagePublicId: event.imagePublicId,
        }));

        setEvents(mappedEvents);
      } catch (error) {
        console.error('❌ Failed to load events:', error);
        addNotification('ইভেন্ট লোড করতে সমস্যা হয়েছে', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const confirmDeleteEvent = (id: string, imagePublicId: string) => {
    setConfirmDelete({ id, publicId: imagePublicId });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await axios.delete(`/events/${confirmDelete.id}`, {
        data: { publicId: confirmDelete.publicId },
      });
      setEvents(prev => prev.filter(event => event.id !== confirmDelete.id));
      setConfirmDelete(null);
      addNotification('ইভেন্ট সফলভাবে মুছে ফেলা হয়েছে', 'success');
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
      addNotification('ইভেন্ট মুছতে সমস্যা হয়েছে', 'error');
    }
  };

  const handleAdd = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleSave = (data: any) => {
    if (editingEvent) {
      setEvents(prev =>
        prev.map(event =>
          event.id === editingEvent.id
            ? {
                ...event,
                ...data,
                startDate: data.startDate,
                endDate: data.endDate,
                imageUrl: data.imageUrl || event.imageUrl,
                imagePublicId: data.imagePublicId || event.imagePublicId,
              }
            : event
        )
      );
      addNotification('ইভেন্ট সফলভাবে আপডেট হয়েছে', 'success');
    } else {
      const newEvent = {
        id: data._id,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
      };
      setEvents(prev => [...prev, newEvent]);
      addNotification('নতুন ইভেন্ট সফলভাবে তৈরি হয়েছে', 'success');
    }
  };

  // ✅ Separate active and past events
  const activeEvents = events.filter(event => {
    const status = getEventStatus(event.startDate, event.endDate);
    return status === 'আসন্ন' || status === 'অনুষ্ঠান চলছে';
  });

  const pastEvents = events.filter(event => {
    const status = getEventStatus(event.startDate, event.endDate);
    return status === 'সম্পন্ন';
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">ইভেন্ট লোড করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 mr-3 text-green-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 mr-3 text-red-500" />
            )}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">উৎসব ব্যবস্থাপনা</h1>
              <p className="text-gray-600">মন্দিরের সকল অনুষ্ঠান পরিচালনা করুন</p>
            </div>
            <button
              onClick={handleAdd}
              className="mt-4 md:mt-0 flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              নতুন উৎসব যোগ করুন
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                {editingEvent ? 'উৎসব সম্পাদনা করুন' : 'নতুন উৎসব যোগ করুন'}
              </h3>
              <AddOrEditEventForm
                event={editingEvent || undefined}
                onClose={() => setShowForm(false)}
                onSave={handleSave}
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4">
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <TrashIcon className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">উৎসব মুছে ফেলুন</h3>
                <p className="text-gray-600">আপনি কি নিশ্চিত যে এই উৎসবটি মুছে ফেলতে চান?</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  মুছে ফেলুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Events */}
        <div className="mb-12">
          <div className="flex items-center mb-8">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 w-1 h-8 rounded-full mr-4"></div>
            <h2 className="text-3xl font-bold text-gray-800">বর্তমান ও আসন্ন অনুষ্ঠানসমূহ</h2>
            <span className="ml-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {activeEvents.length}টি
            </span>
          </div>

          {activeEvents.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">কোনো সক্রিয় অনুষ্ঠান পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeEvents.map((event, index) => {
                const status = getEventStatus(event.startDate, event.endDate);
                
                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                    }}
                  >
                    <div className="relative group overflow-hidden">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute top-4 right-4">
                        <span
                          className={`px-3 py-2 text-sm font-bold rounded-full backdrop-blur-sm ${
                            status === 'আসন্ন'
                              ? 'bg-yellow-500/90 text-white'
                              : status === 'অনুষ্ঠান চলছে'
                              ? 'bg-green-500/90 text-white'
                              : 'bg-gray-500/90 text-white'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{event.title}</h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm">{formatDate(event.startDate)}</span>
                        </div>
                        {event.startDate !== event.endDate && (
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm">{formatDate(event.endDate)}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-6 line-clamp-3">{event.description}</p>

                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200"
                          title="সম্পাদনা করুন"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => confirmDeleteEvent(event.id, event.imagePublicId)}
                          className="p-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200"
                          title="মুছে ফেলুন"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <div className="flex items-center mb-8">
              <div className="bg-gradient-to-r from-gray-500 to-gray-700 w-1 h-8 rounded-full mr-4"></div>
              <h2 className="text-3xl font-bold text-gray-800">ইতিহাসের অনুষ্ঠানসমূহ</h2>
              <span className="ml-4 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                {pastEvents.length}টি
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pastEvents.map((event) => (
                <div 
                  key={event.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  <div className="relative">
                    <img 
                      src={event.imageUrl} 
                      alt={event.title} 
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full font-medium">
                        সম্পন্ন
                      </span>
                    </div>
                    <div className="absolute top-3 left-3">
                      <button
                        onClick={() => confirmDeleteEvent(event.id, event.imagePublicId)}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200 shadow-lg"
                        title="এই অনুষ্ঠান মুছুন"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="text-base font-bold text-gray-800 mb-2 line-clamp-2">
                      {event.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>
                        <span className="font-medium">শুরু:</span> {formatDate(event.startDate)}
                      </p>
                      {event.startDate !== event.endDate && (
                        <p>
                          <span className="font-medium">শেষ:</span> {formatDate(event.endDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default EventManagement;