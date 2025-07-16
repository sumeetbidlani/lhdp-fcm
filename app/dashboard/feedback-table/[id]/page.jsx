// File: /app/dashboard/feedback/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, BadgeCheck, ArrowLeft, ChevronRight } from "lucide-react";

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [metaTypes, setMetaTypes] = useState([]);
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
     sendMethod: "",
     streamsProgram: [],
     streamsOperational: [],
     actionTaken: "",
     responseDueDate: "",
     statusOfComplaint: ""
   });

  useEffect(() => {
    fetch(`/api/feedback/${id}`)
      .then(res => res.json())
      .then(data => {
        setComplaint(data.complaint);
        setLogs(data.logs || []);
        setLoading(false);
      
        
        // Pre-fill existing data into formData
        setFormData(prev => ({
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
          reviewed: false
        }));

        // Calculate response due date from date_received
        if (data.complaint?.date_received) {
          const date = new Date(data.complaint.date_received);
          let added = 0;
          while (added < 7) {
            date.setDate(date.getDate() + 1);
            const day = date.getDay();
            if (day !== 6 && day !== 0) added++;
          }
          const formattedDate = date.toISOString().split("T")[0];
          setFormData(prev => ({ ...prev, responseDueDate: formattedDate }));
        }
      });

    fetch("/api/feedback/meta")
      .then(res => res.json())
      .then(data => setMetaTypes(data.types || []));
      
  }, [id]);


  const isValidStep1 = !!formData.contactAssessment;
  const isValidStep2 = formData.feedbackTypeId && formData.comment.trim();
  const selectedType = metaTypes.find(t => t.id === parseInt(formData.feedbackTypeId));

  const simpleContact = formData.contactAssessment === "No (the contact details are fake)";
  const complexContact = [
    "There are no contact details (Anonymous)",
    "Yes (the contact details are correct)",
    "The same complaint/feedback by same person already exists",
    "The same complaint/feedback by another person already exists"
  ].includes(formData.contactAssessment);

  const StepIndicator = () => (
    <div className="flex gap-3 mb-6">
      {[1, 2, 3].map(s => (
        <div key={s} className={`px-4 py-1 rounded-full text-sm font-medium ${step === s ? "bg-blue-600 text-white" : step > s ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}>
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
            <input type="checkbox" checked={formData.actionCheckbox} onChange={e => setFormData(prev => ({ ...prev, actionCheckbox: e.target.checked }))} />
            I am sending the request for support to the relevant manager
          </label>
        
        {formData.actionCheckbox && (
  <>
    {/* Manager Selection */}
    <label className="block mt-3 text-sm font-medium">Assign Manager</label>
    <select
      className="w-full border rounded p-2"
      value={formData.assignManagerId}
      onChange={(e) =>
        setFormData((prev) => ({ ...prev, assignManagerId: e.target.value }))
      }
    >
      <option value="">Select Manager</option>
      <option value="1">Manager A</option>
      <option value="2">Manager B</option>
    </select>

    {/* Inform Manager */}
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

    {/* Inform Requester */}
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
            <input type="checkbox" checked={formData.actionCheckbox} onChange={e => setFormData(prev => ({ ...prev, actionCheckbox: e.target.checked }))} />
            I am sending a personalised "thank you" response
          </label>
          {formData.actionCheckbox && (
            <>
              <label className="block mt-3 text-sm">Sending Method</label>
              <select className="w-full border rounded p-2" value={formData.sendMethod} onChange={e => setFormData(prev => ({ ...prev, sendMethod: e.target.value }))}>
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

    if (selectedType.id === 3 || 4) {
      return (
       <>
    {/* === PROGRAMMING STREAMS === */}
    <label className="block mt-3 text-sm font-medium">
      Programming Stream <span className="text-red-500">*</span>
    </label>
    <p className="text-xs text-gray-500 mb-2">
      We need to assign Programme Stream/s to the feedback and complaints. It will help us quickly know which streams attract what type of feedback and complaints at the analysis stage. The categories are not absolute.
    </p>
    <div className="grid grid-cols-2 gap-2">
      {[
        "Cash Programming",
        "WASH Programme",
        "Emergency Food Security and Livelihoods (EFSL)",
        "Shelter",
        "Protection",
        "Other:"
      ].map((v, i) => (
        <label key={i} className="flex items-center gap-2">
          <input
            type="checkbox"
            value={v}
            checked={formData.streamsProgram.includes(v)}
            onChange={(e) => {
              const value = e.target.value;
              setFormData((prev) => ({
                ...prev,
                streamsProgram: prev.streamsProgram.includes(value)
                  ? prev.streamsProgram.filter((x) => x !== value)
                  : [...prev.streamsProgram, value]
              }));
            }}
          />
          {v}
        </label>
      ))}
    </div>

    {/* === OPERATIONAL STREAMS === */}
    <label className="block mt-6 text-sm font-medium">
      Operational Streams <span className="text-red-500">*</span>
    </label>
    <p className="text-xs text-gray-500 mb-2">
      We need to assign an Operational Stream/s to the feedback and complaints. You may choose multiple.
    </p>
    <div className="grid grid-cols-2 gap-2">
      {[
        "Beneficiary Selection and Registration",
        "Distribution/Delivery of Tangible Goods and Services",
        "Quality of Tangible Goods and Services (e.g., cash, kits, livestock vaccination)",
        "Quality of Intangible Services (e.g., training, awareness, etc.)",
        "Quantity Issues",
        "Timing",
        "Code of Conduct Issues",
        "Conflict of Interest",
        "Compliance to law and law enforcement agencies",
        "Other:"
      ].map((v, i) => (
        <label key={i} className="flex items-center gap-2">
          <input
            type="checkbox"
            value={v}
            checked={formData.streamsOperational.includes(v)}
            onChange={(e) => {
              const value = e.target.value;
              setFormData((prev) => ({
                ...prev,
                streamsOperational: prev.streamsOperational.includes(value)
                  ? prev.streamsOperational.filter((x) => x !== value)
                  : [...prev.streamsOperational, value]
              }));
            }}
          />
          {v}
        </label>
      ))}
    </div>

    {/* === ACTION TAKEN === */}
    <label className="block mt-6 text-sm font-medium">
      What are the actions you are taking now? <span className="text-red-500">*</span>
    </label>
    <p className="text-xs text-gray-500 mb-2">
      Please list actions taken. You may select typical actions or write custom ones.
    </p>
    <select
      className="w-full border rounded p-2"
      value={formData.actionTaken}
      onChange={(e) => setFormData((prev) => ({ ...prev, actionTaken: e.target.value }))}
    >
      <option value="">Select</option>
      <option value="reg_ack">Registered the issue and sending registration number with acknowledgment</option>
      <option value="reg_no_ack">Registered but cannot send acknowledgment (anonymous/fake contact)</option>
      <option value="to_crc">Sending to Complaint Reference Committee (CRC)</option>
      <option value="to_ed">Sending to ED for information (major dissatisfaction)</option>
      <option value="other">Other</option>
    </select>

    {/* === RESPONSE DUE DATE (auto-set from Received Date) === */}
    <label className="block mt-6 text-sm font-medium">
      When is the response due? <span className="text-red-500">*</span>
    </label>
    <p className="text-xs text-gray-500 mb-2">
      Automatically calculated 7 working days (excluding Saturday/Sunday) from complaint received date.
    </p>
    <input
      type="date"
      className="w-full border rounded p-2"
      value={formData.responseDueDate}
      onChange={(e) => setFormData((prev) => ({ ...prev, responseDueDate: e.target.value }))}
    />

    {/* === STATUS === */}
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
      <option value="registered">Registered</option>
      <option value="to_crc">Sent to Complaint Reference Committee (CRC)</option>
      <option value="crc_closed">CRC closed without investigation</option>
      <option value="crc_investigation">CRC sent for investigation</option>
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
      <button onClick={() => router.back()} className="text-blue-500 mb-4 flex items-center"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>

      <details close className="mb-6 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
        <summary className="font-bold text-lg text-gray-800 dark:text-white mb-2">📄 Complaint Details</summary>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4">
          <Item label="Complaint Code" value={complaint.complaint_code} />
          <Item label="Project" value={complaint.project} />
          <Item label="Source" value={complaint.source} />
          <Item label="Type" value={complaint.type || "-"} />
          <Item label="Date Received" value={new Date(complaint.date_received).toLocaleDateString()} />
          <Item label="Location" value={complaint.location} />
          <Item label="Contact Name" value={complaint.anonymous ? "(Anonymous)" : complaint.contact_name || "-"} />
          <Item label="Phone" value={complaint.anonymous ? "(Hidden)" : complaint.contact_phone || "-"} />
          <Item label="Submitted By" value={complaint.user_name} />
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">📝 Summary (English):</p>
          <p className="text-gray-800 dark:text-gray-200 text-sm border p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            {complaint.summary_en}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">📝 Summary (Urdu):</p>
          <p className="text-gray-800 dark:text-gray-200 text-sm border p-3 rounded-lg bg-gray-50 dark:bg-gray-800" dir="rtl">
            {complaint.summary_ur}
          </p>
        </div>

        {complaint.attachments?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">📎 Attachments</h3>
            <ul className="space-y-2">
              {complaint.attachments.map((a, i) => (
                <li key={i} className="flex justify-between items-center border p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex flex-col">
                    <a href={a.filename} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline dark:text-blue-400 font-medium">
                      {a.filename.split("/").pop()}
                    </a>
                    {a.description && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{a.description}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <span className={`inline-flex items-center gap-1 text-sm px-4 py-1 rounded-full font-semibold ${statusClass(complaint.status)}`}>
            <BadgeCheck className="w-4 h-4" /> {complaint.status.replace("_", " ")}
          </span>
        </div>
      </details>



      <div className="bg-white p-6 rounded shadow border">
        <h2 className="text-xl font-bold mb-4">⚙️ Categorize Complaint</h2>
        <StepIndicator />

        {step === 1 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Contact Assessment</label>
            {["There are no contact details (Anonymous)", "Yes (the contact details are correct)", "No (the contact details are fake)", "The same complaint/feedback by same person already exists", "The same complaint/feedback by another person already exists"].map((v, i) => (
              <label key={i} className="block">
                <input type="radio" name="contact" value={v} checked={formData.contactAssessment === v} onChange={e => setFormData(prev => ({ ...prev, contactAssessment: e.target.value }))} /> {v}
              </label>
            ))}
            <button disabled={!isValidStep1} onClick={() => setStep(2)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded flex items-center">Next <ChevronRight className="ml-2" size={16} /></button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium">Feedback/Complaint Type</label>
            <select className="w-full border rounded p-2" value={formData.feedbackTypeId} onChange={e => setFormData(prev => ({ ...prev, feedbackTypeId: e.target.value }))}>
              <option value="">Select type</option>
              {metaTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            {renderAdditionalFields()}

            <label className="block mt-3 text-sm font-medium">Comment</label>
            <textarea className="w-full p-2 border rounded" value={formData.comment} onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}></textarea>

            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(1)} className="text-sm text-gray-600 underline">Back</button>
              <button disabled={!isValidStep2} onClick={() => setStep(3)} className="px-4 py-2 bg-blue-600 text-white rounded">Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
          {step === 3 && (
            <div className="space-y-6">
              {/* Complaint Summary */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-3">📋 Complaint Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <Item label="Complaint Code" value={complaint.complaint_code} />
                  <Item label="Project" value={complaint.project} />
                  <Item label="Source" value={complaint.source} />
                  <Item label="Type" value={complaint.type || "-"} />
                  <Item label="Date Received" value={new Date(complaint.date_received).toLocaleDateString()} />
                  <Item label="Location" value={complaint.location} />
                  <Item label="Contact Name" value={complaint.anonymous ? "(Anonymous)" : complaint.contact_name || "-"} />
                  <Item label="Phone" value={complaint.anonymous ? "(Hidden)" : complaint.contact_phone || "-"} />
                  <Item label="Submitted By" value={complaint.user_name} />
                </div>
              </div>

            {/* Categorization Summary */}
<div className="border rounded-lg p-4 bg-white dark:bg-gray-900 shadow">
  <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-3">⚙️ Categorization Summary</h3>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
    <Item label="Contact Assessment" value={formData.contactAssessment} />
    <Item label="Feedback/Complaint Type" value={metaTypes.find(t => t.id == formData.feedbackTypeId)?.name || "-"} />
    <Item label="Comment" value={formData.comment || "-"} />
    <Item label="Reviewed" value={formData.reviewed ? "Yes" : "No"} />
  </div>

  {/* Common Selected Action Info */}
  <div className="mt-4 border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
    <Item label="Informed Manager" value={formData.informedManager ? "Yes" : "No"} />
    {formData.informedManager && (
      <Item label="Method to Inform Manager" value={formData.managerMethod || "-"} />
    )}

    <Item label="Informed Requester" value={formData.informedRequester ? "Yes" : "No"} />
    {formData.informedRequester && (
      <Item label="Method to Inform Requester" value={formData.requesterMethod || "-"} />
    )}
  </div>

  {/* Feedback-Type-Specific Sections */}
  {formData.feedbackTypeId === "1" && formData.actionCheckbox && (
    <div className="mt-4 text-sm grid gap-2">
      <Item label="Action Taken" value="I am sending the request for support to the relevant manager" />
      <Item label="Assigned Project" value={formData.assignProjectId || "-"} />
      <Item label="Assigned Manager" value={formData.assignManagerId || "-"} />
      <Item label="Send Method" value={formData.sendMethod || "-"} />
    </div>
  )}

  {formData.feedbackTypeId === "2" && formData.actionCheckbox && (
    <div className="mt-4 text-sm grid gap-2">
      <Item label="Action Taken" value='I am sending a personalised "thank you" response' />
      <Item label="Send Method" value={formData.sendMethod || "-"} />
    </div>
  )}

  {formData.feedbackTypeId === "3" && (
    <div className="mt-4 text-sm grid gap-2">
      <Item label="Programme Streams" value={formData.streamsProgram?.join(", ") || "-"} />
      <Item label="Operational Streams" value={formData.streamsOperational?.join(", ") || "-"} />
      <Item label="Action Taken" value={formData.actionTaken || "-"} />
      <Item label="Response Due Date" value={formData.responseDueDate || "-"} />
      <Item label="Complaint Status" value={formData.statusOfComplaint || "-"} />
    </div>
  )}
</div>


              {/* Download & Final Review */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.reviewed}
                      onChange={e => setFormData(prev => ({ ...prev, reviewed: e.target.checked }))}
                    />
                    I have reviewed this complaint and am ready to close.
                  </label>

                  {/* <button
                  disabled={true}
                    onClick={() => generatePDF(complaint, formData)}
                    className="text-sm px-4 py-2 rounded bg-red-400 text-white hover:bg-red-400 transition"
                  >
                    📥 Download PDF
                  </button> */}
                </div>

      <div className="flex justify-between">
        <button onClick={() => setStep(2)} className="text-sm text-gray-600 dark:text-gray-300 underline">
          Back
        </button>
        <button
          disabled={!formData.reviewed}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          Close Complaint
        </button>
      </div>
    </div>
  </div>
)}

          </div>
        )}
      </div>

      <div className="mt-6 bg-white p-6 rounded shadow border">
        <h3 className="text-lg font-semibold mb-3">🕓 Logs</h3>
        <ul className="text-sm space-y-2">
          {logs.map((log, i) => (
            <li key={i} className="flex justify-between">
              <span>{log.action} by <b>{log.actor_name}</b></span>
              <span className="text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
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
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || "-"}</p>
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
