import express from 'express';
import {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
  getBookingStats,
  getCurrentBookingStatus, // ✅ ADD THIS IMPORT
} from '../controllers/bookingController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// User routes (require authentication)
router.post('/create', authenticateToken, createBooking);
router.get('/user', authenticateToken, getUserBookings);
router.get('/user/current', authenticateToken, getCurrentBookingStatus); // ✅ ADD THIS ROUTE

// Admin routes (require admin authentication)
router.get('/admin/all', authenticateToken, getAllBookings);
router.put('/admin/:id/status', authenticateToken, updateBookingStatus);
router.delete('/admin/:id', authenticateToken, deleteBooking);
router.get('/admin/stats', authenticateToken, getBookingStats);

export default router;