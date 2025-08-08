import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export interface PujaService {
  id: number;
  name: string;
  description: string;
  duration: string;
  time: string[];
  items: string[];
}

// Updated puja services data (removed maxPeople)
export const pujaServices: PujaService[] = [
  {
    id: 1,
    name: "নিত্য পূজা",
    description: "প্রতিদিনের নিয়মিত পূজা অর্চনা",
    duration: "৩০ মিনিট",
    time: ["সকাল ৮:০০", "সকাল ১০:০০", "বিকাল ৪:০০"],
    items: ["ফুল", "বেলপাতা", "চন্দন", "ধূপ", "দীপ"]
  },
  {
    id: 2,
    name: "বিশেষ অর্চনা",
    description: "বিশেষ পূজা অর্চনা ও প্রসাদ বিতরণ",
    duration: "১ ঘণ্টা",
    time: ["সকাল ৯:০০", "দুপুর ১২:০০", "সন্ধ্যা ৬:০০"],
    items: ["ফুল", "বেলপাতা", "চন্দন", "ধূপ", "দীপ", "মিষ্টি", "ফল"]
  },
  {
    id: 3,
    name: "সত্যনারায়ণ পূজা",
    description: "পূর্ণ সত্যনারায়ণ পূজা ও কথা পাঠ",
    duration: "২ ঘণ্টা",
    time: ["সকাল ১০:০০", "বিকাল ৪:০০"],
    items: ["ফুল", "বেলপাতা", "চন্দন", "ধূপ", "দীপ", "নৈবেদ্য", "ফল", "মিষ্টি"]
  }
];

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  serviceId: number;
  date: string;
  time: string;
  message: string;
}

const Booking = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selectedService, setSelectedService] = useState<PujaService | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BookingForm>({
    name: '',
    email: '',
    phone: '',
    serviceId: 0,
    date: '',
    time: '',
    message: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user && showForm) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user, showForm]);

  useEffect(() => {
    if (user) {
      const storedServiceId = sessionStorage.getItem('selectedServiceId');
      if (storedServiceId) {
        const serviceId = parseInt(storedServiceId);
        const service = pujaServices.find(s => s.id === serviceId);
        if (service) {
          setSelectedService(service);
          setFormData(prev => ({ ...prev, serviceId: service.id }));
          setShowForm(true);
        }
        sessionStorage.removeItem('selectedServiceId');
      }
    }
  }, [user]);

  const handleServiceSelect = (service: PujaService) => {
    if (!user && !loading) {
      sessionStorage.setItem('selectedServiceId', service.id.toString());
      navigate('/signup', { 
        state: { 
          message: 'পূজা বুকিং করতে প্রথমে সাইন আপ করুন',
          returnTo: '/booking'
        }
      });
      return;
    }

    if (user) {
      setSelectedService(service);
      setFormData(prev => ({ ...prev, serviceId: service.id }));
      setShowForm(true);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!selectedService) {
      setError('অনুগ্রহ করে একটি পূজা সেবা নির্বাচন করুন');
      setIsSubmitting(false);
      return;
    }

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setError('আজকের তারিখ বা আগের তারিখ নির্বাচন করা যাবে না। আগামীকাল থেকে বুকিং করা যাবে।');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.post('/bookings/create', formData);

      if (response.success) {
        setShowForm(false);
        setSelectedService(null);
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          serviceId: 0,
          date: '',
          time: '',
          message: ''
        });
      } else {
        setError(response.message || 'বুকিং করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'বুকিং করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToServices = () => {
    setShowForm(false);
    setSelectedService(null);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      serviceId: 0,
      date: '',
      time: '',
      message: ''
    });
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative bg-orange-500 text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              পূজা বুকিং
            </h1>
            <p className="text-xl text-center max-w-2xl mx-auto">
              {showForm ? 'বুকিং ফর্ম পূরণ করুন' : 'আপনার পছন্দের পূজা সেবা নির্বাচন করুন'}
            </p>
            {!user && (
              <p className="text-center mt-4 text-orange-100">
                পূজা বুকিং করতে প্রথমে সাইন আপ করুন
              </p>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Services Selection - Always visible, but form is conditional */}
            {!showForm && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {pujaServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="p-6 rounded-lg cursor-pointer transition-all duration-300 bg-white hover:bg-orange-50 hover:scale-105 shadow-md border"
                  >
                    <h3 className="text-xl font-bold mb-3 text-gray-800">{service.name}</h3>
                    <p className="mb-4 text-gray-600">{service.description}</p>
                    <div className="space-y-2 text-gray-700">
                      <p>⏱️ সময়কালঃ {service.duration}</p>
                      <div>
                        <p className="font-semibold mb-1">উপকরণঃ</p>
                        <p className="text-sm">{service.items.join(', ')}</p>
                      </div>
                      <div className="pt-2">
                        <p className="font-semibold mb-1">সময়সূচীঃ</p>
                        <p className="text-sm">{service.time.join(', ')}</p>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <span className="inline-block bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                        {user ? 'বুকিং করুন' : 'সাইন আপ করে বুকিং করুন'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Booking Form - Only visible when showForm is true */}
            {showForm && selectedService && (
              <div className="max-w-2xl mx-auto">
                {/* Selected Service Summary */}
                <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-orange-800 mb-2">নির্বাচিত সেবা</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-orange-700 font-semibold">{selectedService.name}</p>
                      <p className="text-sm text-orange-600">{selectedService.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleBackToServices}
                    className="mt-2 text-orange-600 hover:text-orange-800 text-sm underline"
                  >
                    অন্য সেবা নির্বাচন করুন
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="name">
                        নাম *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        readOnly
                        className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="phone">
                        ফোন নম্বর *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2" htmlFor="email">
                      ইমেইল *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      readOnly
                      className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="date">
                        তারিখ * (আগামীকাল থেকে)
                      </label>
                      <input
                        type="date"
                        id="date"
                        required
                        min={getMinDate()}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="time">
                        সময় *
                      </label>
                      <select
                        id="time"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      >
                        <option value="">সময় নির্বাচন করুন</option>
                        {selectedService.time.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2" htmlFor="message">
                      বিশেষ নির্দেশনা (যদি থাকে)
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="কোন বিশেষ প্রয়োজন বা নির্দেশনা থাকলে লিখুন..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleBackToServices}
                      disabled={isSubmitting}
                      className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors duration-300 disabled:opacity-50"
                    >
                      পিছনে যান
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors duration-300 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          বুকিং করা হচ্ছে...
                        </>
                      ) : (
                        'বুকিং নিশ্চিত করুন'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Booking;