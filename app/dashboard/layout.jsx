// app/dashboard/layout.jsx
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
