import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon, MinusIcon } from '@heroicons/react/24/outline';
import { Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calculationAPI, Calculation, CalculationItem, CalculationFormData } from '../api/calculation';

const CalcPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState(false); // New state for view-only mode
  const [editingCalc, setEditingCalc] = useState<Calculation | null>(null);
  const [calcForm, setCalcForm] = useState<CalculationFormData>({
    date: new Date().toISOString().split('T')[0],
    title: '',
    items: [{ id: '1', name: '', amount: 0 }] as CalculationItem[]
  });

  // Load calculations from MongoDB
  const loadCalculations = async () => {
    try {
      setLoading(true);
      setError(null);
      const { calculations: fetchedCalculations } = await calculationAPI.getCalculations({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setCalculations(fetchedCalculations);
    } catch (error: any) {
      setError(error.message);
      console.error('Error loading calculations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load calculations on component mount
  useEffect(() => {
    loadCalculations();
  }, []);

  const calculateTotal = (items: CalculationItem[]) => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const handleNewCalc = () => {
    setEditingCalc(null);
    setViewMode(false);
    setCalcForm({
      date: new Date().toISOString().split('T')[0],
      title: '',
      items: [{ id: '1', name: '', amount: 0 }]
    });
    setShowForm(true);
  };

  const handleEditCalc = (calc: Calculation) => {
    setEditingCalc(calc);
    setViewMode(false);
    setCalcForm({
      date: calc.date,
      title: calc.title,
      items: calc.items
    });
    setShowForm(true);
  };

  // New function for view-only mode
  const handleViewCalc = (calc: Calculation) => {
    setEditingCalc(calc);
    setViewMode(true);
    setCalcForm({
      date: calc.date,
      title: calc.title,
      items: calc.items
    });
    setShowForm(true);
  };

  const addNewRow = () => {
    const newId = (calcForm.items.length + 1).toString();
    setCalcForm({
      ...calcForm,
      items: [...calcForm.items, { id: newId, name: '', amount: 0 }]
    });
  };

  const removeRow = (id: string) => {
    if (calcForm.items.length > 1) {
      setCalcForm({
        ...calcForm,
        items: calcForm.items.filter(item => item.id !== id)
      });
    }
  };

  const updateItem = (id: string, field: 'name' | 'amount', value: string | number) => {
    setCalcForm({
      ...calcForm,
      items: calcForm.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      if (editingCalc && editingCalc._id) {
        // Update existing calculation
        await calculationAPI.updateCalculation(editingCalc._id, calcForm);
      } else {
        // Create new calculation
        await calculationAPI.createCalculation(calcForm);
      }

      // Reload calculations list
      await loadCalculations();
      
      // Reset form and close
      setShowForm(false);
      setViewMode(false);
      setCalcForm({ 
        date: new Date().toISOString().split('T')[0], 
        title: '', 
        items: [{ id: '1', name: '', amount: 0 }] 
      });
    } catch (error: any) {
      setError(error.message);
      console.error('Error saving calculation:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCalc = async (calc: Calculation) => {
    if (!calc._id) return;
    
    if (window.confirm('Are you sure you want to delete this calculation? 🗑️')) {
      try {
        setError(null);
        await calculationAPI.deleteCalculation(calc._id);
        await loadCalculations(); // Reload the list
      } catch (error: any) {
        setError(error.message);
        console.error('Error deleting calculation:', error);
      }
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingCalc(null);
    setViewMode(false);
    setError(null);
    setCalcForm({ 
      date: new Date().toISOString().split('T')[0], 
      title: '', 
      items: [{ id: '1', name: '', amount: 0 }] 
    });
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

  // View-Only Mode - Only Items and Total
  if (showForm && viewMode) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Calculations
            </button>
            <h1 className="text-3xl font-light text-gray-800">
              View Calculation Details 👁️
            </h1>
          </div>

          {/* View Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header Info */}
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date 📅</label>
                  <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-800">
                    {formatDate(calcForm.date)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title 📝</label>
                  <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-800">
                    {calcForm.title}
                  </div>
                </div>
              </div>
            </div>

            {/* Calculation Items - View Only */}
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Items 📊</h3>
              
              {calcForm.items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800">
                      {item.name}
                    </div>
                  </div>
                  
                  <div>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-right text-gray-800">
                      ₹{item.amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}

              {/* Total Row */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <div className="px-3 py-2 bg-green-100 rounded-md text-center font-medium text-green-800">
                      Total Amount 💰
                    </div>
                  </div>
                  
                  <div>
                    <div className="px-3 py-2 bg-green-50 border-2 border-green-200 rounded-md text-right font-bold text-green-700 text-xl">
                      ₹{calculateTotal(calcForm.items).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Close 📋
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form View - Clean & Simple (unchanged for edit/create)
  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Calculations
            </button>
            <h1 className="text-3xl font-light text-gray-800">
              {editingCalc ? 'Edit Calculation ✏️' : 'New Calculation ➕'}
            </h1>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="text-red-600 text-sm">❌ {error}</div>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <form onSubmit={handleSubmit}>
              {/* Header Fields */}
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date 📅</label>
                    <input
                      type="date"
                      value={calcForm.date}
                      onChange={(e) => setCalcForm({ ...calcForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={saving}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title 📝</label>
                    <input
                      type="text"
                      placeholder="Enter calculation title"
                      value={calcForm.title}
                      onChange={(e) => setCalcForm({ ...calcForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={addNewRow}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Row
                    </button>
                  </div>
                </div>
              </div>

              {/* Calculation Items */}
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Items 📊</h3>
                
                {calcForm.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-6">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={saving}
                      />
                    </div>
                    
                    <div className="md:col-span-4">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={item.amount || ''}
                        onChange={(e) => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={saving}
                      />
                    </div>

                    <div className="md:col-span-2 flex gap-2">
                      <button
                        type="button"
                        onClick={addNewRow}
                        disabled={saving}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => removeRow(item.id)}
                        disabled={calcForm.items.length <= 1 || saving}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Total Row */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-6">
                      <div className="px-3 py-2 bg-gray-100 rounded-md text-center font-medium text-gray-700">
                        Total 💰
                      </div>
                    </div>
                    
                    <div className="md:col-span-4">
                      <div className="px-3 py-2 bg-green-50 border-2 border-green-200 rounded-md text-right font-bold text-green-700 text-lg">
                        ₹{calculateTotal(calcForm.items).toLocaleString()}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      {/* Empty space for alignment */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Calculation'} ✅
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Calculations List View - Clean & Simple
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => navigate('/notes-calc')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Overview
            </button>
            <h1 className="text-3xl font-light text-gray-800">My Calculations 📊</h1>
          </div>
          
          <button
            onClick={handleNewCalc}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <PlusIcon className="h-5 w-5" />
            New Calculation
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-600 text-sm">❌ {error}</div>
            <button
              onClick={loadCalculations}
              className="mt-2 text-red-700 hover:text-red-800 text-sm font-medium"
            >
              Try Again 🔄
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader className="h-6 w-6 animate-spin" />
              <span>Loading calculations... ⏳</span>
            </div>
          </div>
        )}

        {/* Calculations Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calculations.map((calc) => (
              <div
                key={calc._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Calculation Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="text-sm text-gray-500">📅 {formatDate(calc.date)}</div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditCalc(calc)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit calculation"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCalc(calc)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete calculation"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Calculation Title */}
                <h3 className="font-medium text-gray-900 mb-4">{calc.title}</h3>

                {/* Total Amount */}
                <div className="text-2xl font-bold text-green-600 mb-4">
                  ₹{calc.total.toLocaleString()}
                </div>

                {/* Calculation Items Preview */}
                <div className="bg-gray-50 rounded-md p-3 space-y-2">
                  {calc.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate">{item.name}</span>
                      <span className="text-gray-800 font-medium">₹{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {calc.items.length > 3 && (
                    <div className="text-xs text-gray-400 text-center pt-1">
                      +{calc.items.length - 3} more items
                    </div>
                  )}
                </div>

                {/* View Details - Updated to use handleViewCalc */}
                <button
                  onClick={() => handleViewCalc(calc)}
                  className="mt-4 text-green-600 text-sm hover:text-green-700 font-medium"
                >
                  View details → 👁️
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && calculations.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No calculations yet 📊</h3>
            <p className="text-gray-500 mb-6">Create your first calculation to get started</p>
            <button
              onClick={handleNewCalc}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Create First Calculation ➕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalcPage;