// app/dashboard/feedback-table/page.jsx
import { Suspense } from "react";
import ComplaintListPage from "./ComplaintListPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading complaints...</div>}>
      <ComplaintListPage />
    </Suspense>
  );
}
