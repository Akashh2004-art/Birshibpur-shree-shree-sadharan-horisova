import express from 'express';
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getRecentNotes,
} from '../controllers/noteController';

const router = express.Router();

// Routes
router.get('/recent', getRecentNotes);     // GET /api/notes/recent?limit=8
router.get('/', getAllNotes);              // GET /api/notes
router.get('/:id', getNoteById);           // GET /api/notes/:id
router.post('/', createNote);              // POST /api/notes
router.put('/:id', updateNote);            // PUT /api/notes/:id
router.delete('/:id', deleteNote);         // DELETE /api/notes/:id

export default router;