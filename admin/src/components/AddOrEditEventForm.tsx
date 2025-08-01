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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
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
        
        // ✅ Success notification
        alert(event ? 'ইভেন্ট সফলভাবে আপডেট হয়েছে!' : 'নতুন ইভেন্ট তৈরি হয়েছে!');
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
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            উৎসবের নাম <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="যেমন: কালী পূজা, দুর্গা পূজা"
            required
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              শুরুর তারিখ <span className="text-red-500">*</span>
            </label>
            <input
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              শেষের তারিখ <span className="text-red-500">*</span>
            </label>
            <input
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={loading}
              min={formData.startDate} // Prevent end date before start date
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            বর্ণনা <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            rows={4}
            placeholder="উৎসব সম্পর্কে বিস্তারিত লিখুন..."
            required
            disabled={loading}
            maxLength={500}
          />
          <p className="text-xs text-gray-500">
            {formData.description.length}/500 অক্ষর
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            ছবি {!event && <span className="text-red-500">*</span>}
          </label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageChange}
            className="w-full border border-gray-300 p-3 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            required={!event}
            disabled={loading}
          />
          <p className="text-xs text-gray-500">
            JPG, PNG, বা WebP ফরম্যাট। সর্বোচ্চ ৫MB।
          </p>
          
          {formData.imagePreview && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">ছবির প্রিভিউ:</p>
              <div className="relative inline-block">
                <img
                  src={formData.imagePreview}
                  alt="Preview"
                  className="w-48 h-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  প্রিভিউ
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            বাতিল
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            disabled={loading}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {loading ? 'অপেক্ষা করুন...' : event ? 'আপডেট করুন' : 'তৈরি করুন'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddOrEditEventForm;