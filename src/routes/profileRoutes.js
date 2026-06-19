import { Router } from 'express';
import { getUser } from '../controllers/profileController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, getUser);
router.get('/me', authMiddleware, getUser);

export default router;
