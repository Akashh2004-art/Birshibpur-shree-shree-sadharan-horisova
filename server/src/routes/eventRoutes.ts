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
  getPastEvents,
  getEventCount,
  getEventsForHome 
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

router.get('/home', getEventsForHome);

// ✅ Get upcoming events (MOVED TO TOP)
router.get('/upcoming', getUpcomingEvents);

// ✅ Get past events (MOVED TO TOP)
router.get('/history', getPastEvents);

// ✅ Get event count (MOVED TO TOP)
router.get('/count', getEventCount);

// ✅ Create event
router.post('/', upload.single('image'), createEvent);

// ✅ Get all events
router.get('/', getAllEvents);

// ✅ Update event (parameterized route AFTER specific routes)
router.put('/:id', upload.single('image'), updateEvent);

// ✅ Delete event (parameterized route AFTER specific routes)
router.delete('/:id', deleteEvent);

export default router;