import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface EventFormProps {
  event?: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
    imageUrl: string;
  };
  onClose: () => void;
  onSave: (data: any) => void;
}

const AddOrEditEventForm: React.FC<EventFormProps> = ({ event, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    description: '',
    imageFile: null as File | null,
    imagePreview: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        description: event.description,
        imageFile: null,
        imagePreview: event.imageUrl
      });
    }
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (file: File) => {
    // ✅ File validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('ছবির সাইজ ৫MB এর কম হতে হবে');
      return;
    }

    // ✅ File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('শুধুমাত্র JPG, PNG, বা WebP ফরম্যাটের ছবি আপলোড করুন');
      return;
    }

    setError(''); // Clear any previous errors
    setFormData(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file)
    }));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageChange(e.target.files[0]);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ✅ Validation
    if (!formData.title.trim()) {
      setError('উৎসবের নাম লিখুন');
      setLoading(false);
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('শুরু এবং শেষের তারিখ দিন');
      setLoading(false);
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('শেষের তারিখ শুরুর তারিখের পরে হতে হবে');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('বর্ণনা লিখুন');
      setLoading(false);
      return;
    }

    if (!event && !formData.imageFile) {
      setError('একটি ছবি আপলোড করুন');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('description', formData.description.trim());
      
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      let response;
      
      // ✅ FIXED: Use proper API endpoints
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      if (event) {
        // Update existing event
        response = await axios.put(
          `${baseURL}/api/events/${event.id}`, 
          formDataToSend, 
          {
            headers: { 
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        );
      } else {
        // Create new event
        response = await axios.post(
          `${baseURL}/api/events`, 
          formDataToSend, 
          {
            headers: { 
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        );
      }

      if (response.data.success) {
        onSave(response.data);
        onClose();
      } else {
        setError(response.data.error || 'একটি সমস্যা হয়েছে');
      }

    } catch (err: any) {
      console.error('Error:', err);
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.status === 401) {
        setError('আপনার সেশন শেষ হয়ে গেছে। আবার লগইন করুন।');
      } else if (err.response?.status === 413) {
        setError('ফাইল সাইজ অনেক বড়। ছোট ছবি আপলোড করুন।');
      } else {
        setError('নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cleanup image preview URL on unmount
  useEffect(() => {
    return () => {
      if (formData.imagePreview && formData.imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(formData.imagePreview);
      }
    };
  }, [formData.imagePreview]);

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm animate-shake">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Event Title */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 items-center">
                <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                উৎসবের নাম <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all duration-300 bg-gray-50 focus:bg-white text-lg"
                placeholder="যেমন: কালী পূজা, দুর্গা পূজা, সরস্বতী পূজা"
                required
                disabled={loading}
              />
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  শুরুর তারিখ <span className="text-red-500">*</span>
                </label>
                <input
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-green-100 focus:border-green-400 transition-all duration-300 bg-gray-50 focus:bg-white"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 items-center">
                  <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  শেষের তারিখ <span className="text-red-500">*</span>
                </label>
                <input
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-red-100 focus:border-red-400 transition-all duration-300 bg-gray-50 focus:bg-white"
                  required
                  disabled={loading}
                  min={formData.startDate} // Prevent end date before start date
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                বর্ণনা <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 resize-none bg-gray-50 focus:bg-white"
                rows={5}
                placeholder="উৎসব সম্পর্কে বিস্তারিত লিখুন... যেমন: সময়, বিশেষ আকর্ষণ, অংশগ্রহণকারী ইত্যাদি"
                required
                disabled={loading}
                maxLength={500}
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">উৎসবের সম্পূর্ণ বিবরণ দিন</span>
                <span className={`font-medium ${formData.description.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                  {formData.description.length}/500 অক্ষর
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Image Upload */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 items-center">
                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                ছবি {!event && <span className="text-red-500">*</span>}
              </label>
              
              {/* Drag and Drop Area */}
              <div
                className={`relative border-3 border-dashed rounded-3xl p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required={!event}
                  disabled={loading}
                />
                
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      ছবি আপলোড করুন
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      ড্র্যাগ করে ছেড়ে দিন অথবা ক্লিক করুন
                    </p>
                  </div>
                  
                  <div className="bg-gray-100 rounded-xl p-3 inline-block">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">সমর্থিত ফরম্যাট:</span> JPG, PNG, WebP
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">সর্বোচ্চ সাইজ:</span> ৫MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Image Preview */}
            {formData.imagePreview && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  ছবির প্রিভিউ
                </p>
                
                <div className="relative group">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-2xl border-4 border-white shadow-xl transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 text-sm px-3 py-1 rounded-full font-medium">
                    প্রিভিউ
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t-2 border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50"
            disabled={loading}
          >
            বাতিল
          </button>
          
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:from-orange-600 hover:to-red-600 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
            disabled={loading}
          >
            {loading && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            
            {loading ? (
              'অপেক্ষা করুন...'
            ) : (
              <>
                {event ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    আপডেট করুন
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    তৈরি করুন
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </form>

      <style >{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
};

export default AddOrEditEventForm;