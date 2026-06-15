import { Router } from 'express';
import { runScraper } from '../controllers/scraperController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/run', authMiddleware, adminMiddleware, runScraper);

export default router;
