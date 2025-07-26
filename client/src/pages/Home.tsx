import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pujaServices } from './Booking';
import { donationTypes } from './Donations';

interface PujaTiming {
  name: string;
  time: string;
  description: string;
}

// Shared Event interface
interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  description: string;
  image: string;
  location: string;
  organizer: string;
  contactNumber: string;
}

// Shared events data
export const events: Event[] = [
  {
    id: 1,
    title: "দুর্গা পূজা ২০২৪",
    date: "2024-10-12",
    time: "6:00 AM",
    description: "বার্ষিক দুর্গা পূজা উৎসব। সকাল ৬টা থেকে রাত ১০টা পর্যন্ত বিভিন্ন অনুষ্ঠান।",
    image: "/assets/image/temple.jpg",
    location: "মন্দির প্রাঙ্গণ",
    organizer: "পূজা কমিটি",
    contactNumber: "+91 1234567890"
  },
  {
    id: 2,
    title: "কালী পূজা ২০২৪",
    date: "2024-11-02",
    time: "7:00 PM",
    description: "বার্ষিক কালী পূজা। সন্ধ্যা ৭টা থেকে রাত ১২টা পর্যন্ত বিশেষ পূজা ও প্রসাদ বিতরণ।",
    image: "/assets/image/temple.jpg",
    location: "মন্দির প্রাঙ্গণ",
    organizer: "পূজা কমিটি",
    contactNumber: "+91 1234567890"
  }
];

const Home = () => {
  const [activeEventIndex, setActiveEventIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveEventIndex((current) => 
        current === events.length - 1 ? 0 : current + 1
      );
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const pujaTimings: PujaTiming[] = [
    {
      name: "Morning Aarti",
      time: "6:00 AM",
      description: "Start your day with divine blessings"
    },
    {
      name: "Afternoon Puja",
      time: "12:00 PM",
      description: "Midday prayers and offerings"
    },
    {
      name: "Evening Aarti",
      time: "6:30 PM",
      description: "Evening devotional ceremony"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[80vh] bg-black">
        <img
          src="/assets/image/temple.jpg"
          alt="Temple"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="relative h-full flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Welcome to Our Temple
          </h1>
          <p className="text-lg md:text-xl text-white mb-8 max-w-2xl">
            A sacred space for spiritual growth and inner peace
          </p>
          <Link
            to="/about"
            className="bg-orange-500 text-white px-8 py-3 rounded-lg text-lg hover:bg-orange-600 transition-colors"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="py-10 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">About Our Temple</h2>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              Founded in 1950, our temple has been a spiritual beacon for over seven decades. 
              We are dedicated to preserving and sharing ancient traditions while fostering 
              a welcoming community for all seekers of spiritual wisdom.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center text-orange-500 hover:text-orange-600 font-semibold"
            >
              <span>Read Our Full History</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Puja Timings */}
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Daily Puja Schedule</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {pujaTimings.map((puja, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition duration-300"
              >
                <h3 className="text-lg md:text-xl font-semibold mb-2">{puja.name}</h3>
                <p className="text-xl md:text-2xl text-orange-500 font-bold mb-2">{puja.time}</p>
                <p className="text-sm md:text-base text-gray-600">{puja.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-10 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">আসন্ন অনুষ্ঠান</h2>
          <p className="text-sm md:text-base text-center text-gray-600 mb-8">
            আমাদের মন্দিরে আগামী দিনগুলিতে অনুষ্ঠিত হতে যাওয়া বিভিন্ন অনুষ্ঠানের তালিকা
          </p>

          <div className="relative overflow-hidden">
            <div className="flex transition-transform duration-500 ease-in-out"
                 style={{ transform: `translateX(-${activeEventIndex * 100}%)` }}>
              {events.map((event) => (
                <div
                  key={event.id}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow max-w-2xl mx-auto">
                    <div className="relative h-48">
                      <img 
                        src={event.image} 
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 md:p-6">
                      <h3 className="text-lg md:text-xl font-bold mb-2">{event.title}</h3>
                      <p className="text-sm md:text-base text-gray-600 mb-4">{event.description}</p>
                      <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          {new Date(event.date).toLocaleDateString('bn-BD')}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          {event.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">পূজা সেবা</h2>
          <p className="text-sm md:text-base text-center text-gray-600 mb-8">
            আমাদের মন্দিরে নিয়মিত পূজা অর্চনার জন্য আপনার পছন্দের সময় বুকিং করুন
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {pujaServices.slice(0, 3).map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg md:text-xl font-bold mb-3">{service.name}</h3>
                <p className="text-sm md:text-base text-gray-600 mb-4">{service.description}</p>
                <p className="text-sm text-gray-500 mb-4">⏱️ সময়কালঃ {service.duration}</p>
                <Link
                  to="/booking"
                  className="inline-block w-full text-center bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  বুকিং করুন
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donations Section */}
      <section className="py-10 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">দান-অনুদান</h2>
          <p className="text-sm md:text-base text-center text-gray-600 mb-8">
            মন্দিরের উন্নয়ন ও সেবা কার্যক্রমে আপনার অবদান রাখুন
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {donationTypes.slice(0, 3).map((type) => (
              <div
                key={type.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48">
                  <img
                    src={type.image}
                    alt={type.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold mb-2">{type.name}</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">{type.description}</p>
                  <Link
                    to="/donations"
                    className="inline-block w-full text-center bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    দান করুন
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;