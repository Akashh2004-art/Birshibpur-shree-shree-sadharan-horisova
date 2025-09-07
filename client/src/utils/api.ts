const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface RequestConfig extends RequestInit {
  data?: any;
  headers?: Record<string, string>;
}

async function request(
  endpoint: string,
  { data, headers: customHeaders, ...customConfig }: RequestConfig = {}
) {
  const token = localStorage.getItem("token");
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestConfig = {
    method: data ? "POST" : "GET",
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...customHeaders,
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const responseData = await response.json();

    if (response.ok) {
      return responseData;
    }

    // Handle token expiration
    if (response.status === 401 && responseData.message?.includes("token")) {
      // Clear expired token
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login page
      window.location.href = "/login";
    }

    throw new Error(responseData.message || "কিছু একটা সমস্যা হয়েছে");
  } catch (error) {
    console.error(`API ত্রুটি (${endpoint}):`, error);
    return Promise.reject(
      error instanceof Error ? error : new Error("অজানা ত্রুটি")
    );
  }
}

// ✅ FIXED: Export apiRequest function
export const apiRequest = request;

export const userLogin = (data: {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}) => {
  if (!data.identifier || !data.password) {
    throw new Error("আইডেন্টিফায়ার (ইমেইল/ফোন) এবং পাসওয়ার্ড দরকার");
  }
  // ✅ FIXED: Changed from "/user/login" to "/user-auth/login"
  return request("/user-auth/login", { data, method: "POST" });
};

// ✅ Also fix other password-related routes if needed
export const sendForgotPasswordRequest = (emailOrPhone: string) => {
  if (!emailOrPhone) {
    throw new Error("ইমেইল বা ফোন নম্বর দরকার");
  }
  // Check if this should also be /user-auth instead of /user
  return request("/user/forgot-password", {
    data: { emailOrPhone },
    method: "POST",
  });
};

export const verifyOTP = (emailOrPhone: string, otp: string) => {
  if (!emailOrPhone || !otp) {
    throw new Error("ইমেইল/ফোন এবং OTP দরকার");
  }
  // Check if this should also be /user-auth instead of /user
  return request("/user/verify-otp", {
    data: { emailOrPhone, otp },
    method: "POST",
  });
};

export const setNewPassword = (
  emailOrPhone: string,
  otp: string,
  password: string
) => {
  if (!emailOrPhone || !otp || !password) {
    throw new Error("ইমেইল/ফোন, OTP এবং পাসওয়ার্ড দরকার");
  }

  const headers = {
    "Content-Type": "application/json",
  };

  // ✅ FIXED: Use 'emailOrPhone' instead of 'email'
  return request("/user/set-password", {
    data: {
      emailOrPhone,  // ✅ Changed from 'email' to 'emailOrPhone'
      otp,
      password,
    },
    method: "POST",
    headers,
  });
};

// ✅ Event API functions
export const getEventsForHome = () => {
  return request("/events/home", { method: "GET" });
};

export const getAllEvents = () => {
  return request("/events", { method: "GET" });
};

export const getUpcomingEvents = () => {
  return request("/events/upcoming", { method: "GET" });
};

export const getPastEvents = () => {
  return request("/events/history", { method: "GET" });
};

// ✅ NEW: Gallery API functions
export const getAllGallery = (params?: {
  category?: string;
  type?: string;
  page?: number;
  limit?: number;
}) => {
  // Build query string from params
  const queryString = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString()
    : "";

  return request(`/gallery${queryString}`, { method: "GET" });
};

export const getGalleryItem = (id: string) => {
  if (!id) {
    throw new Error("গ্যালারি আইটেম ID দরকার");
  }
  return request(`/gallery/${id}`, { method: "GET" });
};

export const getGalleryStats = () => {
  return request("/gallery/stats", { method: "GET" });
};


export const getCurrentBookingStatus = () => {
  return request("/bookings/user/current", { method: "GET" });
};

export const createBooking = (data: {
  name: string;
  email: string;
  phone: string;
  serviceId: number;
  date: string;
  time: string;
  message?: string;
}) => {
  if (!data.name || !data.email || !data.phone || !data.serviceId || !data.date || !data.time) {
    throw new Error("সব তথ্য পূরণ করুন");
  }
  return request("/bookings/create", { data, method: "POST" });
};

export const getUserBookings = (params?: {
  page?: number;
  limit?: number;
}) => {
  const queryString = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString()
    : "";

  return request(`/bookings/user${queryString}`, { method: "GET" });
};

// ✅ Booking API object for easier usage
export const bookingApi = {
  getCurrent: getCurrentBookingStatus,
  create: createBooking,
  getUserBookings,
};


export const api = {
  get: (endpoint: string, config: RequestConfig = {}) =>
    request(endpoint, { ...config, method: "GET" }),
  post: (endpoint: string, data: any, config: RequestConfig = {}) =>
    request(endpoint, { data, method: "POST", ...config }),
  put: (endpoint: string, data: any, config: RequestConfig = {}) =>
    request(endpoint, { data, method: "PUT", ...config }),
  delete: (endpoint: string, config: RequestConfig = {}) =>
    request(endpoint, { method: "DELETE", ...config }),
};

// ✅ Gallery API object for easier usage
export const galleryApi = {
  getAll: getAllGallery,
  getOne: getGalleryItem,
  getStats: getGalleryStats,
};

export default {
  userLogin,
  api,
  apiRequest,
  sendForgotPasswordRequest,
  verifyOTP,
  setNewPassword,
  getEventsForHome,
  getAllEvents,
  getUpcomingEvents,
  getPastEvents,
  getAllGallery,
  getGalleryItem,
  getGalleryStats,
  galleryApi,
  getCurrentBookingStatus,  
  createBooking,             
  getUserBookings,           
  bookingApi,               
};