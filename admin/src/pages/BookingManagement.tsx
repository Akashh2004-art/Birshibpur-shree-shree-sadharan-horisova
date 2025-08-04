import React, { useState } from 'react';
import { CheckIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Booking {
  id: string;
  customerName: string;
  pujaType: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  notes?: string;
}

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      customerName: 'Rahul Sharma',
      pujaType: 'Satyanarayan Puja',
      date: '2023-10-15',
      status: 'pending',
      amount: 2100,
      notes: 'Evening preferred'
    },
    {
      id: '2',
      customerName: 'Priya Patel',
      pujaType: 'Ganesh Puja',
      date: '2023-10-18',
      status: 'approved',
      amount: 1500
    },
  ]);

  const handleStatusChange = (bookingId: string, newStatus: 'approved' | 'rejected') => {
    setBookings(bookings.map(booking => 
      booking.id === bookingId ? { ...booking, status: newStatus } : booking
    ));
  };

  const handleDelete = (bookingId: string) => {
    setBookings(bookings.filter(booking => booking.id !== bookingId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="mt-10 space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Booking Management</h1>
        <button className="mt-3 sm:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          New Booking
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Puja Type</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="text-sm sm:text-base">
                  <td className="px-4 py-3 whitespace-nowrap">{booking.customerName}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{booking.pujaType}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{booking.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">₹{booking.amount}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(booking.id, 'approved')}
                          className="text-green-600 hover:text-green-900 mr-2"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(booking.id, 'rejected')}
                          className="text-red-600 hover:text-red-900 mr-2"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(booking.id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingManagement;