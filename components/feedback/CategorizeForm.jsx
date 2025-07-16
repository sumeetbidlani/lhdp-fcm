'use client';
import { useState } from 'react';

export default function CategorizeTab({ onSubmit }) {
  const [form, setForm] = useState({
    validity: 'valid',
    type: 'request',
    streams: [],
    priority: 'high',
    action_required: '',
    assigned_to: '',
    due_date: '',
  });

  const toggleStream = (value) => {
    setForm((prev) => ({
      ...prev,
      streams: prev.streams.includes(value)
        ? prev.streams.filter((v) => v !== value)
        : [...prev.streams, value],
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (onSubmit) onSubmit(form);
  };

  return (
    <div className="bg-white p-6 rounded shadow-md space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Categorize Complaint</h3>
      <p className="text-sm text-gray-500">Categorize this complaint to process it further.</p>

      {/* Contact Validity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Validity</label>
        <div className="flex gap-4">
          {['valid', 'invalid', 'anonymous'].map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="validity"
                value={v}
                checked={form.validity === v}
                onChange={handleChange}
              />
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded bg-white"
        >
          <option value="request">Request for Assistance</option>
          <option value="positive">Positive Feedback</option>
          <option value="minor">Minor Dissatisfaction</option>
          <option value="major">Major Dissatisfaction</option>
          <option value="suggestion">Suggestion for Improvement</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Streams */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Streams (Select all that apply)</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            'Program Quality',
            'Staff Conduct',
            'Partner Organization',
            'Safeguarding',
            'Fraud/Corruption',
            'Other',
          ].map((label) => (
            <label key={label} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                value={label}
                checked={form.streams.includes(label)}
                onChange={() => toggleStream(label)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
        <select
          name="priority"
          value={form.priority}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded bg-white"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Action Required */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Action Required</label>
        <textarea
          name="action_required"
          value={form.action_required}
          onChange={handleChange}
          rows={4}
          className="w-full p-2 border border-gray-300 rounded bg-white"
          placeholder="Describe the action required to address this complaint..."
        />
      </div>

      {/* Assign To */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
        <select
          name="assigned_to"
          value={form.assigned_to}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded bg-white"
        >
          <option value="">Select Staff Member</option>
          <option value="1">Imran Malik (Health Project Manager)</option>
          <option value="2">Ayesha Khan (Education PM)</option>
          <option value="3">Tariq Ahmed (WASH Manager)</option>
        </select>
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
        <input
          type="date"
          name="due_date"
          value={form.due_date}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded bg-white"
        />
        <p className="text-xs text-gray-500 mt-1">Default: 7 days from today</p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save & Set to In Progress
        </button>
      </div>
    </div>
  );
}
