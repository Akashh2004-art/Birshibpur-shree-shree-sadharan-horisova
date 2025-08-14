import express from 'express';
import { 
  googleSignUp,
  logout,
  getAllUsers,
  getUserProfile // New function to be added
} from '../controllers/userAuthController';
import { authenticateAdmin, authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// 🔥 Google Authentication Routes
router.post('/google-signup', googleSignUp); // Main Google auth endpoint

// 🔹 User Profile Routes
router.get('/me', authenticateToken, getUserProfile);  // Get current user profile

// 🔹 Auth Management
router.post('/logout', logout); // User logout

// 🔹 Admin Only Routes
router.get('/users', authenticateAdmin, getAllUsers); // Get all users (admin only)

// ❌ REMOVED ROUTES (No longer needed for Google-only auth):
// router.post('/login', login);
// router.post('/register-phone', validatePhoneNumber);
// router.post('/complete-google-signup', completeGoogleSignUp);
// router.post('/set-password', setPassword);
// router.post('/validate-phone', validatePhoneNumber);
// router.post('/check-phone', checkPhoneNumber);
// router.post('/complete-signup', completeSignup);

export default router;