export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Updated to handle both Indian phone formats:
  // 1. With +91 prefix: +91XXXXXXXXXX
  // 2. Without prefix: XXXXXXXXXX
  const cleanPhone = phone.replace(/^\+91/, '');
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(cleanPhone);
};