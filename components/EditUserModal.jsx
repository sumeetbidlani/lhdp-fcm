'use client';
import { useState } from 'react';

export default function EditUserModal({ user, onUpdated }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);

  const handleUpdate = async () => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role }),
    });

    if (res.ok) {
      setShow(false);
      onUpdated();
    } else {
      alert('Update failed');
    }
  };

  return (
    <>
      <button onClick={() => setShow(true)} className="text-blue-600 dark:text-blue-400 hover:underline">
        ✏️
      </button>

      {show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-xl w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Edit User</h2>
            <div className="space-y-3">
              <input
                type="text"
                className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-900 dark:text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="email"
                className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-900 dark:text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <select
                className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-900 dark:text-white"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="fcm-manager">FCM Manager</option>
                <option value="fcm-user">FCM User</option>
              </select>
            </div>
            <div className="flex justify-end mt-6 space-x-2">
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm text-gray-600 hover:underline">
                Cancel
              </button>
              <button onClick={handleUpdate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
