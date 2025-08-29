import express from 'express';
import {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
  getBookingStats,
  getCurrentBookingStatus,
} from '../controllers/bookingController';
import { 
  authenticateToken,    // ✅ Main auth function
  authenticateAdmin,    // ✅ Admin auth  
  securityMiddleware,   // ✅ Security
  AuthenticatedRequest  // ✅ FIXED: Import the type
} from '../middleware/authMiddleware';

const router = express.Router();

// 🛡️ Apply security middleware to all routes
router.use(securityMiddleware);

// 📊 Rate limiting tracking for booking routes
const routeTracker = new Map<string, { count: number; resetTime: number }>();

// 🛡️ Booking-specific rate limiting middleware
const bookingRateLimit = (maxRequests = 10, windowMs = 60000) => {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const identifier = `booking_${clientIP}_${userAgent.substring(0, 20)}`;
    
    const now = Date.now();
    const userTrack = routeTracker.get(identifier);
    
    if (!userTrack || now > userTrack.resetTime) {
      // Reset or create new tracking
      routeTracker.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (userTrack.count >= maxRequests) {
      console.log(`🛑 Booking rate limit exceeded for ${identifier}: ${userTrack.count}/${maxRequests}`);
      return res.status(429).json({ 
        success: false, 
        message: '⚠️ বুকিং রিকোয়েস্ট অনেক হয়েছে। ১ মিনিট অপেক্ষা করুন।' 
      });
    }
    
    userTrack.count++;
    next();
  };
};

// 🧹 Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of routeTracker) {
    if (now > value.resetTime) {
      routeTracker.delete(key);
    }
  }
}, 5 * 60 * 1000);

// 👤 USER ROUTES (require user authentication)
// ✅ Create booking - stricter rate limit
router.post('/create', 
  bookingRateLimit(3, 300000), // 3 requests per 5 minutes
  authenticateToken, 
  createBooking
);

// ✅ Get user's own bookings
router.get('/user', 
  bookingRateLimit(20, 60000), // 20 requests per minute
  authenticateToken, 
  getUserBookings
);

// ✅ Get current booking status
router.get('/user/current', 
  bookingRateLimit(15, 60000), // 15 requests per minute
  authenticateToken, 
  getCurrentBookingStatus
);

// 🔒 ADMIN ROUTES (require admin authentication)
// ✅ Get all bookings - enhanced rate limiting for heavy operation
router.get('/admin/all', 
  bookingRateLimit(15, 60000), // 15 requests per minute for admin
  authenticateAdmin, // ✅ FIXED: Using authenticateAdmin instead of authenticateToken
  getAllBookings
);

// ✅ Update booking status
router.put('/admin/:id/status', 
  bookingRateLimit(20, 60000), // 20 status updates per minute
  authenticateAdmin, // ✅ FIXED: Using authenticateAdmin
  updateBookingStatus
);

// ✅ Delete booking - very strict rate limit
router.delete('/admin/:id', 
  bookingRateLimit(10, 60000), // 10 deletes per minute
  authenticateAdmin, // ✅ FIXED: Using authenticateAdmin
  deleteBooking
);

// ✅ Get booking statistics
router.get('/admin/stats', 
  bookingRateLimit(10, 60000), // 10 stats requests per minute
  authenticateAdmin, // ✅ FIXED: Using authenticateAdmin
  getBookingStats
);

// 🔧 Health check route (no auth required)
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '✅ Booking service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 📊 Public stats route (limited data, no auth required)
router.get('/public/stats', 
  bookingRateLimit(5, 60000), // 5 requests per minute
  (req, res) => {
    // Return only basic public stats
    res.json({
      success: true,
      message: '📊 Public booking stats',
      stats: {
        totalBookings: '🔒 Login required for details',
        availableServices: '🛐 Puja booking available'
      }
    });
  }
);

// 🧹 Cleanup function for graceful shutdown
export const cleanupBookingRoutes = () => {
  routeTracker.clear();
  console.log('🧹 Booking routes cleanup completed');
};

export default router;