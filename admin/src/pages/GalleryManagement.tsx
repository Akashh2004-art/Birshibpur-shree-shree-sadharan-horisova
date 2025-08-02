import React, { useState, useEffect } from 'react';
import { TrashIcon, PhotoIcon, VideoCameraIcon, CloudArrowUpIcon, PlayIcon, DocumentIcon } from '@heroicons/react/24/outline';
import axios from '../api/axios';

interface Media {
  _id: string;
  url: string;
  title: string;
  category: string;
  uploadDate: string;
  type: 'image' | 'video';
}

const GalleryManagement: React.FC = () => {
  const [media, setMedia] = useState<Media[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('মন্দির');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    axios.get('/gallery')
      .then(res => setMedia(res.data))
      .catch(err => console.error('Error fetching gallery:', err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const getFileType = (file: File) => {
    return file.type.startsWith('video') ? 'video' : 'image';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!file || !title || !category) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title);
    formData.append('category', category);
    formData.append('type', getFileType(file));

    try {
      setUploading(true);
      setUploadProgress(0);
      
      const res = await axios.post('/gallery/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });

      setMedia(prev => [res.data, ...prev]);
      setFile(null);
      setFilePreview(null);
      setTitle('');
      setCategory('মন্দির');
      setUploadProgress(0);
      setMessage({ type: 'success', text: 'Upload successful!' });
    } catch (err) {
      console.error('Upload failed:', err);
      setMessage({ type: 'error', text: 'Upload failed. Try again.' });
      setUploadProgress(0);
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await axios.delete(`/gallery/${id}`);
      setMedia(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete media.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl mb-6 shadow-xl">
            <PhotoIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Gallery Management
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Upload and manage your temple's beautiful moments and memories
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-orange-200/50 mb-10 hover:shadow-3xl transition-all duration-500">
          <div className="flex items-center gap-3 mb-8">
            <CloudArrowUpIcon className="w-7 h-7 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-800">Upload New Media</h2>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left Side - Form Fields */}
            <div className="space-y-6">
              {/* File Input */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Select Media File</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-4 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-orange-500 file:to-red-500 file:text-white hover:file:from-orange-600 hover:file:to-red-600 duration-300 file:shadow-lg cursor-pointer border-2 border-dashed border-orange-300 rounded-2xl p-4 hover:border-orange-400 transition-colors"
                    disabled={uploading}
                  />
                  {file && (
                    <div className="mt-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                      <div className="flex items-center gap-3">
                        {getFileType(file) === 'video' ? (
                          <VideoCameraIcon className="w-5 h-5 text-orange-600" />
                        ) : (
                          <PhotoIcon className="w-5 h-5 text-orange-600" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {getFileType(file).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Media Title</label>
                <input
                  type="text"
                  placeholder="Enter a descriptive title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-orange-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 transition-all duration-300 disabled:bg-gray-100 text-gray-800 placeholder-gray-400"
                  disabled={uploading}
                />
              </div>

              {/* Category Select */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-orange-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 transition-all duration-300 disabled:bg-gray-100 text-gray-800"
                  disabled={uploading}
                >
                  <option value="মন্দির">মন্দির</option>
                  <option value="অনুষ্ঠান">অনুষ্ঠান</option>
                  <option value="ঠাকুর">ঠাকুর</option>
                  <option value="দৈনন্দিন">দৈনন্দিন</option>
                </select>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading... {uploadProgress}%</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <CloudArrowUpIcon className="w-5 h-5" />
                    Upload Media
                  </div>
                )}
              </button>
            </div>

            {/* Right Side - Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Preview</h3>
              <div className="bg-gray-100 rounded-2xl p-6 min-h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300">
                {filePreview ? (
                  <div className="w-full">
                    {file && getFileType(file) === 'video' ? (
                      <div className="relative">
                        <video
                          src={filePreview}
                          controls
                          className="w-full h-auto max-h-64 rounded-xl shadow-lg"
                        />
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <VideoCameraIcon className="w-3 h-3" />
                          VIDEO
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="w-full h-auto max-h-64 object-cover rounded-xl shadow-lg"
                        />
                        <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <PhotoIcon className="w-3 h-3" />
                          IMAGE
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <DocumentIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Select a file to see preview</p>
                    <p className="text-gray-400 text-sm mt-2">Supports images and videos</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="mt-8 bg-orange-50 rounded-2xl p-6">
              <div className="flex justify-between text-sm font-semibold text-orange-700 mb-3">
                <span>Uploading your media...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-4 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={`mt-6 px-6 py-4 rounded-2xl font-semibold border-2 animate-pulse ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Gallery Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <PhotoIcon className="w-8 h-8 text-orange-600" />
            Media Gallery ({media.length} items)
          </h2>
          
          {media.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-20 text-center border-2 border-dashed border-orange-200">
              <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <PhotoIcon className="w-16 h-16 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-600 mb-4">No media uploaded yet</h3>
              <p className="text-gray-500 text-lg">Start by uploading your first image or video above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {media.map(item => (
                <div key={item._id} className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl border border-orange-100 overflow-hidden transition-all duration-500 hover:scale-105 hover:-translate-y-2">
                  <div className="relative overflow-hidden">
                    {item.type === 'image' ? (
                      <div className="relative">
                        <img 
                          src={item.url} 
                          alt={item.title} 
                          className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                          <PhotoIcon className="w-3 h-3" />
                          IMAGE
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <video 
                          src={item.url} 
                          className="w-full h-64 object-cover" 
                          muted
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors duration-300">
                          <div className="bg-white/90 rounded-full p-4 transform group-hover:scale-110 transition-transform duration-300">
                            <PlayIcon className="w-8 h-8 text-gray-800" />
                          </div>
                        </div>
                        <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                          <VideoCameraIcon className="w-3 h-3" />
                          VIDEO
                        </div>
                      </div>
                    )}
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingId === item._id}
                      className="absolute top-3 right-3 p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-red-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110 border border-red-200"
                    >
                      {deletingId === item._id ? (
                        <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <TrashIcon className="h-5 w-5 text-red-600" />
                      )}
                    </button>

                    {/* Category Badge */}
                    <div className="absolute bottom-3 left-3 bg-orange-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
                      {item.category}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-bold text-gray-800 mb-3 line-clamp-2 text-lg">{item.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="font-medium">{formatDate(item.uploadDate)}</span>
                      <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
                        {item.type === 'image' ? (
                          <PhotoIcon className="w-4 h-4" />
                        ) : (
                          <VideoCameraIcon className="w-4 h-4" />
                        )}
                        <span className="capitalize font-semibold">{item.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryManagement;