'use client';
import { useState } from 'react';

export default function ProgressForm({ complaintId, onCompleted }) {
  const [form, setForm] = useState({
    type: 'request',
    priority: 'high',
    action_required: '',
    assigned_to: '',
    due_date: '',
    contact_validity: 'valid',
    streams: [],
    updated_by: 1 // get from auth cookie/session ideally
  });

  const handleSubmit = async () => {
    const res = await fetch(`/api/complaints/${complaintId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      alert('Complaint updated to In Progress!');
      if (onCompleted) onCompleted();
    } else {
      alert('Failed: ' + data.error);
    }
  };

  const toggleStream = (stream) => {
    setForm((prev) => ({
      ...prev,
      streams: prev.streams.includes(stream)
        ? prev.streams.filter((s) => s !== stream)
        : [...prev.streams, stream]
    }));
  };

  return (
    <div className="p-4 border rounded bg-white shadow space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Progress Complaint</h2>

      <label className="block">
        <span className="text-gray-700">Complaint Type</span>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="mt-1 block w-full border px-2 py-1 rounded"
        >
          <option value="request">Request</option>
          <option value="positive">Positive</option>
          <option value="minor">Minor Dissatisfaction</option>
          <option value="major">Major Dissatisfaction</option>
          <option value="suggestion">Suggestion</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label className="block">
        <span className="text-gray-700">Priority</span>
        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
          className="mt-1 block w-full border px-2 py-1 rounded"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </label>

      <label className="block">
        <span className="text-gray-700">Assign To (User ID)</span>
        <input
          type="number"
          className="mt-1 block w-full border px-2 py-1 rounded"
          value={form.assigned_to}
          onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="text-gray-700">Due Date</span>
        <input
          type="date"
          className="mt-1 block w-full border px-2 py-1 rounded"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="text-gray-700">Action Required</span>
        <textarea
          className="mt-1 block w-full border px-2 py-1 rounded"
          rows="3"
          value={form.action_required}
          onChange={(e) => setForm({ ...form, action_required: e.target.value })}
        />
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium">Streams</p>
        {['program_quality', 'staff_conduct', 'partner_org', 'safeguarding', 'fraud', 'other'].map(stream => (
          <label key={stream} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.streams.includes(stream)}
              onChange={() => toggleStream(stream)}
            />
            <span className="capitalize">{stream.replace('_', ' ')}</span>
          </label>
        ))}
      </div>

      <div className="mt-4">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Set to In Progress
        </button>
      </div>
    </div>
  );
}
