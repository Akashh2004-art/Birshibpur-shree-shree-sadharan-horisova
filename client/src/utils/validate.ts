export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim());
};

export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  return passwordRegex.test(password);
};

export const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\u0980-\u09FF\s]{2,}$/;
  return nameRegex.test(name.trim());
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+91[6-9]\d{9}$|^[6-9]\d{9}$/;
  return phoneRegex.test(phone.trim());
};

export const validateOTP = (otp: string): boolean => {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp.trim());
};

export default {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateOTP,
};