import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface PujaService {
  id: number;
  name: string;
  description: string;
  duration: string;
  time: string[];
  maxPeople: number;
  items: string[];
}

// Shared puja services data
export const pujaServices: PujaService[] = [
  {
    id: 1,
    name: "নিত্য পূজা",
    description: "প্রতিদিনের নিয়মিত পূজা অর্চনা",
    duration: "৩০ মিনিট",
    time: ["সকাল ৮:০০", "সকাল ১০:০০", "বিকাল ৪:০০"],
    maxPeople: 20,
    items: ["ফুল", "বেলপাতা", "চন্দন", "ধূপ", "দীপ"]
  },
  {
    id: 2,
    name: "বিশেষ অর্চনা",
    description: "বিশেষ পূজা অর্চনা ও প্রসাদ বিতরণ",
    duration: "১ ঘণ্টা",
    time: ["সকাল ৯:০০", "দুপুর ১২:০০", "সন্ধ্যা ৬:০০"],
    maxPeople: 30,
    items: ["ফুল", "বেলপাতা", "চন্দন", "ধূপ", "দীপ", "মিষ্টি", "ফল"]
  },
  {
    id: 3,
    name: "সত্যনারায়ণ পূজা",
    description: "পূর্ণ সত্যনারায়ণ পূজা ও কথা পাঠ",
    duration: "২ ঘণ্টা",
    time: ["সকাল ১০:০০", "বিকাল ৪:০০"],
    maxPeople: 50,
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
  people: number;
  message: string;
}

const Booking = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<PujaService | null>(null);
  const [formData, setFormData] = useState<BookingForm>({
    name: '',
    email: '',
    phone: '',
    serviceId: 0,
    date: '',
    time: '',
    people: 1,
    message: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleServiceSelect = (service: PujaService) => {
    setSelectedService(service);
    setFormData(prev => ({ ...prev, serviceId: service.id }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedService) {
      setError('অনুগ্রহ করে একটি পূজা সেবা নির্বাচন করুন');
      return;
    }

    if (formData.people > selectedService.maxPeople) {
      setError(`সর্বোচ্চ ${selectedService.maxPeople} জন অংশগ্রহণ করতে পারবেন`);
      return;
    }

    try {
      // Here you would typically make an API call to save the booking
      // For now, we'll just show success message
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setError('বুকিং করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-orange-500 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            পূজা বুকিং
          </h1>
          <p className="text-xl text-center max-w-2xl mx-auto">
            আপনার পছন্দের পূজা সেবা নির্বাচন করুন
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {success ? (
          <div className="max-w-2xl mx-auto bg-green-100 text-green-700 p-6 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">বুকিং সফল হয়েছে!</h2>
            <p>আপনার বুকিং নিশ্চিত করা হয়েছে। শীঘ্রই আমরা যোগাযোগ করব।</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Services Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {pujaServices.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className={`p-6 rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedService?.id === service.id
                      ? 'bg-orange-500 text-white shadow-lg scale-105'
                      : 'bg-white hover:bg-orange-50'
                  }`}
                >
                  <h3 className="text-xl font-bold mb-3">{service.name}</h3>
                  <p className={`mb-4 ${selectedService?.id === service.id ? 'text-white' : 'text-gray-600'}`}>
                    {service.description}
                  </p>
                  <div className="space-y-2">
                    <p>⏱️ সময়কালঃ {service.duration}</p>
                    <p>👥 সর্বোচ্চঃ {service.maxPeople} জন</p>
                    <div>
                      <p className="font-semibold mb-1">উপকরণঃ</p>
                      <p className="text-sm">{service.items.join(', ')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Booking Form */}
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="name">
                    নাম
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="phone">
                    ফোন নম্বর
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="date">
                    তারিখ
                  </label>
                  <input
                    type="date"
                    id="date"
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="time">
                    সময়
                  </label>
                  <select
                    id="time"
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  >
                    <option value="">সময় নির্বাচন করুন</option>
                    {selectedService?.time.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="people">
                  অংশগ্রহণকারীর সংখ্যা
                </label>
                <input
                  type="number"
                  id="people"
                  required
                  min="1"
                  max={selectedService?.maxPeople || 1}
                  className="w-full px-4 py-2 border rounded-lg"
                  value={formData.people}
                  onChange={(e) => setFormData({ ...formData, people: parseInt(e.target.value) })}
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="message">
                  বিশেষ নির্দেশনা (যদি থাকে)
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors duration-300"
              >
                বুকিং নিশ্চিত করুন
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking; 