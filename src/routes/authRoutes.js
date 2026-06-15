import { Router } from 'express';
import { register, login, googleLoginRedirect, googleLoginCallback } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/google', googleLoginRedirect);
router.get('/google/callback', googleLoginCallback);

export default router;
