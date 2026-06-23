import { Router } from 'express';
import {
  listBids,
  getBidDetails,
  createBid,
  updateBid,
  getBidCategories,
  addBidCategory,
  applyForBid,
  addBidReview,
  getBidReviews
} from '../controllers/bidController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', listBids);
router.get('/categories', getBidCategories);
router.post('/categories', authMiddleware, adminMiddleware, addBidCategory);
router.get('/:id', getBidDetails);
router.put('/:id', authMiddleware, updateBid);
router.patch('/:id', authMiddleware, updateBid);
router.post('/:id/apply', authMiddleware, applyForBid);
router.post('/', authMiddleware, createBid);
router.get('/:id/reviews', getBidReviews);
router.post('/:id/reviews', authMiddleware, addBidReview);

export default router;
