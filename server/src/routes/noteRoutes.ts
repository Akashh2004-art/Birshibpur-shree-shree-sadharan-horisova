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
router.get('/recent', getRecentNotes);     
router.get('/', getAllNotes);              
router.get('/:id', getNoteById);          
router.post('/', createNote);              
router.put('/:id', updateNote);            
router.delete('/:id', deleteNote);        

export default router;