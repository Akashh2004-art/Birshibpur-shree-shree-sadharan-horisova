import express from 'express';
import { getNotifications, markAsRead, markAllAsRead, getEmailStats } from '../controllers/notificationController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = express.Router();


router.get('/', authenticateAdmin, getNotifications);


router.get('/email-stats', authenticateAdmin, getEmailStats);


router.put('/mark-all-read', authenticateAdmin, markAllAsRead);


router.put('/:id/read', authenticateAdmin, markAsRead);


export default router;