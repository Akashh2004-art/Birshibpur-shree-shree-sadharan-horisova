import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = Router();

// ড্যাশবোর্ড স্ট্যাটিসটিক্স এন্ডপয়েন্ট
router.get('/stats', authenticateAdmin, getDashboardStats);

export default router;