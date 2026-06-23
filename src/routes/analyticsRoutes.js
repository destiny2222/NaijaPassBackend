import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, getDashboardAnalytics);

export default router;
