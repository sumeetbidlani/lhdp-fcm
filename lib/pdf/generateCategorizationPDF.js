import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import notoUrduFont from "@/lib/fonts/NotoNastaliqUrdu";
import logoImage from "/public/logo.png";
import signatureImage from "/public/signature/1.png";
import { toast } from "react-hot-toast";

const PDFSection = ({ doc, yPosition, content, title }) => {
  if (!doc || !yPosition || !content || !title) {
    console.error("PDFSection: Missing required parameters", { doc, yPosition, content, title });
    return yPosition || 10;
  }

  yPosition = checkPageOverflow(yPosition, 20);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text(title, 15, yPosition);
  doc.setDrawColor(30, 64, 175);
  doc.line(10, yPosition - 8, 10, yPosition + 2);
  yPosition += 10;

  content.forEach((item) => {
    if (!item.label || typeof item.value === "undefined") {
      console.warn("Skipping invalid field:", item);
      return;
    }
    yPosition = checkPageOverflow(yPosition, 15);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 64, 175);
    doc.text(item.label, 15, yPosition);
    doc.setFontSize(10);
    doc.setTextColor(26, 32, 44);
    doc.setFillColor(255, 255, 255);
    const rectWidth = item.fullWidth ? 180 : 85;
    const rectX = item.fullWidth ? 15 : 15;
    doc.roundedRect(rectX, yPosition + 2, rectWidth, 10, 2, 2, "FD");
    doc.text(item.value.toString(), rectX + 2, yPosition + 8, { maxWidth: rectWidth - 4 });
    yPosition += 15;
  });

  return yPosition;
};

