import { Request, Response } from 'express';
import Note, { INote } from '../models/noteModel';

// Get all notes
export const getAllNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 }); // Latest first
    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: error.message,
    });
  }
};

// Get single note by ID
export const getNoteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);

    if (!note) {
      res.status(404).json({
        success: false,
        message: 'Note not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error: any) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch note',
      error: error.message,
    });
  }
};

// Create new note
export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, title, content } = req.body;

    // Validation
    if (!date || !title || !content) {
      res.status(400).json({
        success: false,
        message: 'Date, title, and content are required',
      });
      return;
    }

    const newNote = new Note({
      date,
      title: title.trim(),
      content: content.trim(),
    });

    const savedNote = await newNote.save();

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: savedNote,
    });
  } catch (error: any) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note',
      error: error.message,
    });
  }
};

// Update note
export const updateNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date, title, content } = req.body;

    // Validation
    if (!date || !title || !content) {
      res.status(400).json({
        success: false,
        message: 'Date, title, and content are required',
      });
      return;
    }

    const updatedNote = await Note.findByIdAndUpdate(
      id,
      {
        date,
        title: title.trim(),
        content: content.trim(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedNote) {
      res.status(404).json({
        success: false,
        message: 'Note not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: updatedNote,
    });
  } catch (error: any) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note',
      error: error.message,
    });
  }
};

// Delete note
export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedNote = await Note.findByIdAndDelete(id);

    if (!deletedNote) {
      res.status(404).json({
        success: false,
        message: 'Note not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: error.message,
    });
  }
};

// Get recent notes (for dashboard/overview)
export const getRecentNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 8;
    const notes = await Note.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id date title createdAt'); // Only get essential fields

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error: any) {
    console.error('Error fetching recent notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent notes',
      error: error.message,
    });
  }
};