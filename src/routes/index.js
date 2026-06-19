import { Router } from 'express';
import authRoutes from './authRoutes.js';
import kycRoutes from './kycRoutes.js';
import bidRoutes from './bidRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import scraperRoutes from './scraperRoutes.js';
import profileRoutes from './profileRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/kyc', kycRoutes);
router.use('/bids', bidRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/scraper', scraperRoutes);
router.use('/profile', profileRoutes);

export default router;
