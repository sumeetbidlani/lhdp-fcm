'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import AddUserModal from '@/components/AddUserModal';
import EditUserModal from '@/components/EditUserModal';
import DeleteUserModal from '@/components/DeleteUserModal';
import ProtectedView from '@/components/ProtectedView';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setError('');
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (err) {
      setError('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();

    const token = document.cookie.split('; ').find(t => t.startsWith('token='));
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        fetch(`/api/sidebar?userId=${decoded.id}`)
          .then(res => res.json())
          .then(data => setPermissions(data.permissions || []));
      } catch (e) {
        console.error('Failed to decode token', e);
      }
    }
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-5">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">User Management</h2>
        <ProtectedView permissions={permissions} required="manage_users">
          <AddUserModal onUserAdded={loadUsers} />
        </ProtectedView>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
          {error}
        </div>
      )}

      <div className="overflow-auto rounded border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm text-gray-800 dark:text-gray-200">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Created By</th>
              <th className="p-3 text-left">Created At</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr
                key={user.id}
                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3 capitalize">{user.role || 'N/A'}</td>
                <td className="p-3">{user.created_by_name || '—'}</td>
                <td className="p-3">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-center space-x-1">
                  <EditUserModal user={user} onUpdated={loadUsers} />
                  <DeleteUserModal userId={user.id} onDeleted={loadUsers} />
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500 dark:text-gray-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">Loading users...</div>
        )}
      </div>
    </div>
  );
}
