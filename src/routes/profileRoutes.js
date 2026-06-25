import { Router } from 'express';
import { getUser, updateProfile, changePassword, getAllUsers } from '../controllers/profileController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/all', authMiddleware, adminMiddleware, getAllUsers);
router.get('/', authMiddleware, getUser);
router.get('/me', authMiddleware, getUser);
router.put('/me', authMiddleware, updateProfile);
router.put('/password', authMiddleware, changePassword);

export default router;
