import express from 'express';
import { forgotPassword, verifyOTP, setNewPassword } from '../controllers/userPasswordController';

const router = express.Router();


router.use((req, res, next) => {
  next();
});

router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);         
router.post('/set-password', setNewPassword);  

export default router;