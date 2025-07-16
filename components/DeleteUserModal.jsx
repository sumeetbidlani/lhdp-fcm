'use client';
import { useState } from 'react';

export default function DeleteUserModal({ userId, onDeleted }) {
  const [show, setShow] = useState(false);

  const confirmDelete = async () => {
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      setShow(false);
      onDeleted();
    } else {
      alert('Delete failed');
    }
  };

  return (
    <>
      <button onClick={() => setShow(true)} className="text-red-600 dark:text-red-400 hover:underline">
        🗑️
      </button>

      {show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-xl w-full max-w-sm text-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Delete this user?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm text-gray-600 hover:underline">
                Cancel
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
