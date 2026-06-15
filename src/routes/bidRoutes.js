import { Router } from 'express';
import {
  listBids,
  getBidDetails,
  createBid,
  getBidCategories,
  addBidCategory
} from '../controllers/bidController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', listBids);
router.get('/categories', getBidCategories);
router.post('/categories', authMiddleware, adminMiddleware, addBidCategory);
router.get('/:id', getBidDetails);
router.post('/', authMiddleware, adminMiddleware, createBid);

export default router;
