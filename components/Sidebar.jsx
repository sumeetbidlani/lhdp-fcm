"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, FileText, Users, Shield, Settings, MessageSquare, Menu
} from 'lucide-react';

const menuByRole = {
  super_admin: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Register Complaint', href: '/dashboard/feedback', icon: MessageSquare },
    { label: 'Complaints', href: '/dashboard/feedback-table', icon: FileText },
    { label: 'In-Process Complaints', href: '/dashboard/in-process-complaints', icon: FileText },
    { label: 'Closed Complaints', href: '/dashboard/closed-complaints', icon: FileText },
    { label: 'Waiting for Response', href: '/dashboard/waiting-for-response', icon: FileText },
    { label: 'Users', href: '/dashboard/users', icon: Users },
    { label: 'Roles', href: '/dashboard/roles', icon: Shield },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  fcm_user: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Register Complaint', href: '/dashboard/feedback', icon: MessageSquare },
    { label: 'Complaints', href: '/dashboard/feedback-table', icon: FileText },
    { label: 'In-Process Complaints', href: '/dashboard/in-process-complaints', icon: FileText },
    { label: 'Closed Complaints', href: '/dashboard/closed-complaints', icon: FileText },
    { label: 'Waiting for Response', href: '/dashboard/waiting-for-response', icon: FileText },
  ],
  registered_user: [
    { label: 'Register Complaint', href: '/dashboard/feedback', icon: MessageSquare },
    // { label: 'My Complaints', href: '/dashboard/my-complaints', icon: FileText },
  ],
};

export default function Sidebar() {
  const [role, setRole] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => setRole(data?.role || 'guest'))
      .catch(() => setRole('guest'));
  }, []);

  if (!role) return null;
  const items = menuByRole[role] || [];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow"
      >
        <Menu className="w-5 h-5 text-gray-800 dark:text-white" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-4 left-4 lg:left-0 z-50 transition-transform duration-300 ease-in-out
        bg-white dark:bg-gray-900 shadow-xl w-64 h-[80vh] rounded-2xl rounded-b-[2rem]
        overflow-hidden transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}
      >
        <div className="flex flex-col h-full p-4 overflow-y-auto">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">📌 LHDP FCM</h2>
          <nav className="space-y-2">
            {items.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
                    ${active
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}