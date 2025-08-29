import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Loader } from 'lucide-react';
import { noteAPI, Note } from '../api/note';
import { calculationAPI, Calculation } from '../api/calculation';

const NotesAndCalculations = () => {
  const navigate = useNavigate();
  
  // State for notes (real data from MongoDB)
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);

  // State for calculations (real data from MongoDB)
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [calculationsLoading, setCalculationsLoading] = useState(true);
  const [calculationsError, setCalculationsError] = useState<string | null>(null);

  // Load recent notes from MongoDB
  const loadRecentNotes = async () => {
    try {
      setNotesLoading(true);
      setNotesError(null);
      const recentNotes = await noteAPI.getRecentNotes(8); // Load 8 recent notes
      setNotes(recentNotes);
    } catch (error: any) {
      setNotesError(error.message);
      console.error('Error loading recent notes:', error);
    } finally {
      setNotesLoading(false);
    }
  };

  // Load recent calculations from MongoDB
  const loadRecentCalculations = async () => {
    try {
      setCalculationsLoading(true);
      setCalculationsError(null);
      const recentCalculations = await calculationAPI.getRecentCalculations(8); // Load 8 recent calculations
      setCalculations(recentCalculations);
    } catch (error: any) {
      setCalculationsError(error.message);
      console.error('Error loading recent calculations:', error);
    } finally {
      setCalculationsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadRecentNotes();
    loadRecentCalculations();
  }, []);

  // Navigate to notes list view (not form)
  const handleViewAllNotes = () => {
    navigate('/notes', { state: { showList: true } });
  };

  const handleViewAllCalculations = () => {
    navigate('/calc', { state: { showList: true } });
  };

  const handleNewNote = () => {
    navigate('/notes', { state: { showForm: true } });
  };

  const handleNewCalculation = () => {
    navigate('/calc', { state: { showForm: true } });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-800 mb-2">Notes & Calculations</h1>
          <p className="text-gray-500">Organize your thoughts and manage your finances</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Notes Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-medium text-gray-800">Notes</h2>
              <button
                onClick={handleNewNote}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                <PlusIcon className="h-4 w-4" />
                New Note
              </button>
            </div>

            {/* Scrollable Notes List */}
            <div className="h-80 overflow-y-auto divide-y divide-gray-100">
              {notesLoading && (
                <div className="flex justify-center items-center h-full">
                  <div className="flex items-center gap-3 text-gray-500">
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Loading notes...</span>
                  </div>
                </div>
              )}

              {notesError && (
                <div className="px-6 py-4 text-center">
                  <div className="text-red-600 text-sm">{notesError}</div>
                  <button
                    onClick={loadRecentNotes}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!notesLoading && !notesError && notes.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">No notes yet</p>
                  <button
                    onClick={handleNewNote}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Create your first note →
                  </button>
                </div>
              )}

              {!notesLoading && !notesError && notes.map((note) => (
                <div
                  key={note._id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={handleViewAllNotes}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1 truncate">{note.title}</h3>
                      <p className="text-sm text-gray-500">{formatDate(note.date)}</p>
                      {note.content && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {note.content.substring(0, 100)}
                          {note.content.length > 100 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={handleViewAllNotes}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View all notes →
              </button>
            </div>
          </div>

          {/* Calculations Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-medium text-gray-800">Calculations</h2>
              <button
                onClick={handleNewCalculation}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
              >
                <PlusIcon className="h-4 w-4" />
                New Calculation
              </button>
            </div>

            {/* Scrollable Calculations List */}
            <div className="h-80 overflow-y-auto divide-y divide-gray-100">
              {calculationsLoading && (
                <div className="flex justify-center items-center h-full">
                  <div className="flex items-center gap-3 text-gray-500">
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Loading calculations...</span>
                  </div>
                </div>
              )}

              {calculationsError && (
                <div className="px-6 py-4 text-center">
                  <div className="text-red-600 text-sm">{calculationsError}</div>
                  <button
                    onClick={loadRecentCalculations}
                    className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!calculationsLoading && !calculationsError && calculations.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">No calculations yet</p>
                  <button
                    onClick={handleNewCalculation}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Create your first calculation →
                  </button>
                </div>
              )}

              {!calculationsLoading && !calculationsError && calculations.map((calc) => (
                <div
                  key={calc._id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={handleViewAllCalculations}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">{calc.title}</h3>
                      <p className="text-sm text-gray-500">{formatDate(calc.date)}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">₹{calc.total.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={handleViewAllCalculations}
                className="text-green-600 hover:text-green-700 font-medium text-sm"
              >
                View all calculations →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesAndCalculations;