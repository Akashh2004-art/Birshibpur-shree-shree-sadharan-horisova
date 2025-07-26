import instance from './axios';

export const createEvent = async (formData: FormData) => {
  const response = await instance.post('/events', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};