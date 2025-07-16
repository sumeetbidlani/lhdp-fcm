'use client';

import { useState } from 'react';

export default function CloseComplaintForm({ complaintId, onClosed }) {
  const [form, setForm] = useState({
    action_taken: '',
    outcome: '',
    complainant_informed: false,
    notification_method: '',
    closing_notes: '',
    closed_by: 1 // TODO: Replace with auth user ID
  });

  const handleSubmit = async () => {
    const res = await fetch(`/api/complaints/${complaintId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (data.success) {
      alert('Complaint closed successfully.');
      onClosed?.();
    } else {
      alert('Failed to close: ' + data.error);
    }
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded shadow border">
      <h2 className="text-xl font-semibold text-gray-800">Close Complaint</h2>

      <label className="block">
        <span className="text-gray-700">Action Taken</span>
        <textarea
          className="w-full border mt-1 p-2 rounded"
          rows={3}
          value={form.action_taken}
          onChange={(e) => setForm({ ...form, action_taken: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="text-gray-700">Outcome</span>
        <select
          className="w-full border mt-1 p-2 rounded"
          value={form.outcome}
          onChange={(e) => setForm({ ...form, outcome: e.target.value })}
        >
          <option value="">Select Outcome</option>
          <option value="resolved">Resolved</option>
          <option value="referred">Referred to Other Department</option>
          <option value="no_action">No Action Required</option>
          <option value="not_resolved">Could Not Be Resolved</option>
        </select>
      </label>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={form.complainant_informed}
          onChange={(e) => setForm({ ...form, complainant_informed: e.target.checked })}
        />
        <span className="text-gray-700">Complainant Informed</span>
      </label>

      {form.complainant_informed && (
        <label className="block">
          <span className="text-gray-700">Notification Method</span>
          <select
            className="w-full border mt-1 p-2 rounded"
            value={form.notification_method}
            onChange={(e) => setForm({ ...form, notification_method: e.target.value })}
          >
            <option value="">Select</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="call">Phone Call</option>
            <option value="in_person">In Person</option>
          </select>
        </label>
      )}

      <label className="block">
        <span className="text-gray-700">Closing Notes</span>
        <textarea
          className="w-full border mt-1 p-2 rounded"
          rows={2}
          value={form.closing_notes}
          onChange={(e) => setForm({ ...form, closing_notes: e.target.value })}
        />
      </label>

      <div className="flex justify-end">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={handleSubmit}
        >
          Close Complaint
        </button>
      </div>
    </div>
  );
}
