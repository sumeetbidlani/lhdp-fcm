"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, BadgeCheck, ArrowLeft, ChevronRight } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-hot-toast";
import notoUrduFont from "@/lib/fonts/NotoNastaliqUrdu";
import logoImage from "/public/logo.png";
import signatureImage from "/public/signature/1.png";
import { Toaster } from "react-hot-toast";
import generateCategorizationPDF from "@/lib/pdf/generateCategorizationPDF";


const PDFSection = ({ doc, yPosition, content, title }) => {
  yPosition = checkPageOverflow(yPosition, 20);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text(title, 15, yPosition);
  doc.setDrawColor(30, 64, 175);
  doc.line(10, yPosition - 8, 10, yPosition + 2);
  yPosition += 10;

  content.forEach((item) => {
    yPosition = checkPageOverflow(yPosition, 15);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 64, 175);
    doc.text(item.label, 15, yPosition);
    doc.setFontSize(10);
    doc.setTextColor(26, 32, 44);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, yPosition + 2, 180, 10, 2, 2, "FD");
    doc.text(item.value, 17, yPosition + 8, { maxWidth: 176 });
    yPosition += 15;
  });

  return yPosition;
};

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [metaTypes, setMetaTypes] = useState([]);
  const [managers, setManagers] = useState([]);
  const [feedbackSource, setFeedbackSource] = useState([]);
  const [showOther, setShowOther] = useState(false);
  const [showOtherOperational, setShowOtherOperational] = useState(false);
  const [user, setUser] = useState(null);
  const urduTextRef = useRef(null);
  const [formData, setFormData] = useState({
    informedManager: false,
    managerMethod: "",
    informedRequester: false,
    requesterMethod: "",
    contactAssessment: "",
    feedbackTypeId: "",
    comment: "",
    reviewed: false,
    actionCheckbox: false,
    assignProjectId: "",
    assignManagerId: "",
    otherStream: "",
    sendMethod: "",
    streamsProgram: [],
    streamsOperational: [],
    actionTaken: "",
    responseDueDate: "",
    statusOfComplaint: "",
  });

  useEffect(() => {
    fetch(`/api/feedback/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setComplaint(data.complaint);
        setLogs(data.logs || []);
        setLoading(false);

        setFormData((prev) => ({
          ...prev,
          contactAssessment: data.complaint.contact_assessment || "",
          feedbackTypeId: data.complaint.feedback_type_id?.toString() || "",
          comment: data.complaint.comment || "",
          assignManagerId: data.complaint.assign_manager_id?.toString() || "",
          assignProjectId: data.complaint.assign_project_id?.toString() || "",
          managerMethod: data.complaint.manager_method || "",
          informedManager: data.complaint.informed_manager || false,
          informedRequester: data.complaint.informed_requester || false,
          requesterMethod: data.complaint.requester_method || "",
          sendMethod: data.complaint.send_method || "",
          streamsProgram: data.complaint.programming_streams || [],
          streamsOperational: data.complaint.operational_streams || [],
          actionTaken: data.complaint.action_taken || "",
          statusOfComplaint: data.complaint.status_of_complaint || "",
          reviewed: false,
        }));

        if (data.complaint?.date_received) {
          const date = new Date(data.complaint.date_received);
          let added = 0;
          while (added < 7) {
            date.setDate(date.getDate() + 1);
            const day = date.getDay();
            if (day !== 6 && day !== 0) added++;
          }
          const formattedDate = date.toISOString().split("T")[0];
          setFormData((prev) => ({ ...prev, responseDueDate: formattedDate }));
        }
      });

    fetch("/api/feedback/meta")
      .then((res) => res.json())
      .then((data) => {
        setMetaTypes(data.types || []);
        setManagers(data.managers || []);
        setFeedbackSource(data.sources || []);
      });

    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((error) => {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data.");
      });
  }, [id]);

  const handleStartProcessing = async () => {
    try {
      const response = await fetch(`/api/feedback/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_process" }),
      });
      if (response.ok) {
        setComplaint((prev) => ({ ...prev, status: "in_process" }));
        const updatedData = await fetch(`/api/feedback/${id}`).then((res) => res.json());
        setLogs(updatedData.logs || []);
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleSendToCRC = async () => {
    try {
      const response = await fetch(`/api/feedback/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "to_crc" }),
      });
      if (response.ok) {
        setComplaint((prev) => ({ ...prev, status: "to_crc" }));
        const updatedData = await fetch(`/api/feedback/${id}`).then((res) => res.json());
        setLogs(updatedData.logs || []);
      } else {
        console.error("Failed to send to CRC");
      }
    } catch (error) {
      console.error("Error sending to CRC:", error);
    }
  };

  const handleSendToManager = async () => {
    try {
      const response = await fetch(`/api/feedback/${id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assign_manager_id: formData.assignManagerId,
          manager_method: formData.managerMethod,
          informed_manager: formData.informedManager,
        }),
      });
      if (response.ok) {
        setComplaint((prev) => ({
          ...prev,
          assign_manager_id: formData.assignManagerId,
          manager_method: formData.managerMethod,
          informed_manager: formData.informedManager,
        }));
        const updatedData = await fetch(`/api/feedback/${id}`).then((res) => res.json());
        setLogs(updatedData.logs || []);
      } else {
        console.error("Failed to send to manager");
      }
    } catch (error) {
      console.error("Error sending to manager:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      console.log("submit update-");
      const response = await fetch(`/api/feedback/${id}/categorize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactAssessment: formData.contactAssessment,
          feedbackTypeId: formData.feedbackTypeId,
          comment: formData.comment,
          assignProjectId: formData.assignProjectId,
          assignManagerId: formData.assignManagerId,
          managerMethod: formData.managerMethod,
          requesterMethod: formData.requesterMethod,
          sendMethod: formData.sendMethod,
          informedManager: formData.informedManager,
          informedRequester: formData.informedRequester,
          streamsProgram: formData.streamsProgram,
          streamsOperational: formData.streamsOperational,
          actionTaken: formData.actionTaken,
          responseDueDate: formData.responseDueDate,
          statusOfComplaint: formData.statusOfComplaint,
        }),
      });
      const data = await response.json();
      toast(data.message || (data.success ? "✅ Action completed!" : "❌ Error!"));

      let newStatus = "in_process";
      if (data.success) {
        if (formData.feedbackTypeId === "1") {
          newStatus = "in_process";
        } else if (formData.feedbackTypeId === "2") {
          newStatus = "closed";
        } else if (formData.feedbackTypeId === "3" || formData.feedbackTypeId === "4") {
          if (formData.statusOfComplaint === "to_crc") {
            newStatus = "to_crc";
          } else {
            newStatus = "closed";
          }
        }
        setComplaint((prev) => ({
          ...prev,
          ...formData,
          status: newStatus,
        }));
        const updatedData = await fetch(`/api/feedback/${id}`).then((res) => res.json());
        setLogs(updatedData.logs || []);
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast("❌ Failed to complete action");
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
  const maxContentHeight = pageHeight - margin * 2 - 10; // Reserve space for footer

  // Track pages for numbering
  let currentPage = 1;
  const totalPages = () => doc.internal.getNumberOfPages();

  // Function to check if we need a new page, reserving footer space
  const checkPageOverflow = (currentY, requiredHeight) => {
    if (currentY + requiredHeight > maxContentHeight) {
      addFooter();
      doc.addPage();
      currentPage++;
      return margin;
    }
    return currentY || margin; // Fallback to margin if undefined
  };

  // Function to add footer at the bottom of each page
  const addFooter = () => {
    doc.setFontSize(6);
    doc.setTextColor(107, 114, 128);
    doc.text("Generated with FCRM System by www.irisxoft.com", 105, pageHeight - margin, { align: "center" });
    doc.text(`Page ${currentPage} of ${totalPages()}`, 105, pageHeight - margin + 5, { align: "center" });
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
      console.error("Image load error:", error);
      throw error;
    }
  };

  // Helper function to render sections
  const PDFSection = (yPosition, content, title) => {
    if (!doc || !yPosition || !content || !title) {
      console.error("PDFSection: Missing required parameters", { doc, yPosition, content, title });
      return yPosition || margin;
    }

    let currentY = checkPageOverflow(yPosition, 25);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.text(title, 15, currentY);
    doc.setDrawColor(30, 64, 175);
    doc.line(10, currentY - 8, 10, currentY + 2);
    currentY += 20;

    content.forEach((item) => {
      if (!item.label || typeof item.value === "undefined") {
        console.warn("Skipping invalid field:", item);
        return;
      }
      currentY = checkPageOverflow(currentY, 20);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(30, 64, 175);
      doc.text(item.label, 15, currentY);
      doc.setFontSize(10);
      doc.setTextColor(26, 32, 44);
      doc.setFillColor(255, 255, 255);
      const rectWidth = 180;
      doc.roundedRect(15, currentY + 2, rectWidth, 10, 2, 2, "FD");
      doc.text(item.value.toString(), 17, currentY + 8, { maxWidth: rectWidth - 4 });
      currentY += 20;
    });

    return currentY;
  };

  let yPosition = margin;

  // Header with Logo, Title, and Ref Number (Complaint Section)
  let logoLoaded = false;
  try {
    let logoData = logoImage;
    try {
      doc.getImageProperties(logoImage);
    } catch {
      logoData = await loadImageAsBase64("/logo.png");
    }
    const imgProps = doc.getImageProperties(logoData);
    const imgWidth = 40;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    yPosition = checkPageOverflow(yPosition, imgHeight + 20);
    const pageWidth = 210;
    const logoX = (pageWidth - imgWidth) / 2;
    doc.addImage(logoData, "PNG", logoX, yPosition, imgWidth, imgHeight);
    logoLoaded = true;
    yPosition += imgHeight + 5;
  } catch (error) {
    console.error("Error loading logo:", error.message, error.stack);
    toast.error("❌ Failed to load logo in PDF. Check file path or format.");
    yPosition = checkPageOverflow(yPosition, 15);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(30, 64, 175);
    doc.text("LHDP", 105, yPosition, { align: "center" });
    yPosition += 5;
  }
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  yPosition = checkPageOverflow(yPosition, 10);
  doc.text("Laar Humanitarian and Development Programme", 105, yPosition, { align: "center" });
  yPosition += 3;
  doc.setDrawColor(30, 64, 175);
  doc.line(50, yPosition, 160, yPosition);
  yPosition += 5;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text(`Ref: ${complaint?.complaint_code || "____________"}`, 180, yPosition - 8);
  yPosition += 7;

  // Report Title
  yPosition = checkPageOverflow(yPosition, 15);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text("Complaint / Feedback Report", 105, yPosition, { align: "center" });
  doc.setDrawColor(30, 64, 175);
  doc.line(85, yPosition + 2, 125, yPosition + 2);
  yPosition += 15;

  // Report Fields - Top Section
  yPosition = checkPageOverflow(yPosition, 60);
  const complaintFields = [
    { label: "Date of Printing", value: new Date().toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) + " PKT" },
    { label: "Registered By", value: user?.name || "N/A" },
    { label: "Project", value: complaint?.project || "N/A" },
    { label: "Source", value: complaint?.source || "N/A" },
    { label: "Date Received", value: complaint?.date_received ? new Date(complaint.date_received).toLocaleDateString() : "N/A" },
    { label: "Date of Registration", value: complaint?.date_received ? new Date(complaint.date_received).toLocaleDateString() : "N/A" },
    { label: "Location", value: complaint?.location || "N/A", fullWidth: true },
    // { label: "Contact Assessment", value: complaint?.contact_assessment || formData?.contactAssessment || "N/A" },
    // { label: "Feedback/Complaint Type", value: metaTypes.find((t) => t.id == complaint?.feedback_type_id)?.name || "N/A" },
    // { label: "Comment", value: complaint?.comment || formData?.comment || "N/A", fullWidth: true },
  ];

  yPosition = checkPageOverflow(yPosition, 30);
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(10, yPosition, 190, complaintFields.length * 20 + 15, 3, 3, "F");
  yPosition += 10;
  yPosition = PDFSection(yPosition, complaintFields, "Complaint Details");

  // Complainant Information Section
  yPosition = checkPageOverflow(yPosition, 35);
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(10, yPosition, 190, 25, 3, 3, "F");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text("Complainant Information", 15, yPosition + 10);
  doc.setDrawColor(30, 64, 175);
  doc.line(10, yPosition + 2, 10, yPosition + 12);

  const complainantFields = [
    { label: "Name of Complainant", value: complaint?.anonymous ? "Hidden" : complaint?.contact_name || "N/A" },
    { label: "Contact Phone", value: complaint?.anonymous ? "Hidden" : complaint?.contact_phone || "N/A" },
  ];

  yPosition += 15;
  complainantFields.forEach((field, index) => {
    const xOffset = index === 0 ? 15 : 105;
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
    if (index === 1) yPosition += 15;
  });

  yPosition += 10;

  // Summary Section
  yPosition = checkPageOverflow(yPosition, 80);
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(10, yPosition, 190, 80, 3, 3, "F");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text("Summary", 15, yPosition + 10);
  doc.setDrawColor(30, 64, 175);
  doc.line(10, yPosition + 2, 10, yPosition + 12);

  // English Summary
  yPosition += 20;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  doc.text("Summary (EN)", 10, yPosition);
  doc.setFontSize(10);
  doc.setTextColor(26, 32, 44);
  doc.setFillColor(255, 255, 255);
  const englishSummaryHeight = Math.max(30, Math.ceil(doc.getTextDimensions(complaint?.summary_en || "-", { maxWidth: 186 }).h) + 4);
  yPosition = checkPageOverflow(yPosition, englishSummaryHeight + 5);
  doc.roundedRect(10, yPosition + 2, 190, englishSummaryHeight, 2, 2, "FD");
  doc.text(complaint?.summary_en || "-", 12, yPosition + 8, { maxWidth: 186 });
  yPosition += englishSummaryHeight + 5;

  // Urdu Summary
  yPosition = checkPageOverflow(yPosition, 50);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  doc.text("Summary (UR)", 10, yPosition);
  if (urduTextRef.current) {
    try {
      const canvas = await html2canvas(urduTextRef.current, {
        scale: 1.2,
        useCORS: true,
        backgroundColor: "#fff",
      });
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      yPosition = checkPageOverflow(yPosition, imgHeight + 15);
      doc.addImage(imgData, "PNG", 10, yPosition + 5, imgWidth, imgHeight);
      yPosition += imgHeight + 15;
    } catch (error) {
      console.error("Urdu render error:", error.message, error.stack);
      toast.error("❌ اردو ٹیکسٹ PDF میں شامل نہیں ہو سکا");
    }
  }

  // Signature Section (Complaint)
  yPosition = checkPageOverflow(yPosition, 40);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(26, 32, 44);
  let signatureHeight = 10;
  try {
    let signatureData = signatureImage;
    try {
      doc.getImageProperties(signatureImage);
    } catch {
      signatureData = await loadImageAsBase64("/signature/1.png");
    }
    const imgProps = doc.getImageProperties(signatureData);
    const imgWidth = 40;
    signatureHeight = (imgProps.height * imgWidth) / imgProps.width;
    yPosition = checkPageOverflow(yPosition, signatureHeight + 15);
    doc.addImage(signatureData, "PNG", 150, yPosition, imgWidth, signatureHeight);
    doc.text("Registering Person's Signature", 150, yPosition + signatureHeight + 5);
    doc.text(`Name: ${user?.name || "N/A"}`, 150, yPosition + signatureHeight + 10);
  } catch (error) {
    console.error("Error loading signature:", error.message, error.stack);
    toast.error("❌ Failed to load signature in PDF. Check file path or format.");
    yPosition = checkPageOverflow(yPosition, 20);
    doc.setDrawColor(30, 64, 175);
    doc.line(150, yPosition, 200, yPosition);
    doc.text("Registering Person's Signature", 150, yPosition + 8);
    doc.text(`Name: ${user?.name || "N/A"}`, 150, yPosition + 13);
  }
  yPosition += signatureHeight + 15;

  // Footer Note (Complaint)
  addFooter();

  // Start new page for Categorization Update
  doc.addPage();
  currentPage++;
  yPosition = margin;

  // Header with Logo, Title, and Ref Number (Update Section)
  logoLoaded = false;
  try {
    let logoData = logoImage;
    try {
      doc.getImageProperties(logoImage);
    } catch {
      logoData = await loadImageAsBase64("/logo.png");
    }
    const imgProps = doc.getImageProperties(logoData);
    const imgWidth = 40;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    yPosition = checkPageOverflow(yPosition, imgHeight + 20);
    const pageWidth = 210;
    const logoX = (pageWidth - imgWidth) / 2;
    doc.addImage(logoData, "PNG", logoX, yPosition, imgWidth, imgHeight);
    logoLoaded = true;
    yPosition += imgHeight + 5;
  } catch (error) {
    console.error("Error loading logo:", error.message, error.stack);
    toast.error("❌ Failed to load logo in PDF. Check file path or format.");
    yPosition = checkPageOverflow(yPosition, 15);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(30, 64, 175);
    doc.text("LHDP", 105, yPosition, { align: "center" });
    yPosition += 5;
  }
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  yPosition = checkPageOverflow(yPosition, 10);
  doc.text("Laar Humanitarian and Development Programme", 105, yPosition, { align: "center" });
  yPosition += 3;
  doc.setDrawColor(30, 64, 175);
  doc.line(50, yPosition, 160, yPosition);
  yPosition += 5;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text(`Ref: ${complaint?.complaint_code || "____________"}`, 180, yPosition - 8);
  yPosition += 7;

  // Update Title
  yPosition = checkPageOverflow(yPosition, 15);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text("Complaint/Feedback Update", 105, yPosition, { align: "center" });
  doc.setDrawColor(30, 64, 175);
  doc.line(85, yPosition + 2, 125, yPosition + 2);
  yPosition += 15;

  // Update-relevant data based on all selected user data
  const updateContent = [
    { label: "Contact Assessment", value: formData?.contactAssessment || "N/A" },
    { label: "Feedback/Complaint Type", value: metaTypes.find((t) => t.id == formData?.feedbackTypeId)?.name || "N/A" },
    { label: "Comment", value: formData?.comment || "N/A", fullWidth: true },
    { label: "Reviewed", value: formData?.reviewed ? "Yes" : "No" },
    { label: "Informed Manager", value: formData?.informedManager ? "Yes" : "No" },
    { label: "Informed Requester", value: formData?.informedRequester ? "Yes" : "No" },
    // { label: "feedbackTypeId feedbackTypeId", value: formData?.feedbackTypeId || '' },

  ];
  // Add type-specific fields based on user selections
  if (formData?.feedbackTypeId === "1" && formData?.actionCheckbox) {
    updateContent.push({ label: "Action Taken", value: "I am sending the request for support to the relevant manager" });
    updateContent.push({ label: "Assigned Manager", value: managers.find((m) => m.id == formData?.assignManagerId)?.name || "N/A" });
    updateContent.push({ label: "Send Method", value: formData?.sendMethod || "N/A" });
    if (formData?.informedManager) updateContent.push({ label: "Manager Contact Method", value: formData?.managerMethod || "N/A" });
    if (formData?.informedRequester) updateContent.push({ label: "Requester Contact Method", value: formData?.requesterMethod || "N/A" });
  } else if (formData?.feedbackTypeId === "2" && formData?.actionCheckbox) {
    updateContent.push({ label: "Action Taken", value: 'I am sending a personalised "thank you" response' });
    updateContent.push({ label: "Send Method", value: formData?.sendMethod || "N/A" });
  } else if ((formData?.feedbackTypeId === "3" || formData?.feedbackTypeId === "4")) {
    updateContent.push({ label: "Programme Streams", value: formData?.streamsProgram?.join(", ") || "N/A" });
    updateContent.push({ label: "Operational Streams", value: formData?.streamsOperational?.join(", ") || "N/A" });
    updateContent.push({ label: "Action Taken", value: formData?.actionTaken || "N/A" });
    updateContent.push({ label: "Response Due Date", value: formData?.responseDueDate || "N/A" });
    updateContent.push({ label: "Complaint Status", value: formData?.statusOfComplaint || "N/A" });
  }

  // Render update section with summary-style box
  if (updateContent.length > 0) {
    yPosition = checkPageOverflow(yPosition, 30);
    doc.setFillColor(219, 234, 254);
    doc.roundedRect(10, yPosition, 190, updateContent.length * 20 + 15, 3, 3, "F");
    yPosition += 10;
    yPosition = PDFSection(yPosition, updateContent, "Update Details");
  } else {
    yPosition = checkPageOverflow(yPosition, 20);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(26, 32, 44);
    doc.text("No updates selected.", 15, yPosition);
    yPosition += 20;
  }

  // Signature Section (Update) - Conditional based on reviewed
  yPosition = checkPageOverflow(yPosition, 40);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(26, 32, 44);
  yPosition += 20; // Increased gap between sections
  if (formData?.reviewed) {
    let signatureHeight = 10;
    try {
      let signatureData = signatureImage;
      try {
        doc.getImageProperties(signatureImage);
      } catch {
        signatureData = await loadImageAsBase64("/signature/1.png");
      }
      const imgProps = doc.getImageProperties(signatureData);
      const imgWidth = 40;
      signatureHeight = (imgProps.height * imgWidth) / imgProps.width;
      yPosition = checkPageOverflow(yPosition, signatureHeight + 15);
      doc.addImage(signatureData, "PNG", 150, yPosition, imgWidth, signatureHeight);
      doc.text("Update Officer Signature", 150, yPosition + signatureHeight + 5);
      doc.text(`Name: ${user?.name || "N/A"}`, 150, yPosition + signatureHeight + 10);
    } catch (error) {
      console.error("Error loading signature:", error.message, error.stack);
      toast.error("❌ Failed to load signature in PDF. Check file path or format.");
      yPosition = checkPageOverflow(yPosition, 20);
      doc.setDrawColor(30, 64, 175);
      doc.line(150, yPosition, 200, yPosition);
      doc.text("Update Officer Signature", 150, yPosition + 8);
      doc.text(`Name: ${user?.name || "N/A"}`, 150, yPosition + 13);
    }
    yPosition += signatureHeight + 15;
  } else {
    yPosition = checkPageOverflow(yPosition, 20);
    doc.text("Update Officer", 150, yPosition);
    doc.text(`Name: ${user?.name || "N/A"}`, 150, yPosition + 5);
    yPosition += 15;
  }

  // Footer Note (Update)
  addFooter();

  doc.save("final_report.pdf");
};


  const isValidStep1 = !!formData.contactAssessment;
  const isValidStep2 = formData.feedbackTypeId && formData.comment.trim();
  const selectedType = metaTypes.find((t) => t.id === parseInt(formData.feedbackTypeId));

  const simpleContact = formData.contactAssessment === "No (the contact details are fake)";
  const complexContact = [
    "There are no contact details (Anonymous)",
    "Yes (the contact details are correct)",
    "The same complaint/feedback by same person already exists",
    "The same complaint/feedback by another person already exists",
  ].includes(formData.contactAssessment);

  const StepIndicator = () => (
    <div className="flex gap-3 mb-6">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`px-4 py-1 rounded-full text-sm font-medium ${
            step === s
              ? "bg-blue-600 text-white"
              : step > s
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          Step {s}
        </div>
      ))}
    </div>
  );

  const renderAdditionalFields = () => {
    if (!complexContact || !selectedType) return null;

    if (selectedType.id === 1) {
      return (
        <>
          <label className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              checked={formData.actionCheckbox}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, actionCheckbox: e.target.checked }))
              }
            />
            I am sending the request for support to the relevant manager
          </label>

          {formData.actionCheckbox && (
            <>
              <label className="block mt-3 text-sm font-medium">Assign Manager</label>
              <select
                className="w-full border rounded p-2"
                value={formData.assignManagerId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, assignManagerId: e.target.value }))
                }
              >
                <option value="">Select Manager</option>
                {managers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={formData.informedManager || false}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, informedManager: e.target.checked }))
                  }
                />
                I have informed the manager
              </label>
              {formData.informedManager && (
                <div className="ml-4 mt-1">
                  <label className="block text-sm">Manager Contact Method</label>
                  <select
                    className="w-full border rounded p-2"
                    value={formData.managerMethod || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, managerMethod: e.target.value }))
                    }
                  >
                    <option value="">Select Method</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="message">Message</option>
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={formData.informedRequester || false}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, informedRequester: e.target.checked }))
                  }
                />
                I have informed the requester
              </label>
              {formData.informedRequester && (
                <div className="ml-4 mt-1">
                  <label className="block text-sm">Requester Contact Method</label>
                  <select
                    className="w-full border rounded p-2"
                    value={formData.requesterMethod || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, requesterMethod: e.target.value }))
                    }
                  >
                    <option value="">Select Method</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="message">Message</option>
                  </select>
                </div>
              )}
            </>
          )}
        </>
      );
    }

    if (selectedType.id === 2) {
      return (
        <>
          <label className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              checked={formData.actionCheckbox}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, actionCheckbox: e.target.checked }))
              }
            />
            I am sending a personalised "thank you" response
          </label>
          {formData.actionCheckbox && (
            <>
              <label className="block mt-3 text-sm">Sending Method</label>
              <select
                className="w-full border rounded p-2"
                value={formData.sendMethod}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sendMethod: e.target.value }))
                }
              >
                <option value="">Select Method</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="message">Message</option>
              </select>
            </>
          )}
        </>
      );
    }

    if (selectedType.id === 3 || selectedType.id === 4) {
      return (
        <>
          <label className="block mt-3 text-sm font-medium">
            Programming Stream <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            We need to assign Programme Stream/s to the feedback and complaints.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Cash Programming",
              "WASH Programme",
              "Emergency Food Security and Livelihoods (EFSL)",
              "Shelter",
              "Protection",
              "Other:",
            ].map((v, i) => (
              <div key={i}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={v}
                    checked={formData.streamsProgram.includes(v) || (v === "Other:" && formData.otherStream)}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "Other:") {
                        setShowOther((prev) => !prev);
                        setFormData((prev) => ({
                          ...prev,
                          otherStream: "",
                          streamsProgram: prev.streamsProgram.filter((x) => x !== prev.otherStream),
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          streamsProgram: prev.streamsProgram.includes(value)
                            ? prev.streamsProgram.filter((x) => x !== value)
                            : [...prev.streamsProgram, value],
                        }));
                      }
                    }}
                  />
                  {v}
                </label>
                {v === "Other:" && showOther && (
                  <input
                    type="text"
                    placeholder="Enter custom stream"
                    className="mt-2 px-2 py-1 border rounded w-full"
                    value={formData.otherStream || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        otherStream: val,
                        streamsProgram: [
                          ...prev.streamsProgram.filter((x) => x !== prev.otherStream),
                          val,
                        ],
                      }));
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <label className="block mt-6 text-sm font-medium">
            Operational Streams <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            We need to assign an Operational Stream/s to the feedback and complaints.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Beneficiary Selection and Registration",
              "Distribution/Delivery of Tangible Goods and Services",
              "Quality of Tangible Goods and Services",
              "Quality of Intangible Services",
              "Quantity Issues",
              "Timing",
              "Code of Conduct Issues",
              "Conflict of Interest",
              "Compliance to law and law enforcement agencies",
              "Other:",
            ].map((v, i) => (
              <div key={i}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={v}
                    checked={formData.streamsOperational.includes(v) || (v === "Other:" && formData.otherOperationalStream)}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "Other:") {
                        setShowOtherOperational((prev) => !prev);
                        setFormData((prev) => ({
                          ...prev,
                          otherOperationalStream: "",
                          streamsOperational: prev.streamsOperational.filter((x) => x !== prev.otherOperationalStream),
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          streamsOperational: prev.streamsOperational.includes(value)
                            ? prev.streamsOperational.filter((x) => x !== value)
                            : [...prev.streamsOperational, value],
                        }));
                      }
                    }}
                  />
                  {v}
                </label>
                {v === "Other:" && showOtherOperational && (
                  <input
                    type="text"
                    placeholder="Enter custom stream"
                    className="mt-2 px-2 py-1 border rounded w-full"
                    value={formData.otherOperationalStream || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        otherOperationalStream: val,
                        streamsOperational: [
                          ...prev.streamsOperational.filter((x) => x !== prev.otherOperationalStream),
                          val,
                        ],
                      }));
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <label className="block mt-6 text-sm font-medium">
            What are the actions you are taking now? <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Please list actions taken. You may select typical actions or write custom ones.
          </p>
          <select
            className="w-full border rounded p-2 bg-amber-400"
            value={formData.actionTaken}
            onChange={(e) => setFormData((prev) => ({ ...prev, actionTaken: e.target.value }))}
          >
            <option value="">Select</option>
            <option value="reg_ack">
              Registered the issue and sending registration number with acknowledgment
            </option>
            <option value="reg_no_ack">
              Registered but cannot send acknowledgment (anonymous/fake contact)
            </option>
            <option value="to_crc">Sending to Complaint Reference Committee (CRC)</option>
            <option value="to_ed">Sending to ED for information (major dissatisfaction)</option>
          </select>

          <label className="block mt-6 text-sm font-medium">
            When is the response due? <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Automatically calculated 7 working days from complaint received date.
          </p>
          <input
            type="date"
            className="w-full border rounded p-2"
            value={formData.responseDueDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, responseDueDate: e.target.value }))}
          />

          <label className="block mt-6 text-sm font-medium">
            Status of the Dissatisfaction Complaint <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Please update the current handling stage of this complaint.
          </p>
          <select
            className="w-full border rounded p-2"
            value={formData.statusOfComplaint}
            onChange={(e) => setFormData((prev) => ({ ...prev, statusOfComplaint: e.target.value }))}
          >
            <option value="">Select Status</option>
            <option value="to_crc">Sent to Complaint Reference Committee (CRC)</option>
            <option value="crc_closed">CRC closed without investigation</option>
            <option value="response_drafted">Response drafted by management</option>
            <option value="response_sent">Response sent</option>
            <option value="closed">Complaint closed and record locked</option>
          </select>
        </>
      );
    }

    return null;
  };

  if (loading) return <div className="p-6"><Loader2 className="animate-spin" /> Loading...</div>;
  if (!complaint) return <div className="p-6 text-red-600">Complaint not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Toaster />
      <button
        onClick={() => router.back()}
        className="text-blue-500 mb-4 flex items-center"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <div
        ref={urduTextRef}
        className="absolute -top-[9999px] w-[500px] p-4 bg-white text-black text-xs text-right leading-relaxed font-urdu"
        style={{ direction: "rtl" }}
      >
        {complaint?.summary_ur || "کوئی خلاصہ نہیں"}
      </div>

      <details
        open={complaint.status === "new"}
        className="mb-6 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow border border-gray-200 dark:border-gray-700"
      >
        <summary className="font-bold text-lg text-gray-800 dark:text-white mb-2">
          📄 Complaint Details
        </summary>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4">
          <Item label="Complaint Code" value={complaint.complaint_code} />
          <Item label="Project" value={complaint.project} />
          <Item label="Source" value={complaint.source} />
          <Item label="Type" value={complaint.type || "-"} />
          <Item
            label="Date Received"
            value={new Date(complaint.date_received).toLocaleDateString()}
          />
          <Item label="Location" value={complaint.location} />
          <Item
            label="Contact Name"
            value={complaint.anonymous ? "(Anonymous)" : complaint.contact_name || "-"}
          />
          <Item
            label="Phone"
            value={complaint.anonymous ? "(Hidden)" : complaint.contact_phone || "-"}
          />
          <Item label="Submitted By" value={complaint.user_name} />
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            📝 Summary (English):
          </p>
          <p className="text-gray-800 dark:text-gray-200 text-sm border p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            {complaint.summary_en}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            📝 Summary (Urdu):
          </p>
          <p
            className="text-gray-800 dark:text-gray-200 text-sm border p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
            dir="rtl"
          >
            {complaint.summary_ur}
          </p>
        </div>

        {complaint.attachments?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              📎 Attachments
            </h3>
            <ul className="space-y-2">
              {complaint.attachments.map((a, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center border p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex flex-col">
                    <a
                      href={a.filename}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
                    >
                      {a.filename.split("/").pop()}
                    </a>
                    {a.description && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {a.description}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <span
            className={`inline-flex items-center gap-1 text-sm px-4 py-1 rounded-full font-semibold ${statusClass(
              complaint.status
            )}`}
          >
            <BadgeCheck className="w-4 h-4" /> {complaint.status.replace("_", " ")}
          </span>

          {(complaint.status === "new" || complaint.status === "closed") && (
            <div className="flex gap-4">
              {complaint.status === "new" && (
                <button
                  onClick={handleStartProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Start Processing
                </button>
              )}
            </div>
          )}
        </div>
      </details>

      {complaint.status === "in_process" && (
        <div className="bg-white p-6 rounded shadow border">
          <h2 className="text-xl font-bold mb-4">⚙️ Categorize Complaint</h2>
          <StepIndicator />

          {step === 1 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Contact Assessment</label>
              {[
                "There are no contact details (Anonymous)",
                "Yes (the contact details are correct)",
                "No (the contact details are fake)",
                "The same complaint/feedback by same person already exists",
                "The same complaint/feedback by another person already exists",
              ].map((v, i) => (
                <label key={i} className="block">
                  <input
                    type="radio"
                    name="contact"
                    value={v}
                    checked={formData.contactAssessment === v}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, contactAssessment: e.target.value }))
                    }
                  />
                  {v}
                </label>
              ))}
              <button
                disabled={!isValidStep1}
                onClick={() => setStep(2)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded flex items-center"
              >
                Next <ChevronRight className="ml-2" size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium">Feedback/Complaint Type</label>
              <select
                className="w-full border rounded p-2"
                value={formData.feedbackTypeId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, feedbackTypeId: e.target.value }))
                }
              >
                <option value="">Select type</option>
                {metaTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              {renderAdditionalFields()}

              <label className="block mt-3 text-sm font-medium">Comment</label>
              <textarea
                className="w-full p-2 border rounded"
                value={formData.comment}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, comment: e.target.value }))
                }
              ></textarea>

              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-600 underline"
                >
                  Back
                </button>
                <button
                  disabled={!isValidStep2}
                  onClick={() => setStep(3)}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-3">
                  📋 Complaint Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <Item label="Complaint Code" value={complaint.complaint_code} />
                  <Item label="Project" value={complaint.project} />
                  <Item label="Source" value={complaint.source} />
                  <Item label="Type" value={complaint.type || "-"} />
                  <Item
                    label="Date Received"
                    value={new Date(complaint.date_received).toLocaleDateString()}
                  />
                  <Item label="Location" value={complaint.location} />
                  <Item
                    label="Contact Name"
                    value={complaint.anonymous ? "(Anonymous)" : complaint.contact_name || "-"}
                  />
                  <Item
                    label="Phone"
                    value={complaint.anonymous ? "(Hidden)" : complaint.contact_phone || "-"}
                  />
                  <Item label="Submitted By" value={complaint.user_name} />
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 shadow">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-3">
                  ⚙️ Categorization Summary
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <Item label="Contact Assessment" value={formData.contactAssessment} />
                  <Item
                    label="Feedback/Complaint Type"
                    value={metaTypes.find((t) => t.id == formData.feedbackTypeId)?.name || "-"}
                  />
                  <Item label="Comment" value={formData.comment || "-"} />
                  <Item label="Reviewed" value={formData.reviewed ? "Yes" : "No"} />
                </div>

                <div className="mt-4 border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <Item
                    label="Informed Manager"
                    value={formData.informedManager ? "Yes" : "No"}
                  />
                  {formData.informedManager && (
                    <Item
                      label="Method to Inform Manager"
                      value={formData.managerMethod || "-"}
                    />
                  )}

                  <Item
                    label="Informed Requester"
                    value={formData.informedRequester ? "Yes" : "No"}
                  />
                  {formData.informedRequester && (
                    <Item
                      label="Method to Inform Requester"
                      value={formData.requesterMethod || "-"}
                    />
                  )}
                </div>

                {formData.feedbackTypeId === "1" && formData.actionCheckbox && (
                  <div className="mt-4 text-sm grid gap-2">
                    <Item
                      label="Action Taken"
                      value="I am sending the request for support to the relevant manager"
                    />
                    <Item label="Assigned Project" value={formData.assignProjectId || "-"} />
                    <Item label="Assigned Manager" value={formData.assignManagerId || "-"} />
                    <Item label="Send Method" value={formData.sendMethod || "-"} />
                  </div>
                )}

                {formData.feedbackTypeId === "2" && formData.actionCheckbox && (
                  <div className="mt-4 text-sm grid gap-2">
                    <Item
                      label="Action Taken"
                      value='I am sending a personalised "thank you" response'
                    />
                    <Item label="Send Method" value={formData.sendMethod || "-"} />
                  </div>
                )}

                {formData.feedbackTypeId === "3" && (
                  <div className="mt-4 text-sm grid gap-2">
                    <Item
                      label="Programme Streams"
                      value={formData.streamsProgram?.join(", ") || "-"}
                    />
                    <Item
                      label="Operational Streams"
                      value={formData.streamsOperational?.join(", ") || "-"}
                    />
                    <Item label="Action Taken" value={formData.actionTaken || "-"} />
                    <Item label="Response Due Date" value={formData.responseDueDate || "-"} />
                    <Item label="Complaint Status" value={formData.statusOfComplaint || "-"} />
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.reviewed}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, reviewed: e.target.checked }))
                      }
                    />
                    I have reviewed this complaint and am ready to close.
                  </label>
                </div>

                <div className="flex justify-between gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="text-sm text-gray-600 dark:text-gray-300 underline"
                  >
                    Back
                  </button>
                  <div className="flex gap-4">
                    <button
                      onClick={handleDownloadPDF}
                      className="px-4 py-2 bg-green-600 text-white rounded"
                    >
                      📥 Download PDFs
                    </button>
                    <button
                      disabled={!formData.reviewed}
                      onClick={handleSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                      {formData.feedbackTypeId === "1"
                        ? "Send to Relevant Manager"
                        : formData.feedbackTypeId === "2"
                        ? "Close Feedback"
                        : (formData.feedbackTypeId === "3" || formData.feedbackTypeId === "4") &&
                          formData.statusOfComplaint === "to_crc"
                        ? "Send to CRC"
                        : "Close Complaint"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-white p-6 rounded shadow border">
        <h3 className="text-lg font-semibold mb-3">🕓 Logs</h3>
        <ul className="text-sm space-y-2">
          {logs.map((log, i) => (
            <li key={i} className="flex justify-between">
              <span>
                {log.action} by <b>{log.actor_name}</b>
              </span>
              <span className="text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Item({ label, value, fullWidth }) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || "-"}</p>
    </div>
  );
}

function statusClass(status) {
  switch (status) {
    case "new":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100";
    case "in_process":
      return "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100";
    case "escalated":
      return "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100";
    case "closed":
      return "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
}