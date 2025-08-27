import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon, MinusIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface CalculationItem {
  id: string;
  name: string;
  amount: number;
}

interface Calculation {
  id: string;
  date: string;
  title: string;
  items: CalculationItem[];
  total: number;
}

const CalcPage = () => {
  const navigate = useNavigate();
  const [calculations, setCalculations] = useState<Calculation[]>([
    { 
      id: '1', 
      date: new Date().toISOString().split('T')[0], 
      title: 'Monthly Budget',
      items: [
        { id: '1', name: 'Rent', amount: 8000 },
        { id: '2', name: 'Food', amount: 4000 },
        { id: '3', name: 'Utilities', amount: 2000 },
        { id: '4', name: 'Others', amount: 1000 }
      ],
      total: 15000
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingCalc, setEditingCalc] = useState<Calculation | null>(null);
  const [calcForm, setCalcForm] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    items: [{ id: '1', name: '', amount: 0 }] as CalculationItem[]
  });

  const calculateTotal = (items: CalculationItem[]) => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const handleNewCalc = () => {
    setEditingCalc(null);
    setCalcForm({
      date: new Date().toISOString().split('T')[0],
      title: '',
      items: [{ id: '1', name: '', amount: 0 }]
    });
    setShowForm(true);
  };

  const handleEditCalc = (calc: Calculation) => {
    setEditingCalc(calc);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const total = calculateTotal(calcForm.items);
    
    if (editingCalc) {
      setCalculations(calculations.map(calc => 
        calc.id === editingCalc.id 
          ? { 
              ...calc, 
              date: calcForm.date,
              title: calcForm.title,
              items: calcForm.items,
              total: total
            }
          : calc
      ));
    } else {
      const newCalc: Calculation = {
        id: Date.now().toString(),
        date: calcForm.date,
        title: calcForm.title,
        items: calcForm.items,
        total: total
      };
      setCalculations([newCalc, ...calculations]);
    }
    
    setShowForm(false);
    setCalcForm({ date: new Date().toISOString().split('T')[0], title: '', items: [{ id: '1', name: '', amount: 0 }] });
  };

  const handleDeleteCalc = (id: string) => {
    if (window.confirm('Are you sure you want to delete this calculation?')) {
      setCalculations(calculations.filter(calc => calc.id !== id));
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingCalc(null);
    setCalcForm({ date: new Date().toISOString().split('T')[0], title: '', items: [{ id: '1', name: '', amount: 0 }] });
  };

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
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Calculations
            </button>
            <h1 className="text-3xl font-light text-gray-800">
              {editingCalc ? 'Edit Calculation' : 'New Calculation'}
            </h1>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <form onSubmit={handleSubmit}>
              {/* Header Fields */}
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={calcForm.date}
                      onChange={(e) => setCalcForm({ ...calcForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      placeholder="Enter calculation title"
                      value={calcForm.title}
                      onChange={(e) => setCalcForm({ ...calcForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={addNewRow}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Row
                    </button>
                  </div>
                </div>
              </div>

              {/* Calculation Items */}
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Items</h3>
                
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
                      />
                    </div>

                    <div className="md:col-span-2 flex gap-2">
                      <button
                        type="button"
                        onClick={addNewRow}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => removeRow(item.id)}
                        disabled={calcForm.items.length <= 1}
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
                        Total
                      </div>
                    </div>
                    
                    <div className="md:col-span-4">
                      <div className="px-3 py-2 bg-green-50 border-2 border-green-200 rounded-md text-right font-bold text-green-700 text-lg">
                        {calculateTotal(calcForm.items).toLocaleString()}
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
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Save Calculation
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
            <h1 className="text-3xl font-light text-gray-800">My Calculations</h1>
          </div>
          
          <button
            onClick={handleNewCalc}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            New Calculation
          </button>
        </div>

        {/* Calculations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calculations.map((calc) => (
            <div
              key={calc.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Calculation Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm text-gray-500">{calc.date}</div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditCalc(calc)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCalc(calc.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Calculation Title */}
              <h3 className="font-medium text-gray-900 mb-4">{calc.title}</h3>

              {/* Total Amount */}
              <div className="text-2xl font-bold text-green-600 mb-4">
                {calc.total.toLocaleString()}
              </div>

              {/* Calculation Items Preview */}
              <div className="bg-gray-50 rounded-md p-3 space-y-2">
                {calc.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate">{item.name}</span>
                    <span className="text-gray-800 font-medium">{item.amount.toLocaleString()}</span>
                  </div>
                ))}
                {calc.items.length > 3 && (
                  <div className="text-xs text-gray-400 text-center pt-1">
                    +{calc.items.length - 3} more items
                  </div>
                )}
              </div>

              {/* View Details */}
              <button
                onClick={() => handleEditCalc(calc)}
                className="mt-4 text-green-600 text-sm hover:text-green-700 font-medium"
              >
                View details →
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {calculations.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No calculations yet</h3>
            <p className="text-gray-500 mb-6">Create your first calculation to get started</p>
            <button
              onClick={handleNewCalc}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Create First Calculation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalcPage;