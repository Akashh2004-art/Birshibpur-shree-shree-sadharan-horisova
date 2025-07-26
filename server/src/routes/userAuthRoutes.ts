import express from 'express';
import { 
  googleSignUp, 
  setPassword, 
  completeGoogleSignUp, 
  validatePhoneNumber, 
  completeSignup,
  checkPhoneNumber, 
  login,
  logout,
  getAllUsers // নতুন কন্ট্রোলার ইমপোর্ট
} from '../controllers/userAuthController';
import { authenticateAdmin } from '../middleware/authMiddleware'; // অ্যাডমিন অথেন্টিকেশন

const router = express.Router();

// 🔹 Login Routes
router.post('/login', login);

// 🔹 Phone Registration Routes
router.post('/register-phone', validatePhoneNumber);

// 🔹 Google Signup Routes
router.post('/google-signup', googleSignUp);
router.post('/complete-google-signup', completeGoogleSignUp);

// 🔹 Phone & Password Related Routes
router.post('/set-password', setPassword);
router.post('/validate-phone', validatePhoneNumber);
router.post('/check-phone', checkPhoneNumber);
router.post('/complete-signup', completeSignup);
router.post('/logout', logout);

// 🔹 Admin Only Route for Getting All Users
router.get('/get-users', authenticateAdmin, getAllUsers); // শুধুমাত্র অ্যাডমিন পাওয়া যাবে

export default router;