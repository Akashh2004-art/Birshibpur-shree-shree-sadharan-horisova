import { useState } from 'react';

interface Image {
  id: number;
  src: string;
  alt: string;
  category: 'temple' | 'events' | 'festivals' | 'daily';
  description: string;
}

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'temple' | 'events' | 'festivals' | 'daily'>('all');
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  const images: Image[] = [
    {
      id: 1,
      src: "/assets/image/temple.jpg",
      alt: "মন্দিরের প্রধান প্রবেশদ্বার",
      category: "temple",
      description: "মন্দিরের প্রধান প্রবেশদ্বার এবং সামনের দৃশ্য"
    },
    {
      id: 2,
      src: "/assets/image/temple.jpg",
      alt: "দুর্গা পূজা ২০২৩",
      category: "festivals",
      description: "গত বছরের দুর্গা পূজার আয়োজন"
    },
    {
      id: 3,
      src: "/assets/image/temple.jpg",
      alt: "সাপ্তাহিক আরতি",
      category: "daily",
      description: "প্রতি সন্ধ্যায় আরতির একটি মুহূর্ত"
    },
    {
      id: 4,
      src: "/assets/image/temple.jpg",
      alt: "সাংস্কৃতিক অনুষ্ঠান",
      category: "events",
      description: "বার্ষিক সাংস্কৃতিক অনুষ্ঠানের একটি দৃশ্য"
    },
    {
      id: 5,
      src: "/assets/image/temple.jpg",
      alt: "কালী পূজা ২০২৩",
      category: "festivals",
      description: "গত বছরের কালী পূজার আয়োজন"
    },
    {
      id: 6,
      src: "/assets/image/temple.jpg",
      alt: "মন্দিরের অভ্যন্তর",
      category: "temple",
      description: "মন্দিরের অভ্যন্তরীণ সজ্জা"
    }
  ];

  const categories = [
    { id: 'all', name: 'সকল ছবি' },
    { id: 'temple', name: 'মন্দির' },
    { id: 'events', name: 'অনুষ্ঠান' },
    { id: 'festivals', name: 'উৎসব' },
    { id: 'daily', name: 'দৈনন্দিন' }
  ];

  const filteredImages = selectedCategory === 'all' 
    ? images 
    : images.filter(img => img.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-orange-500 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            গ্যালারি
          </h1>
          <p className="text-xl text-center max-w-2xl mx-auto">
            মন্দিরের বিভিন্ন অনুষ্ঠান ও উৎসবের স্মৃতিচিত্র
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`px-6 py-2 rounded-full transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-orange-100'
              } shadow-md`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className="group relative cursor-pointer"
            >
              <div className="aspect-w-4 aspect-h-3 overflow-hidden rounded-lg">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center">
                  <p className="text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4">
                    {image.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-orange-500 transition-colors duration-300"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="w-full h-auto rounded-lg"
            />
            <div className="mt-4 text-white">
              <h3 className="text-xl font-bold">{selectedImage.alt}</h3>
              <p className="mt-2">{selectedImage.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery; 