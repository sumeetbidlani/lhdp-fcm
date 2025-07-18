"use client";

import { useEffect, useState, useRef } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";
import { toast } from "react-hot-toast";
import notoUrduFont from "@/lib/fonts/NotoNastaliqUrdu";
import logoImage from "/public/logo.png"; // Static import for logo
import signatureImage from "/public/signature/1.png"; // Static import for signature
import { Toaster } from "react-hot-toast";

export default function RegisterComplaintPage() {
  const [step, setStep] = useState(1);
  const [today, setToday] = useState("");
  const [projects, setProjects] = useState([]);
  const [sources, setSources] = useState([]);
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [user, setUser] = useState(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const urduTextRef = useRef(null);

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
    descriptions: [""],
  });

  useEffect(() => {
    const t = new Date().toISOString().split("T")[0];
    setToday(t);
    setForm((prev) => ({ ...prev, date_received: t }));

    fetch("/api/feedback/meta")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || []);
        setSources(data.sources || []);
      })
      .catch((error) => {
        console.error("Error fetching meta data:", error);
        toast.error("Failed to load projects and sources.");
      });

    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((error) => {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data.");
      });
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
      descriptions: [...prev.descriptions, ""],
    }));
  };

  const removeAttachmentField = (index) => {
    const files = [...form.attachments];
    const descriptions = [...form.descriptions];
    files.splice(index, 1);
    descriptions.splice(index, 1);
    setForm((prev) => ({ ...prev, attachments: files, descriptions }));
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
        value.forEach((file) => file && formData.append("files[]", file));
      } else if (key === "descriptions") {
        value.forEach((desc) => formData.append("descriptions[]", desc));
      } else {
        formData.append(key, value);
      }
    });

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.dismiss();
        toast.success("✅ Complaint submitted successfully!");
        setStep(1);
        window.location.href = "/dashboard/feedback-table";
      } else {
        toast.dismiss();
        toast.error(data.error || "❌ Submission failed.");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("❌ Submission failed due to network error.");
    }
  };

