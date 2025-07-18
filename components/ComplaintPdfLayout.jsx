// components/ComplaintPdfLayout.jsx
import React from "react";

const ComplaintPdfLayout = React.forwardRef(({ data }, ref) => {
  const {
    today,
    user,
    form,
    projects,
    sources,
    summaryUrdu,
  } = data;

  return (
    <div
      ref={ref}
      className="p-8 bg-white text-gray-800 w-[800px] font-[Montserrat]"
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-6 mb-6">
        <div>
          <svg className="h-14" viewBox="0 0 200 60">
            <rect x="10" y="10" width="40" height="40" rx="8" fill="#2a5c8f" />
            <text x="60" y="35" fontSize="24" fontWeight="bold" fill="#2a5c8f">
              LHDP
            </text>
            <text x="60" y="50" fontSize="12" fill="#666">
              Livelihood & Human Development Program
            </text>
          </svg>
        </div>
        <div className="text-right text-sm text-gray-600">
          Ref: LHDP-FCRM-2023-001
        </div>
      </div>

      {/* Title */}
      <h1 className="text-center text-[#2a5c8f] font-bold border-b pb-2 text-[15px]">
        Complaint / Feedback Report
      </h1>

      {/* Info Section */}
      <div className="grid grid-cols-2 gap-4 my-6 text-[12px]">
        <Field label="Date of Printing" value={today} />
        <Field label="Registered By" value={user?.name || "N/A"} />
        <Field
          label="Project"
          value={projects.find((p) => p.id === form.project)?.name || "N/A"}
        />
        <Field
          label="Source"
          value={sources.find((s) => s.id === form.source)?.name || "N/A"}
        />
        <Field label="Date Received" value={form.date_received || "N/A"} />
        <Field label="Location" value={form.location || "N/A"} />
      </div>

      {/* Complainant Info */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-semibold text-blue-800 mb-3 text-[13px]">
          Complainant Information
        </h2>
        <div className="grid grid-cols-2 gap-4 text-[12px]">
          <Field
            label="Name of Complainant"
            value={form.anonymous ? "Anonymous" : form.contact_name}
          />
          <Field
            label="Contact Name"
            value={form.anonymous ? "Hidden" : form.contact_name}
          />
          <div className="col-span-2">
            <Field
              label="Contact Phone"
              value={form.anonymous ? "Hidden" : form.contact_phone}
            />
          </div>
        </div>
      </div>

      {/* Summaries */}
      <div className="text-[12px] mb-6">
        <Field label="Summary (EN)" value={form.summary_en} height="80px" />
        <Field label="Summary (UR)" value={summaryUrdu} height="80px" />
      </div>

      {/* Signature */}
      <div className="mt-12 flex justify-end">
        <div className="text-center">
          <div className="border-t border-[#2a5c8f] w-52"></div>
          <p className="mt-1 text-sm">Authorized Signature</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-gray-400 text-xs text-center mt-8">
        This report is generated with FCRM System Created by www.irisxoft.com
      </div>
    </div>
  );
});

const Field = ({ label, value, height = "auto" }) => (
  <div className="field-group mb-2">
    <div className="font-semibold text-[#2a5c8f] text-[11px]">{label}</div>
    <div
      className="border rounded-md p-2 bg-gray-50 flex items-center text-[11px]"
      style={{ minHeight: height }}
    >
      {value}
    </div>
  </div>
);

export default ComplaintPdfLayout;
