'use client';
import { useState } from 'react';

export default function AddUserModal({ onUserAdded }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('fcm-user');

  const handleSubmit = async () => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (res.ok) {
      setShow(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('fcm-user');
      onUserAdded();
    } else {
      alert('Failed to add user');
    }
  };

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
      >
        ➕ Add User
      </button>

      {show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-xl w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Add New User</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-900 dark:text-white"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-900 dark:text-white"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-900 dark:text-white"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <select
                className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-900 dark:text-white"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="fcm-manager">FCM Manager</option>
                <option value="fcm-user">FCM User</option>
              </select>
            </div>

            <div className="flex justify-end mt-6 space-x-2">
              <button
                onClick={() => setShow(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
