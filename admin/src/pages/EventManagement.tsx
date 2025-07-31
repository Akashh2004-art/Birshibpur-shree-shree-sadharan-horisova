import { useEffect, useState } from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
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

  useEffect(() => {
    const fetchEvents = async () => {
      try {
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
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
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

  return (
    <div className="min-h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 p-6">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">উৎসব ব্যবস্থাপনা</h2>
          <button
            onClick={handleAdd}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            নতুন উৎসব যোগ করুন
          </button>
        </div>

        {showForm && (
          <div className="mb-6 bg-gray-50 p-4 rounded shadow">
            <AddOrEditEventForm
              event={editingEvent || undefined}
              onClose={() => setShowForm(false)}
              onSave={handleSave}
            />
          </div>
        )}

        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white rounded shadow-lg p-6 text-center w-80">
              <p className="mb-4 text-gray-800">আপনি কি এই উৎসবটি মুছতে চান?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >না</button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >হ্যাঁ</button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Active Events Section */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">বর্তমান ও আসন্ন অনুষ্ঠানসমূহ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEvents.map((event, index) => {
              const startDate = new Date(event.startDate);
              const endDate = new Date(event.endDate);
              const status = getEventStatus(event.startDate, event.endDate);

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transform transition-all duration-300 hover:scale-102 hover:shadow-xl slide-up"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    opacity: 0,
                    animation: `fadeIn 0.5s ease-out ${index * 0.1}s forwards`,
                  }}
                >
                  <div className="relative group">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          status === 'আসন্ন'
                            ? 'bg-yellow-100 text-yellow-800'
                            : status === 'অনুষ্ঠান চলছে'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {startDate.toLocaleDateString('bn-BD', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })} - {endDate.toLocaleDateString('bn-BD', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="mt-2 text-sm text-gray-600 flex-grow">{event.description}</p>

                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 text-indigo-600 hover:text-indigo-900 transition-colors duration-200 hover:bg-indigo-50 rounded-full"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => confirmDeleteEvent(event.id, event.imagePublicId)}
                        className="p-2 text-red-600 hover:text-red-900 transition-colors duration-200 hover:bg-red-50 rounded-full"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {activeEvents.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">কোনো সক্রিয় অনুষ্ঠান পাওয়া যায়নি</p>
            </div>
          )}
        </div>

        {/* ✅ Event History Section */}
        {pastEvents.length > 0 && (
          <div className="mb-8">
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ইতিহাসের অনুষ্ঠানসমূহ ({pastEvents.length}টি)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {pastEvents.map((event) => (
                  <div 
                    key={event.id}
                    className="bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200"
                  >
                    <div className="relative">
                      <img 
                        src={event.imageUrl} 
                        alt={event.title} 
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                          সম্পন্ন
                        </span>
                      </div>
                      {/* ✅ Delete button for past events */}
                      <div className="absolute top-2 left-2">
                        <button
                          onClick={() => confirmDeleteEvent(event.id, event.imagePublicId)}
                          className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200 shadow-sm"
                          title="এই অনুষ্ঠান মুছুন"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">
                        {event.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        <p className="mb-1">
                          <strong>শুরু:</strong> {formatDate(event.startDate)}
                        </p>
                        {event.startDate !== event.endDate && (
                          <p>
                            <strong>শেষ:</strong> {formatDate(event.endDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventManagement;