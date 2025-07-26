import React, { useState, useEffect } from 'react';
import { UserIcon } from '@heroicons/react/24/outline'; // UserIcon কেবল রাখা হয়েছে
import api from '../api/axios'; // আপনার API ক্লায়েন্ট

interface User {
  _id: string; // MongoDB ID হিসেবে _id ব্যবহার
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive'; // status রাখা হয়েছে (যদি ভবিষ্যতে প্রয়োজন হয়)
  createdAt: Date;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/user/get-users'); // সার্�ভার থেকে ডেটা ফেচ
        setUsers(response.data);
      } catch (error) {
        console.error('ইউজার ডেটা লোড করতে সমস্যা:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-6 p-4 md:p-6">
      <div className="flex flex-col items-start justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <h1 className="text-2xl font-semibold text-gray-900">User Registry</h1>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
          Add User
        </button>
      </div>

      {/* Small Box for User Count */}
      <div className="bg-gray-100 p-3 rounded-lg shadow-md w-full max-w-xs text-center">
        <p className="text-sm font-medium text-gray-700">
          Total Users: {users.length}
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Desktop View with Invisible Scrollbar but Scrollable */}
        <div className="hidden md:block">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View with Smaller Box and Divider Between Users */}
        <div className="md:hidden space-y-3 p-3">
          {users.map((user, index) => (
            <div key={user._id}>
              <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-500">{user.email || 'N/A'}</p>
                    <p className="text-sm text-gray-700">Phone: {user.phone || 'N/A'}</p>
                    <p className="text-sm text-gray-500">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              {/* Divider between users (except for the last user) */}
              {index < users.length - 1 && (
                <div className="border-t border-gray-200 my-3"></div> // Horizontal line between users
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;