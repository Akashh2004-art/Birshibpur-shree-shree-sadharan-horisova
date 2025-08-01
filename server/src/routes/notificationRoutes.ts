import express from 'express';
import { getNotifications, markAsRead, markAllAsRead, getEmailStats } from '../controllers/notificationController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// ✅ নোটিফিকেশন দেখার রাউট
router.get('/', authenticateAdmin, getNotifications);

// ✅ ইমেইল পরিসংখ্যান দেখার রাউট
router.get('/email-stats', authenticateAdmin, getEmailStats);

// ✅ সব নোটিফিকেশন 'পড়া' হিসেবে মার্ক করার রাউট
router.put('/mark-all-read', authenticateAdmin, markAllAsRead);

// ✅ নির্দিষ্ট নোটিফিকেশন 'পড়া' হিসেবে মার্ক করার রাউট (প্যারামিটারাইজড রাউট সবশেষে রাখা হলো)
router.put('/:id/read', authenticateAdmin, markAsRead);

// ✅ FIXED: Default export যোগ করা হলো
export default router;