const generateCategorizationPDF = async ({
  complaint,
  formData,
  user,
  metaTypes,
  managers,
  urduTextRef,
}) => {
  if (!complaint || !formData || !user || !metaTypes || !managers) {
    console.error("Missing required parameters for PDF generation:", {
      complaint,
      formData,
      user,
      metaTypes,
      managers,
    });
    toast.error("❌ Failed to generate PDF due to missing data.");
    return;
  }

  console.log("Starting PDF generation with data:", { complaint, formData, user, metaTypes, managers });

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
  const pageHeight = 297;
  const margin = 10;
  const maxContentHeight = pageHeight - margin * 2;

  // Track pages for numbering
  let currentPage = 1;
  const totalPages = () => doc.internal.getNumberOfPages();

  // Function to check if we need a new page
  const checkPageOverflow = (currentY, requiredHeight) => {
    if (currentY + requiredHeight > maxContentHeight) {
      doc.setFontSize(6);
      doc.setTextColor(107, 114, 128);
      doc.text(`Page ${currentPage} of ${totalPages()}`, 105, pageHeight - margin, {
        align: "center",
      });
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
      console.error("Image load error:", error);
      throw error;
    }
  };

  let yPosition = margin;

  // Categorization Details Section
  yPosition = checkPageOverflow(yPosition, 20);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text("Categorization Report", 105, yPosition, { align: "center" });
  doc.setDrawColor(30, 64, 175);
  doc.line(85, yPosition + 2, 125, yPosition + 2);
  yPosition += 15;

  // Complaint/Feedback Details
  console.log("Rendering Complaint/Feedback Details");
  yPosition = PDFSection(doc, yPosition, [
    { label: "Complaint Code", value: complaint?.complaint_code || "N/A" },
    { label: "Project", value: complaint?.project || "N/A" },
    { label: "Source", value: complaint?.source || "N/A" },
    { label: "Type", value: complaint?.type || "N/A" },
    { label: "Date Received", value: complaint?.date_received ? new Date(complaint.date_received).toLocaleDateString() : "N/A" },
    { label: "Location", value: complaint?.location || "N/A" },
  ], "Complaint/Feedback Details");

  // Step 1 and 2 Data (Categorization Input)
  console.log("Rendering Categorization Input");
  yPosition = PDFSection(doc, yPosition, [
    { label: "Contact Assessment", value: formData.contactAssessment || "N/A" },
    { label: "Feedback/Complaint Type", value: metaTypes.find((t) => t.id == formData.feedbackTypeId)?.name || "N/A" },
    { label: "Comment", value: formData.comment || "N/A", fullWidth: true },
  ], "Categorization Input");

  // Conditional Sections Based on Feedback/Complaint Type
  if (formData.feedbackTypeId === "1" && formData.actionCheckbox) {
    console.log("Rendering Manager Assignment");
    yPosition = PDFSection(doc, yPosition, [
      { label: "Action Taken", value: "I am sending the request for support to the relevant manager" },
      { label: "Assigned Manager", value: managers.find((m) => m.id == formData.assignManagerId)?.name || "N/A" },
      { label: "Send Method", value: formData.sendMethod || "N/A" },
    ], "Manager Assignment");
  } else if (formData.feedbackTypeId === "2" && formData.actionCheckbox) {
    console.log("Rendering Feedback Response");
    yPosition = PDFSection(doc, yPosition, [
      { label: "Action Taken", value: 'I am sending a personalised "thank you" response' },
      { label: "Send Method", value: formData.sendMethod || "N/A" },
    ], "Feedback Response");
  } else if (formData.feedbackTypeId === "3" || formData.feedbackTypeId === "4") {
    console.log("Rendering Complaint Handling");
    yPosition = PDFSection(doc, yPosition, [
      { label: "Programme Streams", value: formData.streamsProgram?.join(", ") || "N/A" },
      { label: "Operational Streams", value: formData.streamsOperational?.join(", ") || "N/A" },
      { label: "Action Taken", value: formData.actionTaken || "N/A" },
      { label: "Response Due Date", value: formData.responseDueDate || "N/A" },
      { label: "Complaint Status", value: formData.statusOfComplaint || "N/A" },
    ], "Complaint Handling");
  }

  // Categorization Summary
  console.log("Rendering Categorization Summary");
  yPosition = PDFSection(doc, yPosition, [
    { label: "Contact Assessment", value: formData.contactAssessment || "N/A" },
    { label: "Feedback/Complaint Type", value: metaTypes.find((t) => t.id == formData.feedbackTypeId)?.name || "N/A" },
    { label: "Comment", value: formData.comment || "N/A", fullWidth: true },
    { label: "Reviewed", value: formData.reviewed ? "Yes" : "No" },
    { label: "Informed Manager", value: formData.informedManager ? "Yes" : "No" },
    { label: "Informed Requester", value: formData.informedRequester ? "Yes" : "No" },
  ], "Categorization Summary");

  // Add type-specific fields to Categorization Summary conditionally
  if (formData.feedbackTypeId === "1" && formData.actionCheckbox) {
    console.log("Rendering Categorization Summary (Manager Assignment)");
    yPosition = PDFSection(doc, yPosition, [
      { label: "Action Taken", value: "I am sending the request for support to the relevant manager" },
      { label: "Assigned Manager", value: managers.find((m) => m.id == formData.assignManagerId)?.name || "N/A" },
      { label: "Send Method", value: formData.sendMethod || "N/A" },
    ], "Categorization Summary (Manager Assignment)");
  } else if (formData.feedbackTypeId === "2" && formData.actionCheckbox) {
    console.log("Rendering Categorization Summary (Feedback Response)");
    yPosition = PDFSection(doc, yPosition, [
      { label: "Action Taken", value: 'I am sending a personalised "thank you" response' },
      { label: "Send Method", value: formData.sendMethod || "N/A" },
    ], "Categorization Summary (Feedback Response)");
  } else if (formData.feedbackTypeId === "3" || formData.feedbackTypeId === "4") {
    console.log("Rendering Categorization Summary (Complaint Handling)");
    yPosition = PDFSection(doc, yPosition, [
      { label: "Programme Streams", value: formData.streamsProgram?.join(", ") || "N/A" },
      { label: "Operational Streams", value: formData.streamsOperational?.join(", ") || "N/A" },
      { label: "Action Taken", value: formData.actionTaken || "N/A" },
      { label: "Response Due Date", value: formData.responseDueDate || "N/A" },
      { label: "Complaint Status", value: formData.statusOfComplaint || "N/A" },
    ], "Categorization Summary (Complaint Handling)");
  }

  // Signature Section
  console.log("Rendering Signature Section");
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
    doc.text("Categorization Officer Signature", 150, yPosition + signatureHeight + 5);
    doc.text(`Name: ${user?.name || "N/A"}`, 150, yPosition + signatureHeight + 10);
  } catch (error) {
    console.error("Error loading signature:", error.message, error.stack);
    toast.error("❌ Failed to load signature in PDF. Check file path or format.");
    yPosition = checkPageOverflow(yPosition, 20);
    doc.setDrawColor(30, 64, 175);
    doc.line(150, yPosition, 200, yPosition);
    doc.text("Categorization Officer Signature", 150, yPosition + 8);
    doc.text(`Name: ${user?.name || "N/A"}`, 150, yPosition + 13);
  }
  yPosition += signatureHeight + 15;

  // Footer Note
  console.log("Rendering Footer Note");
  yPosition = checkPageOverflow(yPosition, 15);
  doc.setFontSize(6);
  doc.setTextColor(107, 114, 128);
  doc.text("Generated with FCRM System by www.irisxoft.com", 105, yPosition, { align: "center" });
  doc.text(`Page ${currentPage} of ${totalPages()}`, 105, yPosition + 5, { align: "center" });

  console.log("Saving PDF");
  doc.save("categorization.pdf");
};

export default generateCategorizationPDF;