import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  createEvent,
  getAllEvents,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getPastEvents 
} from '../controllers/eventController';

const router = express.Router();

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(null, false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ✅ Create event
router.post('/', upload.single('image'), createEvent);

// ✅ Get all events
router.get('/', getAllEvents);

// ✅ Update event
router.put('/:id', upload.single('image'), updateEvent);

// ✅ Delete event
router.delete('/:id', deleteEvent);


router.get('/upcoming', getUpcomingEvents);

router.get('/history', getPastEvents); // 👈 New route


export default router;
