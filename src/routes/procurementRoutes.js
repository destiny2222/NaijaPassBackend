import { Router } from 'express';
import {
  getProcurements,
  getProcurementById,
  createProcurement,
  updateProcurement,
  deleteProcurement
} from '../controllers/procurementController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Publicly accessible endpoints to view data
router.get('/', getProcurements);
router.get('/:id', getProcurementById);

// Protected endpoints for creation/management
router.post('/', authMiddleware, createProcurement);
router.put('/:id', authMiddleware, updateProcurement);
router.delete('/:id', authMiddleware, deleteProcurement);

export default router;
