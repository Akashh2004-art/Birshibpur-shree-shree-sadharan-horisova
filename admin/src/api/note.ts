import axios from './axios';

// Types
export interface Note {
  _id: string;
  date: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteData {
  date: string;
  title: string;
  content: string;
}

export interface UpdateNoteData {
  date: string;
  title: string;
  content: string;
}

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: string;
}

// Note API functions
export const noteAPI = {
  // Get all notes
  getAllNotes: async (): Promise<Note[]> => {
    try {
      const response = await axios.get<ApiResponse<Note[]>>('/notes');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch notes');
    }
  },

  // Get recent notes (for dashboard)
  getRecentNotes: async (limit: number = 8): Promise<Note[]> => {
    try {
      const response = await axios.get<ApiResponse<Note[]>>(`/notes/recent?limit=${limit}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching recent notes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch recent notes');
    }
  },

  // Get note by ID
  getNoteById: async (id: string): Promise<Note | null> => {
    try {
      const response = await axios.get<ApiResponse<Note>>(`/notes/${id}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching note:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch note');
    }
  },

  // Create new note
  createNote: async (noteData: CreateNoteData): Promise<Note> => {
    try {
      const response = await axios.post<ApiResponse<Note>>('/notes', noteData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to create note');
    } catch (error: any) {
      console.error('Error creating note:', error);
      throw new Error(error.response?.data?.message || 'Failed to create note');
    }
  },

  // Update note
  updateNote: async (id: string, noteData: UpdateNoteData): Promise<Note> => {
    try {
      const response = await axios.put<ApiResponse<Note>>(`/notes/${id}`, noteData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to update note');
    } catch (error: any) {
      console.error('Error updating note:', error);
      throw new Error(error.response?.data?.message || 'Failed to update note');
    }
  },

  // Delete note
  deleteNote: async (id: string): Promise<void> => {
    try {
      const response = await axios.delete<ApiResponse<void>>(`/notes/${id}`);
      if (!response.data.success) {
        throw new Error('Failed to delete note');
      }
    } catch (error: any) {
      console.error('Error deleting note:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete note');
    }
  },
};