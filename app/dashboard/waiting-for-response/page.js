"use client";

import { useEffect, useState } from 'react';
import { Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from "react-hot-toast";

import Link from 'next/link';

export default function WaitingForResponse() {
  const [complaints, setComplaints] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [report, setReport] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isReviewed, setIsReviewed] = useState(false);

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/feedback/in-process');
        const data = await response.json();
        if (data.waiting_for_response_complaints) { // Updated to match the API key
          setComplaints(data.waiting_for_response_complaints);
          setFiltered(data.waiting_for_response_complaints);
        } else {
          toast.error('Failed to load waiting for response complaints');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error('Error loading waiting for response complaints');
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  useEffect(() => {
    let filteredData = [...complaints];
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFiltered(filteredData);
  }, [complaints, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronUp className="w-4 h-4 inline" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />;
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentComplaints = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const openResolveModal = (complaint) => {
    setSelectedComplaint(complaint);
    setReport('');
    setAttachment(null);
    setIsReviewed(false);
  };

  const handleSubmitResolve = async (e) => {
    e.preventDefault();
    if (!report || !selectedComplaint || !isReviewed) {
      toast.error('Please provide a report, select a complaint, and confirm review');
      return;
    }

    const formData = new FormData();
    formData.append('complaintId', selectedComplaint.id);
    formData.append('report', report);
    if (attachment) formData.append('attachment', attachment);

    try {
      const response = await fetch('/api/feedback/resolve', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Complaint resolved successfully');
        setSelectedComplaint(null);
        // Reload data instead of filtering out
        const fetchResponse = await fetch('/api/feedback');
        const fetchData = await fetchResponse.json();
        if (fetchData.waiting_for_response_complaints) {
          setComplaints(fetchData.waiting_for_response_complaints);
          setFiltered(fetchData.waiting_for_response_complaints);
        }
      } else {
        toast.error('Failed to resolve complaint');
      }
    } catch (error) {
      console.error('Resolve error:', error);
      toast.error('Error resolving complaint');
    }
  };

  if (loading) return <div className="p-6"><Loader2 className="animate-spin" /> Loading...</div>;

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Title */}
      <h2 className="text-xl font-semibold mb-6">Waiting for Response Complaint/Feedback</h2>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-center mt-4">No waiting for response complaints found.</p>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('complaint_code')}>
                  Code {renderSortIcon('complaint_code')}
                </th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('project')}>
                  Project {renderSortIcon('project')}
                </th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('status')}>
                  Status {renderSortIcon('status')}
                </th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('date_received')}>
                  Date Received {renderSortIcon('date_received')}
                </th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('user_name')}>
                  Registered By {renderSortIcon('user_name')}
                </th>
                <th className="px-4 py-2 text-left">Complaint/Feedback By</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentComplaints.map((complaint) => (
                <tr key={complaint.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2">{complaint.complaint_code}</td>
                  <td className="px-4 py-2">{complaint.project || 'N/A'}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{new Date(complaint.date_received).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{complaint.user_name || 'N/A'}</td>
                  <td className="px-4 py-2">
                    {complaint.anonymous ? 'Anonymous' : complaint.contact_name || 'N/A'}
                  </td>
                  <td className="px-4 py-2 flex space-x-2">
                    <Link href={`/dashboard/feedback-table/${complaint.id}`}>
                      <button className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        View
                      </button>
                    </Link>
                    <button
                      onClick={() => openResolveModal(complaint)}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 mx-1 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-400"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-3 py-1 mx-1 rounded-lg ${currentPage === number ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 mx-1 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-400"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Resolve Complaint #{selectedComplaint.id}</h3>
            <form onSubmit={handleSubmitResolve}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Report/Comment</label>
                <textarea
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Enter resolution report or comment..."
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Attachment</label>
                <input
                  type="file"
                  onChange={(e) => setAttachment(e.target.files[0])}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isReviewed}
                    onChange={(e) => setIsReviewed(e.target.checked)}
                    className="mr-2"
                  />
                  <span>I have reviewed and received the responses from CRC or the relevant manager</span>
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isReviewed}
                  className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 ${!isReviewed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
