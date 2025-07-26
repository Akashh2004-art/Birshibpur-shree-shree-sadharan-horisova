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

const getEventStatus = (startDateStr: string, endDateStr: string): string => {
  const now = new Date();
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (now < start) {
    return 'আসন্ন';
  } else if (now >= start && now <= new Date(end.getTime() + 86399999)) {
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

  return (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event, index) => {
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
    </div>
  );
};

export default EventManagement;
