// File: /app/dashboard/feedback/page.jsx
"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function RegisterComplaintPage() {
  const [step, setStep] = useState(1);
  const [today, setToday] = useState("");
  const [projects, setProjects] = useState([]);
  const [sources, setSources] = useState([]);
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    project: "",
    source: "",
    date_received: "",
    location: "",
    anonymous: false,
    contact_name: "",
    contact_phone: "",
    summary_en: "",
    summary_ur: "",
    attachments: [],
    descriptions: [""]
  });

  useEffect(() => {
    const t = new Date().toISOString().split("T")[0];
    setToday(t);
    setForm((prev) => ({ ...prev, date_received: t }));

    fetch("/api/feedback/meta")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects);
        setSources(data.sources);
      });

    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, []);

  useEffect(() => {
    setIsValid(validateStep1());
  }, [form]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e, index) => {
    const files = [...form.attachments];
    const descriptions = [...form.descriptions];
    files[index] = e.target.files[0];
    descriptions[index] = descriptions[index] || "";
    setForm((prev) => ({ ...prev, attachments: files, descriptions }));
  };

  const handleDescriptionChange = (e, index) => {
    const descriptions = [...form.descriptions];
    descriptions[index] = e.target.value;
    setForm((prev) => ({ ...prev, descriptions }));
  };

  const addAttachmentField = () => {
    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, null],
      descriptions: [...prev.descriptions, ""]
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.project) newErrors.project = "Project is required.";
    if (!form.source) newErrors.source = "Source is required.";
    if (!form.date_received) newErrors.date_received = "Date is required.";
    else if (form.date_received > today) newErrors.date_received = "Future date not allowed.";
    if (!form.location) newErrors.location = "Location is required.";
    if (!form.anonymous) {
      if (!form.contact_name) newErrors.contact_name = "Name required";
      if (!form.contact_phone) newErrors.contact_phone = "Phone required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "attachments") {
        value.forEach((file) => formData.append("files[]", file));
      } else if (key === "descriptions") {
        value.forEach((desc) => formData.append("descriptions[]", desc));
      } else {
        formData.append(key, value);
      }
    });

    const res = await fetch("/api/feedback", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      alert("Complaint submitted successfully");
      setStep(1);
      window.location.href = "/dashboard/feedback";
    } else {
      alert(data.error || "Submission failed");
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("LHDP Feedback & Complaint Form", 105, 15, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Date: ${today}`, 14, 25);
    doc.text(`Registered By: ${user?.name || "Unknown User"}`, 14, 32);

    autoTable(doc, {
      startY: 40,
      head: [["Field", "Value"]],
      body: [
        ["Project", projects.find(p => p.id == form.project)?.name || ""],
        ["Source", sources.find(s => s.id == form.source)?.name || ""],
        ["Date Received", form.date_received],
        ["Location", form.location],
        ["Anonymous", form.anonymous ? "Yes" : "No"],
        ["Contact Name", form.anonymous ? "(Hidden by complainant)" : form.contact_name],
        ["Contact Phone", form.anonymous ? "(Hidden by complainant)" : form.contact_phone],
        ["Summary (EN)", form.summary_en],
        ["Summary (UR)", form.summary_ur]
      ]
    });

    doc.save("complaint-preview.pdf");
  };

  return (
    <div className="min-h-screen py-10 px-4 dark:bg-black bg-gradient-to-br from-gray-100 to-blue-100">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">📝 Register Complaint (Step {step})</h1>

        {step === 1 && (
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white">Project</label>
                <select name="project" value={form.project} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2">
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.project && <p className="text-red-500 text-sm">{errors.project}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white">Source</label>
                <select name="source" value={form.source} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2">
                  <option value="">Select source</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {errors.source && <p className="text-red-500 text-sm">{errors.source}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white">Date Received</label>
                <input type="date" name="date_received" value={form.date_received} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" max={today} />
                {errors.date_received && <p className="text-red-500 text-sm">{errors.date_received}</p>}
              </div>

              <div className="flex items-center mt-6">
                <input type="checkbox" name="anonymous" checked={form.anonymous} onChange={handleChange} className="mr-2" />
                <label className="text-sm font-medium text-gray-700 dark:text-white">Submit anonymously</label>
              </div>

              {!form.anonymous && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">Contact Name</label>
                    <input name="contact_name" value={form.contact_name} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" />
                    {errors.contact_name && <p className="text-red-500 text-sm">{errors.contact_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">Contact Phone</label>
                    <input name="contact_phone" value={form.contact_phone} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" />
                    {errors.contact_phone && <p className="text-red-500 text-sm">{errors.contact_phone}</p>}
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white">Location</label>
              <input name="location" value={form.location} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2" />
              {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
            </div>

            <button
              type="button"
              onClick={() => validateStep1() && setStep(2)}
              disabled={!isValid}
              className="px-6 py-2 mt-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >Next ➡</button>
          </form>
        )}

        {step === 2 && (
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white">Summary (English)</label>
              <textarea
                name="summary_en"
                rows={4}
                value={form.summary_en}
                onChange={handleChange}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white">Summary (Urdu)</label>
              <textarea
                name="summary_ur"
                rows={4}
                value={form.summary_ur}
                onChange={handleChange}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white">Attachments</label>
              {form.attachments.map((_, i) => (
                <div key={i} className="mb-2">
                  <input type="file" onChange={(e) => handleFileChange(e, i)} className="mb-1" />
                  <input
                    type="text"
                    placeholder="Description"
                    value={form.descriptions[i]}
                    onChange={(e) => handleDescriptionChange(e, i)}
                    className="w-full rounded border px-3 py-2"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addAttachmentField}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >➕ Add another file</button>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="bg-gray-400 px-4 py-2 rounded">⬅ Back</button>
              <button type="button" onClick={() => setStep(3)} className="bg-blue-600 text-white px-4 py-2 rounded">Next ➡</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold dark:text-white text-gray-800">📄 Preview Complaint</h2>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm text-gray-800 dark:text-gray-200">
              {JSON.stringify(form, null, 2)}
            </pre>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="bg-gray-400 px-4 py-2 rounded">⬅ Back</button>
              <button onClick={handleDownloadPDF} className="bg-green-600 text-white px-4 py-2 rounded">📥 Download PDF</button>
              <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">✅ Submit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
