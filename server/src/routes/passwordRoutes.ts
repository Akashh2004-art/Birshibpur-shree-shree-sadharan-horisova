import express from 'express';
import { sendOTP, verifyOTP, resetPassword } from '../controllers/passwordController';

const router = express.Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

export default router;