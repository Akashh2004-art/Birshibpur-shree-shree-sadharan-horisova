import { useState, useEffect } from 'react';
import { getAllGallery } from '../utils/api';

interface GalleryItem {
  _id: string;
  url: string;
  title: string;
  category: string;
  type: 'image' | 'video';
  fileSize: number;
  filename: string;
  mimetype: string;
  cloudinaryId: string;
  uploadDate: string;
  uploadedBy?: {
    name: string;
    email: string;
  };
}

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'মন্দির' | 'অনুষ্ঠান' | 'ঠাকুর' | 'দৈনন্দিন'>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'সকল ছবি' },
    { id: 'মন্দির', name: 'মন্দির' },
    { id: 'অনুষ্ঠান', name: 'অনুষ্ঠান' },
    { id: 'ঠাকুর', name: 'ঠাকুর'  },
    { id: 'দৈনন্দিন', name: 'দৈনন্দিন'  }
  ];

  // Fetch gallery data from API
  useEffect(() => {
    window.scrollTo(0, 0); // 🔼 scroll to top

    const fetchGalleryData = async () => {
      try {
        setLoading(true);
        const data = await getAllGallery();
        setGalleryItems(data);
        setError(null);
      } catch (err) {
        console.error('গ্যালারি ডাটা লোড করতে ত্রুটি:', err);
        setError('গ্যালারি ডাটা লোড করতে ত্রুটি হয়েছে');
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryData();
  }, []);

  const filteredItems = selectedCategory === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-lg p-12 rounded-3xl shadow-2xl">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-orange-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">গ্যালারি লোড হচ্ছে...</h3>
          <p className="text-gray-500">অনুগ্রহ করে অপেক্ষা করুন</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-lg p-12 rounded-3xl shadow-2xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">❌</span>
          </div>
          <h3 className="text-xl font-bold text-red-600 mb-4">{error}</h3>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Hero Section with Animation */}
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
              গ্যালারি
            </h1>
            <div className="w-24 h-1 bg-white mx-auto mb-6 rounded-full"></div>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed animate-fadeInUp animation-delay-300">
              মন্দিরের বিভিন্ন অনুষ্ঠান ও উৎসবের স্মৃতিচিত্র
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

      {/* Category Filter */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`group relative px-8 py-4 rounded-2xl transition-all duration-500 font-semibold text-lg overflow-hidden ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-2xl scale-110'
                  : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-xl hover:scale-105 border border-orange-200'
              }`}
            >
              <div className="flex items-center gap-3 relative z-10">
                <span>{category.name}</span>
              </div>
              {selectedCategory === category.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 animate-pulse"></div>
              )}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-16 shadow-2xl border border-orange-200">
              <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-5xl">🖼️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-600 mb-4">এই ক্যাটাগরিতে কোন আইটেম নেই</h3>
              <p className="text-gray-500 text-lg">শীঘ্রই নতুন মিডিয়া যোগ করা হবে</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                onClick={() => setSelectedItem(item)}
                className="group relative cursor-pointer bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 border border-orange-200/50"
              >
                <div className="relative overflow-hidden">
                  {item.type === 'video' ? (
                    <div className="relative">
                      <video
                        src={item.url}
                        className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-110"
                        muted
                        onMouseEnter={(e) => {
                          e.currentTarget.play();
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                      {/* Video Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 group-hover:from-black/40 transition-all duration-300"></div>
                      
                      {/* Video Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-6 transform group-hover:scale-110 transition-all duration-300 shadow-2xl">
                          <svg className="w-10 h-10 text-orange-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      {/* Video Badge */}
                      <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        ভিডিও
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      {/* Image Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      
                      {/* Image Badge */}
                      <div className="absolute top-4 left-4 bg-blue-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        ছবি
                      </div>
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute bottom-4 left-4 bg-orange-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
                    {item.category}
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <div className="text-white text-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 px-6">
                      <h3 className="font-bold text-lg mb-2 drop-shadow-lg">{item.title}</h3>
                      <p className="text-sm bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                        ক্লিক করে দেখুন
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 text-lg group-hover:text-orange-600 transition-colors duration-300">{item.title}</h3>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold">
                      {item.category}
                    </span>
                    <span className="font-medium">{formatDate(item.uploadDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedItem(null)}
        >
          <div className="relative max-w-6xl w-full animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute -top-16 right-0 text-white hover:text-orange-400 transition-colors duration-300 z-20 bg-white/10 backdrop-blur-sm rounded-full p-3 hover:bg-white/20"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Media Content */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20">
              {selectedItem.type === 'video' ? (
                <video
                  src={selectedItem.url}
                  controls
                  className="w-full h-auto rounded-2xl max-h-[70vh] shadow-2xl"
                  autoPlay
                >
                  আপনার ব্রাউজার ভিডিও প্লেব্যাক সাপোর্ট করে না।
                </video>
              ) : (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="w-full h-auto rounded-2xl max-h-[70vh] object-contain shadow-2xl"
                />
              )}
              
              {/* Media Info */}
              <div className="mt-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">{selectedItem.title}</h3>
                    <div className="flex flex-wrap gap-3 items-center">
                      <span className="bg-orange-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                        {selectedItem.type === 'video' ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        )}
                        {selectedItem.category}
                      </span>
                      <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-semibold">
                        {formatDate(selectedItem.uploadDate)}
                      </span>
                    </div>
                  </div>
                </div>
                {selectedItem.uploadedBy && (
                  <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold">আপলোড করেছেন:</span> {selectedItem.uploadedBy.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

export default Gallery;