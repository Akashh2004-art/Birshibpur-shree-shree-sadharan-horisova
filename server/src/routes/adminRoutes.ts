import express from 'express';
import { getAdminProfile } from '../controllers/authController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/profile', authenticateJWT, getAdminProfile);

export default router; 