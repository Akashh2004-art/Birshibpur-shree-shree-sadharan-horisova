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
  photoURL?: string; // ✅ Photo URL field added
  authProvider?: 'email' | 'phone' | 'google'; // ✅ Auth provider for context
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // FIXED: Updated endpoint path after app.ts routes change
        const response = await api.get('/user-auth/get-users'); // Changed from /auth/get-users
        
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
          setError('Admin access is required');
        } else if (error.response?.status === 401) {
          setError('Authorization required - login');
        } else if (error.response?.status === 404) {
          setError('Authorization required - LoginUser Data API not found');
        } else {
          const errorMsg = error.response?.data?.message || 'There was a problem loading data from the server.';
          setError(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // ✅ User avatar component with fallback
  const UserAvatar = ({ user }: { user: User }) => {
    const [imageError, setImageError] = useState(false);
    
    // Generate initials for fallback
    const getInitials = (name?: string, email?: string) => {
      if (name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      }
      if (email) {
        return email[0].toUpperCase();
      }
      return 'U';
    };

    const handleImageError = () => {
      setImageError(true);
    };

    // If has photoURL and no error, show image
    if (user.photoURL && !imageError) {
      return (
        <img
          src={user.photoURL}
          alt={user.name || user.email || 'User'}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
          onError={handleImageError}
        />
      );
    }

    // Fallback to initials with gradient
    return (
      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center ring-2 ring-white shadow-sm">
        <span className="text-white font-semibold text-sm">
          {getInitials(user.name, user.email)}
        </span>
      </div>
    );
  };

  // ✅ Mobile user avatar (larger)
  const MobileUserAvatar = ({ user }: { user: User }) => {
    const [imageError, setImageError] = useState(false);
    
    const getInitials = (name?: string, email?: string) => {
      if (name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      }
      if (email) {
        return email[0].toUpperCase();
      }
      return 'U';
    };

    const handleImageError = () => {
      setImageError(true);
    };

    if (user.photoURL && !imageError) {
      return (
        <img
          src={user.photoURL}
          alt={user.name || user.email || 'User'}
          className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-lg"
          onError={handleImageError}
        />
      );
    }

    return (
      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center ring-2 ring-white shadow-lg">
        <span className="text-white font-semibold text-base">
          {getInitials(user.name, user.email)}
        </span>
      </div>
    );
  };

  // ✅ Provider badge component
  const ProviderBadge = ({ provider }: { provider?: string }) => {
    if (!provider) return null;

    const badges = {
      google: { icon: '🔍', color: 'bg-red-100 text-red-800', text: 'Google' },
      phone: { icon: '📱', color: 'bg-green-100 text-green-800', text: 'Phone' },
      email: { icon: '📧', color: 'bg-blue-100 text-blue-800', text: 'Email' }
    };

    const badge = badges[provider as keyof typeof badges];
    if (!badge) return null;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <span className="mr-1">{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

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
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      <UserIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p>No users found.</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserAvatar user={user} />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phone || 'No phone'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ProviderBadge provider={user.authProvider} />
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
              <p className="text-gray-500">No users found.</p>
            </div>
          ) : (
            users.map((user, index) => (
              <div key={user._id}>
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-3">
                    <MobileUserAvatar user={user} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-900">
                          {user.name || 'নাম নেই'}
                        </h3>
                        <ProviderBadge provider={user.authProvider} />
                      </div>
                      <p className="text-sm text-gray-500">{user.email || 'No Email'}</p>
                      <p className="text-sm text-gray-700">📞 {user.phone || 'No Phone'}</p>
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