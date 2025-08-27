import React, { useState, useEffect } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('🔍 Fetching users...');
        
        // FIXED: Updated endpoint path after app.ts routes change
        const response = await api.get('/user-auth/get-users'); // Changed from /auth/get-users
        
        console.log('✅ Users fetched successfully:', response.data);
        
        // Check if response has the expected structure
        if (Array.isArray(response.data)) {
          setUsers(response.data);
        } else if (response.data.users && Array.isArray(response.data.users)) {
          setUsers(response.data.users);
        } else if (response.data.success && response.data.data) {
          setUsers(response.data.data);
        } else {
          console.warn('⚠️ Unexpected response structure:', response.data);
          setUsers([]);
        }
        
        setError('');
      } catch (error: any) {
        console.error('❌ Error fetching users:', error);
        
        if (error.response?.status === 403) {
          setError('অ্যাডমিন অ্যাক্সেস প্রয়োজন');
        } else if (error.response?.status === 401) {
          setError('অনুমোদন প্রয়োজন - লগইন করুন');
        } else if (error.response?.status === 404) {
          setError('ইউজার ডেটা API পাওয়া যায়নি');
        } else {
          const errorMsg = error.response?.data?.message || 'সার্ভার থেকে ডেটা লোড করতে সমস্যা হয়েছে';
          setError(errorMsg);
        }
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

  // Error State Handling
  if (error) {
    return (
      <div className="mt-10 space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-semibold text-gray-900">User Registry</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Users</h3>
              <p className="text-red-600 mt-1">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
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

      {/* User Count Display */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg shadow-md w-full max-w-xs text-center border border-blue-200">
        <div className="flex items-center justify-center space-x-2">
          <UserIcon className="h-5 w-5 text-blue-600" />
          <p className="text-lg font-semibold text-blue-800">
            Total Users: <span className="text-2xl">{users.length}</span>
          </p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Desktop View */}
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
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      <UserIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p>কোনো ইউজার পাওয়া যায়নি</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'নাম নেই'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email || 'ইমেইল নেই'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phone || 'ফোন নেই'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('en-US')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3 p-3">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">কোনো ইউজার পাওয়া যায়নি</p>
            </div>
          ) : (
            users.map((user, index) => (
              <div key={user._id}>
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        {user.name || 'নাম নেই'}
                      </h3>
                      <p className="text-sm text-gray-500">{user.email || 'ইমেইল নেই'}</p>
                      <p className="text-sm text-gray-700">📞 {user.phone || 'ফোন নেই'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-gray-500">
                          📅 {new Date(user.createdAt).toLocaleDateString('en-US')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {index < users.length - 1 && (
                  <div className="border-t border-gray-200 my-3"></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;