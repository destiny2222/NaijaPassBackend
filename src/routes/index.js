import { Router } from 'express';
import authRoutes from './authRoutes.js';
import kycRoutes from './kycRoutes.js';
import bidRoutes from './bidRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import scraperRoutes from './scraperRoutes.js';
import profileRoutes from './profileRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import procurementRoutes from './procurementRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/kyc', kycRoutes);
router.use('/bids', bidRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/scraper', scraperRoutes);
router.use('/profile', profileRoutes);
router.use('/uploads', uploadRoutes);
router.use('/procurements', procurementRoutes);

export default router;
