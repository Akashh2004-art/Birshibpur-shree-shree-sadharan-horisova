import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, ArrowLeft, Loader } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { noteAPI, Note, CreateNoteData, UpdateNoteData } from '../api/note';

const NotePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteForm, setNoteForm] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: ''
  });

  // Load notes from MongoDB
  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedNotes = await noteAPI.getAllNotes();
      setNotes(fetchedNotes);
    } catch (error: any) {
      setError(error.message);
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation state থেকে check করি যে কি show করতে হবে
  useEffect(() => {
    // Load notes when component mounts
    loadNotes();

    const state = location.state as { showList?: boolean; showForm?: boolean } | null;
    
    if (state?.showForm) {
      // নতুন note form খুলতে হবে
      handleNewNote();
    } else if (state?.showList) {
      // Notes list দেখাতে হবে (form বন্ধ রাখি)
      setShowForm(false);
    } else {
      // Default behavior - list view
      setShowForm(false);
    }
  }, [location.state]);

  const handleNewNote = () => {
    setEditingNote(null);
    setNoteForm({
      date: new Date().toISOString().split('T')[0],
      title: '',
      content: ''
    });
    setShowForm(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteForm({
      date: note.date,
      title: note.title,
      content: note.content
    });
    setShowForm(true);
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      if (editingNote) {
        // Update existing note
        const updateData: UpdateNoteData = {
          date: noteForm.date,
          title: noteForm.title,
          content: noteForm.content
        };
        
        const updatedNote = await noteAPI.updateNote(editingNote._id, updateData);
        
        // Update local state
        setNotes(notes.map(note => 
          note._id === editingNote._id ? updatedNote : note
        ));
      } else {
        // Create new note
        const createData: CreateNoteData = {
          date: noteForm.date,
          title: noteForm.title,
          content: noteForm.content
        };
        
        const newNote = await noteAPI.createNote(createData);
        
        // Add to local state (at beginning for latest first)
        setNotes([newNote, ...notes]);
      }
      
      // Reset form and close
      setShowForm(false);
      setEditingNote(null);
      setNoteForm({ 
        date: new Date().toISOString().split('T')[0], 
        title: '', 
        content: '' 
      });

      // Show success message (you can add a notification here)
      console.log('Note saved successfully!');
      
    } catch (error: any) {
      setError(error.message);
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      setError(null);
      await noteAPI.deleteNote(id);
      
      // Remove from local state
      setNotes(notes.filter(note => note._id !== id));
      
      console.log('Note deleted successfully!');
    } catch (error: any) {
      setError(error.message);
      console.error('Error deleting note:', error);
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingNote(null);
    setNoteForm({ 
      date: new Date().toISOString().split('T')[0], 
      title: '', 
      content: '' 
    });
    setError(null);
  };

  const handleBackToOverview = () => {
    navigate('/notes-calc');
  };

  // Error Display Component
  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  );

  // Form View - Clean & Simple
  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
              disabled={saving}
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Notes
            </button>
            <h1 className="text-3xl font-light text-gray-800">
              {editingNote ? 'Edit Note' : 'New Note'}
            </h1>
          </div>

          {/* Error Display */}
          {error && <ErrorDisplay message={error} />}

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <form onSubmit={handleSubmit}>
              {/* Header Fields */}
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={noteForm.date}
                      onChange={(e) => setNoteForm({ ...noteForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={saving}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      placeholder="Enter note title"
                      value={noteForm.title}
                      onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  placeholder="Write your note content here..."
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                  disabled={saving}
                />
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  disabled={saving}
                >
                  {saving && <Loader className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Notes List View - Clean & Simple
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={handleBackToOverview}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Overview
            </button>
            <h1 className="text-3xl font-light text-gray-800">My Notes</h1>
          </div>
          
          <button
            onClick={handleNewNote}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Note
          </button>
        </div>

        {/* Error Display */}
        {error && <ErrorDisplay message={error} />}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader className="h-6 w-6 animate-spin" />
              <span>Loading notes...</span>
            </div>
          </div>
        )}

        {/* Notes Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div
                key={note._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Note Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="text-sm text-gray-500">{note.date}</div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Note Content */}
                <h3 className="font-medium text-gray-900 mb-3">{note.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-4 mb-4">
                  {note.content}
                </p>

                {/* Read More */}
                <button
                  onClick={() => handleEditNote(note)}
                  className="text-blue-600 text-sm hover:text-blue-700 font-medium"
                >
                  Read more →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && notes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
            <p className="text-gray-500 mb-6">Create your first note to get started</p>
            <button
              onClick={handleNewNote}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create First Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotePage;