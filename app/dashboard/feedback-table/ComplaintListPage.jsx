// app/dashboard/feedback-table/ComplaintListPage.jsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ComplaintListPage() {
 const [complaints, setComplaints] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [meta, setMeta] = useState({ projects: [], sources: [] });

  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = 10;

  useEffect(() => {
    const fetchMeta = async () => {
      const res = await fetch("/api/feedback/meta");
      const json = await res.json();
      setMeta({ projects: json.projects, sources: json.sources });
    };
    fetchMeta();
  }, []);

const fetchComplaints = async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams({
      search,
      project: projectFilter,
      status: statusFilter,
      source: sourceFilter,
      dateFrom,
      dateTo,
    });
    const res = await fetch(`/api/feedback?${params.toString()}`);
    const data = await res.json();

    if (Array.isArray(data)) {
      setComplaints(data);
    } else {
      console.error("Expected array but got:", data);
      setComplaints([]); // fallback to empty
    }
  } catch (err) {
    console.error("Failed to fetch complaints", err);
    setComplaints([]);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchComplaints();
  }, [search, projectFilter, statusFilter, sourceFilter, dateFrom, dateTo]);

  useEffect(() => {
    let filteredData = [...complaints];
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    setFiltered(filteredData);
  }, [complaints, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const resetFilters = () => {
    setSearch("");
    setProjectFilter("");
    setStatusFilter("");
    setSourceFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  return (
    <div className="p-6 dark:bg-black min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📋 Complaints & Feedback</h1>
        <div className="flex w-full md:w-auto gap-2">
          <input
            type="text"
            placeholder="Search by code or project..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
          />
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >Reset</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <select
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
          className="px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-gray-900 bg-white text-sm text-gray-800 dark:text-white"
        >
          <option value="">All Projects</option>
          {meta.projects.map(p => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-gray-900 bg-white text-sm text-gray-800 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="in-progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-gray-900 bg-white text-sm text-gray-800 dark:text-white"
        >
          <option value="">All Sources</option>
          {meta.sources.map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-gray-900 bg-white text-sm text-gray-800 dark:text-white"
          placeholder="From Date"
        />

        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-gray-900 bg-white text-sm text-gray-800 dark:text-white"
          placeholder="To Date"
        />

        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm"
        >
          Reset
        </button>
      </div>

      {loading ? (
        <p className="text-gray-700 dark:text-gray-300">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">No results found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort("complaint_code")}>Code {renderSortIcon("complaint_code")}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort("project_name")}>Project {renderSortIcon("project_name")}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort("date_received")}>Received {renderSortIcon("date_received")}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort("created_on")}>Created {renderSortIcon("created_on")}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort("status")}>Status {renderSortIcon("status")}</th>
                <th className="px-4 py-2 text-left">Anonymity</th>
                <th className="px-4 py-2 text-left">Registered By</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((c, idx) => (
                <tr key={idx} className="border-t dark:border-gray-700">
                  <td className="px-4 py-2">{c.complaint_code}</td>
                  <td className="px-4 py-2">{c.project_name}</td>
                  <td className="px-4 py-2">{new Date(c.date_received).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{new Date(c.created_on).toLocaleDateString()}</td>
                  <td className="px-4 py-2 capitalize">{c.status}</td>
                  <td className="px-4 py-2">{c.anonymity_status}</td>
                  <td className="px-4 py-2">{c.registered_by}</td>
                  <td className="px-4 py-2 text-center">
                    <Link href={`/dashboard/feedback-table/${c.id}`}>
                      <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800">View</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex justify-end flex-wrap gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <Link key={i} href={`?page=${i + 1}`}>
            <button className={`px-3 py-1 text-sm border rounded ${i + 1 === page ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 dark:text-white'}`}>
              {i + 1}
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
