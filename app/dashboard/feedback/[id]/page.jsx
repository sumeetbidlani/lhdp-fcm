"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { BadgeCheck, Eye, Loader2 } from "lucide-react";

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/feedback/${id}`)
      .then(res => res.json())
      .then(data => {
        setComplaint(data.complaint);
        setLogs(data.logs);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="p-6 flex items-center justify-center text-gray-600 dark:text-gray-300"><Loader2 className="animate-spin mr-2" />Loading...</div>;
  }

  if (!complaint) {
    return <div className="p-6 text-red-600 dark:text-red-400">Complaint not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">📄 Complaint Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Item label="Code" value={complaint.complaint_code} />
          <Item label="Project" value={complaint.project} />
          <Item label="Source" value={complaint.source} />
          <Item label="Type" value={complaint.type} />
          <Item label="Date Received" value={complaint.date_received} />
          <Item label="Location" value={complaint.location} />
          <Item label="Contact Name" value={complaint.anonymous ? "Anonymous" : complaint.contact_name} />
          <Item label="Phone" value={complaint.anonymous ? "Hidden" : complaint.contact_phone} />
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Summary (EN):</p>
          <p className="text-gray-800 dark:text-gray-200 text-sm">{complaint.summary_en}</p>
        </div>

        <div className="mt-2">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Summary (UR):</p>
          <p className="text-gray-800 dark:text-gray-200 text-sm" dir="rtl">{complaint.summary_ur}</p>
        </div>

        {complaint.attachments?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">📎 Attachments</h3>
            <ul className="list-disc list-inside space-y-1">
              {complaint.attachments.map((a, i) => (
                <li key={i}>
                  <a href={`/uploads/${a.filename}`} target="_blank" className="text-blue-600 hover:underline dark:text-blue-400">{a.filename}</a>
                  {a.description && <span className="ml-2 text-gray-500 dark:text-gray-400">({a.description})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold ${statusClass(complaint.status)}`}>
            <BadgeCheck className="w-4 h-4" /> {complaint.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">🕓 Timeline / Logs</h3>
        <ul className="space-y-3 text-sm">
          {logs.length === 0 && <li className="text-gray-500 dark:text-gray-400">No activity yet.</li>}
          {logs.map((log, i) => (
            <li key={i} className="flex justify-between items-center border-b pb-2">
              <span>{log.action} by {log.actor_name}</span>
              <span className="text-gray-500 dark:text-gray-400 text-xs">{log.created_at}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Item({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-white">{value}</p>
    </div>
  );
}

function statusClass(status) {
  switch (status) {
    case 'new': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100';
    case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
    case 'escalated': return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100';
    case 'closed': return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}
