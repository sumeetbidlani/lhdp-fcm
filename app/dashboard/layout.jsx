// app/dashboard/layout.jsx
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />

<div className="p-6 mb-6 bg-white dark:bg-black text-gray-900 dark:text-white shadow-md rounded-xl">
  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
    <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
    <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">
      LHDP Feedback & Complaint Dashboard
    </h1>
  </div>
</div>

        
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
