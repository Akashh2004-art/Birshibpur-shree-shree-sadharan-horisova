import express from 'express';
import { 
  googleSignIn, 
  setPassword, 
  login,
  getAdminProfile
} from '../controllers/authController';
import { 
  verifyFirebaseToken, 
  authenticateJWT 
} from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/google-signup', verifyFirebaseToken, googleSignIn);
router.post('/login', login);

// Protected routes - requires JWT authentication
router.post('/set-password', authenticateJWT, setPassword);
router.get('/profile', authenticateJWT, getAdminProfile);

export default router;