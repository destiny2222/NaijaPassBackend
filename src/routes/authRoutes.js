import { Router } from 'express';
import { register, login, verifyOtp, resendOtp, googleLoginRedirect, googleLoginCallback } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.get('/google', googleLoginRedirect);
router.get('/google/callback', googleLoginCallback);

export default router;
