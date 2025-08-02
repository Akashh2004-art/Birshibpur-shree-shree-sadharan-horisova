import { Router } from 'express';
import {
  getAllGallery,
  uploadMedia,
  deleteMedia,
  getGalleryItem,
  updateGalleryItem,
  getGalleryStats,
  upload,
} from '../controllers/galleryController';
import { authenticateAdmin } from '../middleware/authMiddleware'; // ✅ use correct named import

const router = Router();

// Public routes
router.get('/', getAllGallery);
router.get('/stats', getGalleryStats);
router.get('/:id', getGalleryItem);

// Protected routes (admin only)
router.post('/upload', authenticateAdmin, upload.single('image'), uploadMedia);
router.put('/:id', authenticateAdmin, updateGalleryItem);
router.delete('/:id', authenticateAdmin, deleteMedia);

export default router;
