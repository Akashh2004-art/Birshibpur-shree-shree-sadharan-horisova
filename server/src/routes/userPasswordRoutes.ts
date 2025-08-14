import express from 'express';
import { forgotPassword, verifyOTP, setNewPassword } from '../controllers/userPasswordController';

const router = express.Router();

// ডিবাগিং মিডলওয়্যার যোগ করুন
router.use((req, res, next) => {
  console.log('Request body in middleware:', req.body);
  next();
});

router.post('/forgot-password', forgotPassword); // OTP পাঠানোর জন্য
router.post('/verify-otp', verifyOTP);          // OTP যাচাই
router.post('/set-password', setNewPassword);    // নতুন পাসওয়ার্ড সেট

export default router;