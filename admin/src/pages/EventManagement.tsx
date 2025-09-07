import { useEffect, useState } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import AddOrEditEventForm from '../components/AddOrEditEventForm';
import axios from '../api/axios';

interface Event {
  [x: string]: string;
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

const getEventStatus = (startDateStr: string, endDateStr: string): string => {
  const now = new Date();
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  const endOfDay = new Date(end);
  endOfDay.setHours(23, 59, 59, 999);

  if (now < start) {
    return 'Upcoming';
  } else if (now >= start && now <= endOfDay) {
    return 'Ongoing';
  } else {
    return 'Completed';
  }
};

const EventManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; publicId: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const addNotification = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

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
        addNotification('Failed to load events', 'error');
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
      addNotification('Event deleted successfully', 'success');
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
      addNotification('Failed to delete event', 'error');
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
      addNotification('Event updated successfully', 'success');
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
      addNotification('New event created successfully', 'success');
    }
  };

  const activeEvents = events.filter(event => {
    const status = getEventStatus(event.startDate, event.endDate);
    return status === 'Upcoming' || status === 'Ongoing';
  });

  const pastEvents = events.filter(event => {
    const status = getEventStatus(event.startDate, event.endDate);
    return status === 'Completed';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center p-3 rounded-lg border ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
            ) : (
              <XCircleIcon className="h-5 w-5 mr-2 text-red-600" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-3 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">Event Management</h1>
              <p className="text-gray-600">Manage all temple events and festivals</p>
            </div>
            <button
              onClick={handleAdd}
              className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New Event
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
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
            <div className="bg-white rounded-lg p-6 text-center max-w-md mx-4">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Event</h3>
                <p className="text-gray-600">Are you sure you want to delete this event?</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Events */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Current & Upcoming Events</h2>
            <span className="ml-3 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              {activeEvents.length} events
            </span>
          </div>

          {activeEvents.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500">No active events found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeEvents.map((event) => {
                const status = getEventStatus(event.startDate, event.endDate);
                
                return (
                  <div
                    key={event.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
                  >
                    <div className="relative">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-70 object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            status === 'Upcoming'
                              ? 'bg-yellow-100 text-yellow-800'
                              : status === 'Ongoing'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{event.title}</h3>
                      
                      <div className="space-y-1 mb-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                        {event.startDate !== event.endDate && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(event.endDate)}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{event.description}</p>

                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => confirmDeleteEvent(event.id, event.imagePublicId)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
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
    <div className="flex items-center mb-4">
      <h2 className="text-xl font-semibold text-gray-900">History events</h2>
      <span className="ml-3 bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
        {pastEvents.length} events
      </span>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pastEvents.map((event, index) => (
        <div 
          key={event._id || event.id || `past-event-${index}`}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
        >
          <div className="relative">
            <img 
              src={event.imageUrl} 
              alt={event.title} 
              className="w-full h-40 object-cover"
            />
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded font-medium">
                Completed
              </span>
            </div>
            <div className="absolute top-2 left-2">
              <button
                onClick={() => confirmDeleteEvent(event.id || event._id, event.imagePublicId)}
                className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                title="Delete this event"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
          
          <div className="p-3">
            <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
              {event.title}
            </h4>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {event.description}
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <span className="font-medium">Start:</span> {formatDate(event.startDate)}
              </p>
              {event.startDate !== event.endDate && (
                <p key={`end-date-${event._id || event.id || index}`}>
                  <span className="font-medium">End:</span> {formatDate(event.endDate)}
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