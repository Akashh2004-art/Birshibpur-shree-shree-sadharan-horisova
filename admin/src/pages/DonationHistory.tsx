import React, { useState } from 'react';

interface Donation {
  id: string;
  donorName: string;
  amount: number;
  date: string;
  purpose: string;
  paymentMethod: string;
}

const DonationHistory: React.FC = () => {
  const [donations] = useState<Donation[]>([
    {
      id: '1',
      donorName: 'Amit Kumar',
      amount: 5100,
      date: '2023-09-15',
      purpose: 'Temple Development',
      paymentMethod: 'UPI'
    },
    {
      id: '2',
      donorName: 'Sneha Reddy',
      amount: 2100,
      date: '2023-09-14',
      purpose: 'Annadanam',
      paymentMethod: 'Card'
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredDonations = donations.filter((donation) =>
    Object.values(donation).some((value) =>
      value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const totalDonations = filteredDonations.reduce((sum, donation) => sum + donation.amount, 0);

  return (
    <div className="mt-10 space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-gray-900 text-center">Donation History</h1>

      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-lg font-medium text-gray-900">Total Donations</h2>
        <p className="text-3xl font-bold text-indigo-600">₹{totalDonations.toLocaleString()}</p>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search donations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Donation Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDonations.length > 0 ? (
                filteredDonations.map((donation) => (
                  <tr key={donation.id} className="text-sm">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900">{donation.donorName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900">₹{donation.amount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900">{donation.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900">{donation.purpose}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900">{donation.paymentMethod}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">No matching records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DonationHistory;