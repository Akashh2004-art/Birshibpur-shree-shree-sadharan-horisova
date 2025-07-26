import express from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// ✅ নোটিফিকেশন দেখার রাউট
router.get('/', authenticateAdmin, getNotifications);

// ✅ সব নোটিফিকেশন 'পড়া' হিসেবে মার্ক করার রাউট (একটাই রাখলাম)
router.put('/mark-all-read', authenticateAdmin, markAllAsRead);

// ✅ নির্দিষ্ট নোটিফিকেশন 'পড়া' হিসেবে মার্ক করার রাউট (প্যারামিটারাইজড রাউট সবশেষে রাখা হলো)
router.put('/:id/read', authenticateAdmin, markAsRead);

export default router;
