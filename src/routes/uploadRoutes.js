import { Router } from 'express';
import multer from 'multer';
import { uploadDocument } from '../controllers/uploadController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error('Only PDF, JPG, PNG, and WEBP documents are allowed'));
    }

    return callback(null, true);
  }
});

function uploadSingleDocument(req, res, next) {
  upload.single('document')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    return next();
  });
}

router.post('/document', authMiddleware, uploadSingleDocument, uploadDocument);

export default router;
