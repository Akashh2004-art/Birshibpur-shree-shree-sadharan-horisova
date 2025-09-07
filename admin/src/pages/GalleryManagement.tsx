import React, { useState, useEffect } from 'react';
import { TrashIcon, PhotoIcon, CloudArrowUpIcon, PlusIcon, CheckCircleIcon, XCircleIcon, PlayIcon } from '@heroicons/react/24/outline';
import axios from '../api/axios';

interface Media {
  _id: string;
  url: string;
  title: string;
  category: string;
  uploadDate: string;
  type: 'image' | 'video';
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error';
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/gallery');
        setMedia(res.data || []);
      } catch (error) {
        console.error('Failed to load gallery:', error);
        addNotification('Failed to load gallery', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  const compressImage = (file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;
        const maxDimension = 1920;

        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const compressVideo = (file: File, targetSizeMB: number = 50): Promise<File> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        const { videoWidth, videoHeight, duration } = video;
        
        // Calculate scale factor based on target file size
        const currentSizeMB = file.size / (1024 * 1024);
        const compressionRatio = Math.min(1, targetSizeMB / currentSizeMB);
        const scaleFactor = Math.sqrt(compressionRatio);
        
        // Set canvas dimensions
        canvas.width = Math.floor(videoWidth * scaleFactor);
        canvas.height = Math.floor(videoHeight * scaleFactor);
        
        // For browser-based compression, we'll reduce frame rate and quality
        const mediaRecorder = new MediaRecorder(canvas.captureStream(15), {
          mimeType: 'video/webm;codecs=vp8',
          videoBitsPerSecond: Math.floor(1000000 * compressionRatio) // Reduce bitrate
        });
        
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: 'video/webm' });
          const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.webm'), {
            type: 'video/webm',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        };

        // Start recording and play video
        mediaRecorder.start();
        
        video.currentTime = 0;
        video.play();
        
        const drawFrame = () => {
          if (video.currentTime < duration && !video.ended) {
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            video.currentTime += 1/15; // 15 FPS
            requestAnimationFrame(drawFrame);
          } else {
            mediaRecorder.stop();
            video.pause();
          }
        };
        
        video.onseeked = drawFrame;
      };

      video.onerror = () => {
        // If compression fails, return original file
        resolve(file);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      const isImage = selectedFile.type.startsWith('image/');
      const isVideo = selectedFile.type.startsWith('video/');
      
      if (isImage && selectedFile.size > 100 * 1024 * 1024) {
        addNotification('Image file too large! Maximum 100MB allowed.', 'error');
        return;
      }
      
      if (isVideo && selectedFile.size > 500 * 1024 * 1024) {
        addNotification('Video file too large! Maximum 500MB allowed.', 'error');
        return;
      }

      try {
        let processedFile = selectedFile;
        
        if (isImage && selectedFile.size > 8 * 1024 * 1024) {
          processedFile = await compressImage(selectedFile);
          addNotification('Image compressed successfully', 'success');
        } else if (isVideo && selectedFile.size > 50 * 1024 * 1024) {
          processedFile = await compressVideo(selectedFile);
          addNotification('Video compressed successfully', 'success');
        }

        setFile(processedFile);

        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(processedFile);

      } catch (error) {
        console.error('File processing failed:', error);
        addNotification('File processing failed', 'error');
      }
    } else {
      setFile(null);
      setFilePreview(null);
    }
  };

  const getFileType = (file: File): 'image' | 'video' => {
    return file.type.startsWith('video') ? 'video' : 'image';
  };

  const handleUpload = async () => {
    if (!file || !title || !category) {
      addNotification('Please fill in all fields', 'error');
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
      setShowForm(false);
      addNotification('Media uploaded successfully', 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      addNotification('Upload failed', 'error');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const confirmDeleteMedia = (id: string) => {
    setConfirmDelete(id);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      setDeletingId(confirmDelete);
      await axios.delete(`/gallery/${confirmDelete}`);
      setMedia(prev => prev.filter(item => item._id !== confirmDelete));
      setConfirmDelete(null);
      addNotification('Media deleted successfully', 'success');
    } catch (error) {
      console.error('Delete failed:', error);
      addNotification('Failed to delete media', 'error');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
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
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl mb-6 shadow-xl">
            <PhotoIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Gallery Management
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Manage temple photos and videos
          </p>
        </div>

        {/* Add Button */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-lg font-semibold"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Media
          </button>
        </div>

        {/* Upload Form */}
        {showForm && (
          <div className="mb-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-orange-200/50 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <CloudArrowUpIcon className="w-6 h-6 text-orange-600" />
                Upload New Media
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select File</label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-orange-500 file:to-red-500 file:text-white hover:file:from-orange-600 hover:file:to-red-600 transition-all duration-300 border-2 border-dashed border-orange-300 rounded-xl p-4"
                      disabled={uploading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      placeholder="Enter title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-300"
                      disabled={uploading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-300"
                      disabled={uploading}
                    >
                      <option value="মন্দির">মন্দির</option>
                      <option value="অনুষ্ঠান">অনুষ্ঠান</option>
                      <option value="ঠাকুর">ঠাকুর</option>
                      <option value="দৈনন্দিন">দৈনন্দিন</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={uploading || !file || !title}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {uploading ? `Uploading... ${uploadProgress}%` : 'Upload'}
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preview</label>
                  <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
                    {filePreview ? (
                      file && getFileType(file) === 'video' ? (
                        <video
                          src={filePreview}
                          controls
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      )
                    ) : (
                      <div className="text-center">
                        <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No file selected</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex justify-between text-sm font-medium text-green-700 mb-2">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl p-6 text-center max-w-md mx-4 shadow-2xl">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Media</h3>
                <p className="text-gray-600">Are you sure you want to delete this media?</p>
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

        {/* Gallery Grid */}
        <div>
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Media Gallery</h2>
            <span className="ml-3 bg-orange-100 text-orange-800 px-3 py-1 rounded-lg text-sm font-semibold">
              {media.length} items
            </span>
          </div>

          {media.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 text-center border-2 border-dashed border-orange-200">
              <PhotoIcon className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No media uploaded yet</h3>
              <p className="text-gray-500">Upload your first image or video</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {media.map((item) => (
                <div
                  key={item._id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border border-orange-100 overflow-hidden transition-all duration-300 hover:scale-105"
                >
                  <div className="relative">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="relative">
                        <video
                          src={item.url}
                          className="w-full h-48 object-cover"
                          muted
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-2">
                            <PlayIcon className="w-6 h-6 text-gray-800" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => confirmDeleteMedia(item._id)}
                      disabled={deletingId === item._id}
                      className="absolute top-3 right-3 p-2 bg-white/90 rounded-lg shadow hover:bg-red-50 transition-colors"
                    >
                      {deletingId === item._id ? (
                        <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <TrashIcon className="h-4 w-4 text-red-600" />
                      )}
                    </button>

                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        item.type === 'image' 
                          ? 'bg-blue-500/90 text-white' 
                          : 'bg-red-500/90 text-white'
                      }`}>
                        {item.type === 'image' ? 'IMAGE' : 'VIDEO'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                        {item.category}
                      </span>
                      <span className="text-gray-500">{formatDate(item.uploadDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
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

export default GalleryManagement;