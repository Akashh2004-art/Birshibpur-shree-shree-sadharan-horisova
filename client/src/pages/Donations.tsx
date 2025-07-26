import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface DonationType {
  id: number;
  name: string;
  description: string;
  image: string;
  category: 'temple' | 'seva' | 'festival';
}

// Shared donation types data
export const donationTypes: DonationType[] = [
  {
    id: 1,
    name: "মন্দির রক্ষণাবেক্ষণ",
    description: "মন্দিরের নিত্য রক্ষণাবেক্ষণ ও পরিচ্ছন্নতার জন্য দান",
    image: "/assets/image/temple.jpg",
    category: 'temple'
  },
  {
    id: 2,
    name: "অন্নদান সেবা",
    description: "প্রতিদিন ভক্তদের মধ্যে প্রসাদ বিতরণের জন্য দান",
    image: "/assets/image/temple.jpg",
    category: 'seva'
  },
  {
    id: 3,
    name: "দুর্গা পূজা তহবিল",
    description: "আগামী দুর্গা পূজার আয়োজনের জন্য দান",
    image: "/assets/image/temple.jpg",
    category: 'festival'
  }
];

interface DonationForm {
  name: string;
  email: string;
  phone: string;
  amount: number;
  typeId: number;
  message?: string;
}

const Donations = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<DonationType | null>(null);
  const [formData, setFormData] = useState<DonationForm>({
    name: '',
    email: '',
    phone: '',
    amount: 0,
    typeId: 0
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedType) {
      setError('অনুগ্রহ করে একটি দান খাত নির্বাচন করুন');
      return;
    }

    try {
      // Here you would typically make an API call to process the donation
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setError('দান প্রক্রিয়া সম্পন্ন করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-orange-500 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            দান-অনুদান
          </h1>
          <p className="text-xl text-center max-w-2xl mx-auto">
            মন্দিরের উন্নয়ন ও সেবা কার্যক্রমে আপনার অবদান রাখুন
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {success ? (
          <div className="max-w-2xl mx-auto bg-green-100 text-green-700 p-6 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">ধন্যবাদ!</h2>
            <p>আপনার দান সফলভাবে গৃহীত হয়েছে।</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Donation Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {donationTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type);
                    setFormData(prev => ({ ...prev, typeId: type.id }));
                  }}
                  className={`relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedType?.id === type.id
                      ? 'ring-2 ring-orange-500 transform scale-105'
                      : 'hover:shadow-lg'
                  }`}
                >
                  <img
                    src={type.image}
                    alt={type.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6 bg-white">
                    <h3 className="text-xl font-bold mb-2">{type.name}</h3>
                    <p className="text-gray-600">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Donation Form */}
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  দানের পরিমাণ
                </label>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    placeholder="আপনার ইচ্ছামত পরিমাণ লিখুন"
                    className="flex-1 px-4 py-2 border rounded-lg"
                  />
                  <span className="text-2xl text-gray-600 flex items-center">₹</span>
                </div>
              </div>

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

              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  ইমেইল (ঐচ্ছিক)
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="message">
                  বার্তা (ঐচ্ছিক)
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="আপনার কোন বিশেষ অনুরোধ থাকলে লিখুন"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors duration-300"
              >
                দান করুন
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Donations; 