import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/stats', authenticateAdmin, getDashboardStats);

export default router;