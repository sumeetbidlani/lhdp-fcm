"use client";
import { toast } from "react-hot-toast";
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
      });
      const res = await fetch(`/api/feedback?${params.toString()}`);
      const data = await res.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  async function handleMarkInProcess(id) {
    try {
      const res = await fetch(`/api/feedback/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_process" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Marked as In-Process");
        fetchComplaints();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
    }
  }

  useEffect(() => {
    fetchComplaints();
  }, [search, projectFilter, statusFilter, sourceFilter]);

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
  };

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  return (

    <div className="p-6 min-h-screen dark:bg-black bg-white text-gray-900 dark:text-white">
      

      {/* Logo + Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">📋 Complaints/ Feedbacks</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by code or project..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border rounded bg-white dark:bg-gray-900 dark:border-gray-700"
        />
        <select
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
          className="px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700"
        >
          <option value="">All Projects</option>
          {meta.projects.map(p => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="in-progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700"
        >
          <option value="">All Sources</option>
          {meta.sources.map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 col-span-1"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center">No complaints found.</p>
      ) : (
        <div className="overflow-x-auto shadow rounded border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort("complaint_code")}>Code {renderSortIcon("complaint_code")}</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort("project_name")}>Project {renderSortIcon("project_name")}</th>
                <th className="px-4 py-2 text-left">Received</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Registerd By</th>
                <th className="px-4 py-2 text-left">Complaint/Feedback By</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((c, idx) => (
                <tr key={idx} className="border-t dark:border-gray-700">
                  <td className="px-4 py-2">{c.complaint_code}</td>
                  <td className="px-4 py-2">{c.project_name}</td>
                  <td className="px-4 py-2">{new Date(c.date_received).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${c.status === "new" ? "bg-blue-100 text-blue-700" :
                        c.status === "in-progress" ? "bg-yellow-100 text-yellow-700" :
                        c.status === "closed" ? "bg-green-100 text-green-700" : ""}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{c.registered_by}</td>

                  <td className="px-4 py-2">
                    {c.anonymity_status === "Anonymous" ? "Anonymous" : c.contact_name}
                  </td>
                  <td className="px-4 py-2 text-center flex justify-center gap-2">
                    <Link href={`/dashboard/feedback-table/${c.id}`}>
                      <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800">
                        View
                      </button>
                    </Link>
                    {c.status === "new" && (
                      <button
                        onClick={() => handleMarkInProcess(c.id)}
                        className="px-4 py-1 rounded-full bg-yellow-500 text-white hover:bg-yellow-600"
                      >
                        🚧 Mark In-Process
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex justify-center flex-wrap gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <Link key={i} href={`?page=${i + 1}`}>
            <button
              className={`px-3 py-1 text-sm border rounded-md
                ${i + 1 === page
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600"}`}
            >
              {i + 1}
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
