'use client';
import ThemeToggle from './ThemeToggle';
import { useRouter } from 'next/navigation';
import { LogOut, Bell } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();

const logout = async () => {
  await fetch('/api/auth/logout', {
    method: 'POST',
  });
  router.push('/');
};
  return (
    <header className="bg-white dark:bg-gray-800 px-4 py-3 flex justify-between items-center border-b dark:border-gray-700 shadow-sm">
      <h1 className="text-lg font-semibold text-gray-800 dark:text-white">📋 Dashboard</h1>

      <div className="flex items-center gap-4">
        <button className="relative">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500"></span>
        </button>

        <ThemeToggle />

        <button
          onClick={logout}
          className="flex items-center text-sm px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
        >
          <LogOut className="w-4 h-4 mr-1" /> Logout
        </button>
      </div>
    </header>
  );
}
