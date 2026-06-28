import { Router } from 'express';
import { analyzeCompliance } from '../controllers/assistantController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/analyze', analyzeCompliance);

export default router;
