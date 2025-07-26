import React, { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

interface Image {
  id: string;
  url: string;
  title: string;
  uploadDate: string;
}

const GalleryManagement: React.FC = () => {
  const [images, setImages] = useState<Image[]>([
    {
      id: '1',
      url: 'https://source.unsplash.com/random/800x600/?temple,1',
      title: 'Temple Front View',
      uploadDate: '2023-09-15'
    },
    {
      id: '2',
      url: 'https://source.unsplash.com/random/800x600/?temple,2',
      title: 'Diwali Celebration',
      uploadDate: '2023-09-14'
    },
    {
      id: '3',
      url: 'https://source.unsplash.com/random/800x600/?temple,3',
      title: 'Morning Aarti',
      uploadDate: '2023-09-13'
    },
  ]);

  const handleDelete = (imageId: string) => {
    setImages(images.filter(image => image.id !== imageId));
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files).map((file, index) => ({
        id: Date.now().toString() + index,
        url: URL.createObjectURL(file),
        title: file.name,
        uploadDate: new Date().toISOString().split('T')[0]
      }));

      setImages([...newImages, ...images]);
    }
  };

  return (
    <div className="mt-10 space-y-6 p-4 md:p-6">
      {/* Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center sm:text-left">Gallery Management</h1>
        <label className="mt-2 sm:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer text-center">
          <span>Upload Images</span>
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative group">
              <img src={image.url} alt={image.title} className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 flex justify-end p-2">
                <button
                  onClick={() => handleDelete(image.id)}
                  className="p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <TrashIcon className="h-5 w-5 text-red-600" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-900">{image.title}</h3>
              <p className="mt-1 text-xs text-gray-500">Uploaded on {image.uploadDate}</p>
            </div>
          </div>
        ))}
      </div>

      {/* No Images Placeholder */}
      {images.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
};

export default GalleryManagement;
