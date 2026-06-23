import { Router } from 'express';
import { getUser, updateProfile, changePassword } from '../controllers/profileController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, getUser);
router.get('/me', authMiddleware, getUser);
router.put('/me', authMiddleware, updateProfile);
router.put('/password', authMiddleware, changePassword);

export default router;
