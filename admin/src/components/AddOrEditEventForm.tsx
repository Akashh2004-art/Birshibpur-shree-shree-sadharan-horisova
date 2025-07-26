import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createEvent } from '../api/event';

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
    imagePreview: '' // Preview image show korar jonno
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
        imagePreview: event.imageUrl // existing image show korar jonno
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
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file) // Preview show korar jonno
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('description', formData.description);
      
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      let response;
      if (event) {
        // Update existing event
        response = await axios.put(`/api/events/${event.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Create new event
        response = await createEvent(formDataToSend);
      }

      onSave(response.data);
      onClose();
    } catch (err) {
      setError('একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">উৎসবের নাম</label>
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full border p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">শুরুর তারিখ</label>
        <input
          name="startDate"
          type="date"
          value={formData.startDate}
          onChange={handleChange}
          className="w-full border p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">শেষের তারিখ</label>
        <input
          name="endDate"
          type="date"
          value={formData.endDate}
          onChange={handleChange}
          className="w-full border p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">বর্ণনা</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">ছবি</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full border p-2 rounded"
          required={!event}
        />
        {formData.imagePreview && (
          <div className="mt-2">
            <img
              src={formData.imagePreview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          বাতিল
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'অপেক্ষা করুন...' : event ? 'আপডেট করুন' : 'তৈরি করুন'}
        </button>
      </div>
    </form>
  );
};

export default AddOrEditEventForm;