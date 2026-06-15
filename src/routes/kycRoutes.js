import { Router } from 'express';
import {
  submitKyc,
  getMyKyc,
  addRepresentatives,
  listAllKycs,
  reviewKyc,
  getIndustryCategories,
  addIndustryCategory,
  getVerifiedBusinessesDirectory
} from '../controllers/kycController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/categories', getIndustryCategories);
router.post('/categories', authMiddleware, adminMiddleware, addIndustryCategory);

router.post('/submit', authMiddleware, submitKyc);
router.get('/my', authMiddleware, getMyKyc);
router.post('/representatives', authMiddleware, addRepresentatives);
router.get('/directory', authMiddleware, getVerifiedBusinessesDirectory);

// Admin review endpoints
router.get('/all', authMiddleware, adminMiddleware, listAllKycs);
router.put('/review/:id', authMiddleware, adminMiddleware, reviewKyc);

export default router;