const handleDownloadPDF = async () => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Add Urdu font
  doc.addFileToVFS("NotoNastaliqUrdu.ttf", notoUrduFont);
  doc.addFont("NotoNastaliqUrdu.ttf", "NotoNastaliqUrdu", "normal");

  // Use built-in Helvetica font
  doc.setFont("Helvetica", "normal");

  // Page margins and max height
  const pageHeight = 297; // A4 height in mm
  const margin = 10;
  const maxContentHeight = pageHeight - margin * 2;

  // Track pages for numbering
  let currentPage = 1;
  const totalPages = () => doc.internal.getNumberOfPages();

  // Function to check if we need a new page
  const checkPageOverflow = (currentY, requiredHeight) => {
    if (currentY + requiredHeight > maxContentHeight) {
      // Add page number before creating new page
      doc.setFontSize(6);
      doc.setTextColor(107, 114, 128);
      doc.text(`Page ${currentPage} of ${totalPages()}`, 105, pageHeight - margin, { align: "center" });
      doc.addPage();
      currentPage++;
      return margin;
    }
    return currentY;
  };

  // Function to load image as base64
  const loadImageAsBase64 = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw error;
    }
  };

  // Header with Logo, Title, and Ref Number
  let yPosition = margin;
  let logoLoaded = false;
  try {
    let logoData = logoImage;
    try {
      doc.getImageProperties(logoImage); // Test if import is valid
    } catch {
      // Fallback to fetching as base64
      logoData = await loadImageAsBase64("/logo.png");
    }
    const imgProps = doc.getImageProperties(logoData);
    const imgWidth = 40; // Increased logo size for prominence
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    yPosition = checkPageOverflow(yPosition, imgHeight + 20);
    // Center the logo
    const pageWidth = 210; // A4 width in mm
    const logoX = (pageWidth - imgWidth) / 2; // Center horizontally
    doc.addImage(logoData, "PNG", logoX, yPosition, imgWidth, imgHeight);
    logoLoaded = true;
    yPosition += imgHeight + 5;
  } catch (error) {
    console.error("Error loading logo:", error.message, error.stack);
    toast.error("❌ Failed to load logo in PDF. Check file path or format.");
    // Fallback to centered text if logo fails
    yPosition = checkPageOverflow(yPosition, 15);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(30, 64, 175);
    doc.text("LHDP", 105, yPosition, { align: "center" });
    yPosition += 5;
  }
  // Organization Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  yPosition = checkPageOverflow(yPosition, 10);
  doc.text("Livelihood & Human Development Program", 105, yPosition, { align: "center" });
  // Horizontal line below title
  yPosition += 3;
  doc.setDrawColor(30, 64, 175);
  doc.line(50, yPosition, 160, yPosition); // Centered line
  yPosition += 5;
  // Reference Number
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text("Ref: ____________", 180, yPosition - 8); // Right-aligned, adjusted for spacing
  yPosition += 7;

  // Report Title
  yPosition = checkPageOverflow(yPosition, 15);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text("Complaint / Feedback Report", 105, yPosition, { align: "center" });
  doc.setDrawColor(30, 64, 175);
  doc.line(85, yPosition + 2, 125, yPosition + 2); // Title underline
  yPosition += 15;

  // Report Fields - Top Section
  yPosition = checkPageOverflow(yPosition, 60);
  const fields = [
    { label: "Date of Printing", value: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
    { label: "Registered By", value: user?.name || "N/A" },
    { label: "Project", value: projects.find((p) => p.id == form.project)?.name || "N/A" },
    { label: "Source", value: sources.find((s) => s.id == form.source)?.name || "N/A" },
    { label: "Date Received", value: form.date_received },
    { label: "Date of Registration", value: form.date_received },
    { label: "Location", value: form.location },
  ];

  fields.forEach((field, index) => {
    const xOffset = index % 2 === 0 ? 10 : 105;
    const fieldHeight = field.label === "Location" ? 15 : 12;
    yPosition = checkPageOverflow(yPosition, fieldHeight);
    if (field.label === "Location") {
      // Full width for Location
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(30, 64, 175);
      doc.text(field.label, 10, yPosition);
      doc.setFontSize(10);
      doc.setTextColor(26, 32, 44);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(10, yPosition + 2, 190, 10, 2, 2, "FD");
      doc.text(field.value, 12, yPosition + 8, { maxWidth: 186 });
      yPosition += 15;
    } else {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(30, 64, 175);
      doc.text(field.label, xOffset, yPosition);
      doc.setFontSize(10);
      doc.setTextColor(26, 32, 44);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(xOffset, yPosition + 2, 90, 10, 2, 2, "FD");
      doc.text(field.value, xOffset + 2, yPosition + 8, { maxWidth: 86 });
      if (index % 2 === 1) yPosition += 15;
    }
  });

  yPosition += 10;

  // Complainant Information Section
  yPosition = checkPageOverflow(yPosition, 35);
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(10, yPosition, 190, 25, 3, 3, "F");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text("Complainant Information", 15, yPosition + 10);
  doc.setDrawColor(30, 64, 175);
  doc.line(10, yPosition + 2, 10, yPosition + 12); // Section title border

  const complainantFields = [
    { label: "Name of Complainant", value: form.anonymous ? "Hidden" : form.contact_name },
    { label: "Contact Phone", value: form.anonymous ? "Hidden" : form.contact_phone },
  ];

  yPosition += 15;
  complainantFields.forEach((field, index) => {
    const xOffset = index === 0 ? 15 : 105; // Ensure fields are side by side
    const fieldHeight = 12;
    yPosition = checkPageOverflow(yPosition, fieldHeight);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 64, 175);
    doc.text(field.label, xOffset, yPosition);
    doc.setFontSize(10);
    doc.setTextColor(26, 32, 44);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(xOffset, yPosition + 2, 85, 10, 2, 2, "FD");
    doc.text(field.value, xOffset + 2, yPosition + 8, { maxWidth: 81 });
    if (index === 1) yPosition += 15; // Move down only after second field
  });

  yPosition += 10;

  // Summary Section
  yPosition = checkPageOverflow(yPosition, 80);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text("Summary", 15, yPosition);
  doc.setDrawColor(30, 64, 175);
  doc.line(10, yPosition - 8, 10, yPosition + 2); // Section title border

  // English Summary
  yPosition += 10;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  doc.text("Summary (EN)", 10, yPosition);
  doc.setFontSize(10);
  doc.setTextColor(26, 32, 44); // Dark gray text
  doc.setFillColor(255, 255, 255); // White background
  const englishSummaryHeight = Math.max(30, Math.ceil(doc.getTextDimensions(form.summary_en, { maxWidth: 186 }).h) + 4);
  yPosition = checkPageOverflow(yPosition, englishSummaryHeight + 5);
  doc.roundedRect(10, yPosition + 2, 190, englishSummaryHeight, 2, 2, "FD");
  doc.text(form.summary_en, 12, yPosition + 8, { maxWidth: 186 });
  yPosition += englishSummaryHeight + 5; // Consistent 5mm gap

  // Urdu Summary
  yPosition = checkPageOverflow(yPosition, 50);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  doc.text("Summary (UR)", 10, yPosition);
  if (urduTextRef.current) {
    try {
      const canvas = await html2canvas(urduTextRef.current, {
        scale: 1.2, // Reduced scale for smaller font size
        useCORS: true,
        backgroundColor: "#fff",
      });
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      yPosition = checkPageOverflow(yPosition, imgHeight + 15);
      doc.addImage(imgData, "PNG", 10, yPosition + 5, imgWidth, imgHeight);
      yPosition += imgHeight + 15; // Extra spacing before signature
    } catch (error) {
      console.error("Urdu render error:", error.message, error.stack);
      toast.error("❌ اردو ٹیکسٹ PDF میں شامل نہیں ہو سکا");
    }
  }

  // Signature Section
  yPosition = checkPageOverflow(yPosition, 40);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(26, 32, 44);
  let signatureHeight = 10; // Default height for text-based signature
  try {
    let signatureData = signatureImage;
    try {
      doc.getImageProperties(signatureImage); // Test if import is valid
    } catch {
      // Fallback to fetching as base64
      signatureData = await loadImageAsBase64("/signature/1.png");
    }
    const imgProps = doc.getImageProperties(signatureData);
    const imgWidth = 40; // Signature width
    signatureHeight = (imgProps.height * imgWidth) / imgProps.width;
    yPosition = checkPageOverflow(yPosition, signatureHeight + 15);
    doc.addImage(signatureData, "PNG", 150, yPosition, imgWidth, signatureHeight);
    doc.text("Registering Person's Signature", 150, yPosition + signatureHeight + 5);
    doc.text(`Name: ${user?.name || "N/A"}`, 150, yPosition + signatureHeight + 10);
  } catch (error) {
    console.error("Error loading signature:", error.message, error.stack);
    toast.error("❌ Failed to load signature in PDF. Check file path or format.");
    // Fallback to text-based signature
    yPosition = checkPageOverflow(yPosition, 20);
    doc.setDrawColor(30, 64, 175);
    doc.line(150, yPosition, 200, yPosition);
    doc.text("Registering Person's Signature", 150, yPosition + 8);
    doc.text(`Name: ${user?.name || "N/A"}`, 150, yPosition + 13);
  }
  yPosition += signatureHeight + 15;

  // Footer Note
  yPosition = checkPageOverflow(yPosition, 15); // Increased to accommodate page number
  doc.setFontSize(6);
  doc.setTextColor(107, 114, 128);
  doc.text("Generated with FCRM System by www.irisxoft.com", 105, yPosition, { align: "center" });
  // Add page number on the last page
  doc.text(`Page ${currentPage} of ${totalPages()}`, 105, yPosition + 5, { align: "center" });

  doc.save("complaint.pdf");
};

  return (
    <div className="min-h-screen py-10 px-4 bg-gradient-to-br from-gray-100 to-blue-100 dark:bg-black">
      <Toaster />
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">📝 Register Complaint (Step {step})</h1>

        {/* Hidden div for Urdu text rendering */}
        <div
          ref={urduTextRef}
          className="absolute -top-[9999px] w-[500px] p-4 bg-white text-black text-xs text-right leading-relaxed font-urdu"
          style={{ direction: "rtl" }}
        >
          {form.summary_ur || "کوئی خلاصہ نہیں"}
        </div>

        {step === 1 && (
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white">Project</label>
                <select
                  name="project"
                  value={form.project}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.project && <p className="text-red-500 text-sm">{errors.project}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white">Source</label>
                <select
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select source</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {errors.source && <p className="text-red-500 text-sm">{errors.source}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white">Date Received</label>
                <input
                  type="date"
                  name="date_received"
                  value={form.date_received}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  max={today}
                />
                {errors.date_received && <p className="text-red-500 text-sm">{errors.date_received}</p>}
              </div>

              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  name="anonymous"
                  checked={form.anonymous}
                  onChange={handleChange}
                  className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-white">Submit anonymously</label>
              </div>

              {!form.anonymous && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">Contact Name</label>
                    <input
                      name="contact_name"
                      value={form.contact_name}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    {errors.contact_name && <p className="text-red-500 text-sm">{errors.contact_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">Contact Phone</label>
                    <input
                      name="contact_phone"
                      type="number"
                      value={form.contact_phone}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    {errors.contact_phone && <p className="text-red-500 text-sm">{errors.contact_phone}</p>}
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white">Location</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
            </div>

            <button
              type="button"
              onClick={() => validateStep1() && setStep(2)}
              disabled={!isValid}
              className="px-6 py-2 mt-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Next ➡
            </button>
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
                className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white">Summary (Urdu)</label>
              <textarea
                name="summary_ur"
                dir="rtl"
                rows={4}
                value={form.summary_ur}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right font-urdu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white">Attachments</label>
              {form.attachments.map((_, i) => (
                <div key={i} className="mb-2">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, i)}
                    className="mb-1 text-gray-700 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={form.descriptions[i]}
                    onChange={(e) => handleDescriptionChange(e, i)}
                    className="w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachmentField(i)}
                    className="text-red-500 text-xs hover:text-red-700"
                  >
                    ✖ Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addAttachmentField}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                ➕ Add another file
              </button>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-gray-400 px-4 py-2 rounded-md text-white hover:bg-gray-500"
              >
                ⬅ Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-blue-600 px-4 py-2 rounded-md text-white hover:bg-blue-700"
              >
                Next ➡
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-4 text-sm text-gray-800 dark:text-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">📄 Complaint Preview</h2>
            <div className="grid gap-2">
              <div><strong>Project:</strong> {projects.find((p) => p.id == form.project)?.name || "N/A"}</div>
              <div><strong>Source:</strong> {sources.find((s) => s.id == form.source)?.name || "N/A"}</div>
              <div><strong>Date Received:</strong> {form.date_received}</div>
              <div><strong>Location:</strong> {form.location}</div>
              <div><strong>Anonymous:</strong> {form.anonymous ? "Yes" : "No"}</div>
              {!form.anonymous && (
                <>
                  <div><strong>Contact Name:</strong> {form.contact_name}</div>
                  <div><strong>Contact Phone:</strong> {form.contact_phone}</div>
                </>
              )}
              <div><strong>Summary (English):</strong> {form.summary_en}</div>
              <div><strong>Summary (Urdu):</strong> {form.summary_ur}</div>
            </div>

            <div className="mt-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={reviewConfirmed}
                  onChange={(e) => setReviewConfirmed(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>I have reviewed the complaint/feedback and confirm it is accurate.</span>
              </label>
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setStep(2)}
                className="bg-gray-400 px-4 py-2 rounded-md text-white hover:bg-gray-500"
              >
                ⬅ Back
              </button>
              <button
                onClick={handleDownloadPDF}
                className="bg-green-600 px-4 py-2 rounded-md text-white hover:bg-green-700"
              >
                📥 Download PDF
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reviewConfirmed}
                className={`px-4 py-2 rounded-md ${
                  reviewConfirmed
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
              >
                ✅ Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}