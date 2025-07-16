'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [error, setError] = useState('');

  const handleLogin = async () => {
      const res = await signIn('credentials', {
        redirect: true,
        email,
        password,
        callbackUrl: '/dashboard',
      });
    if (res?.ok) {
      router.push('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3">
        {/* Info section - hidden on mobile */}
        <div className="hidden md:col-span-2 md:flex flex-col justify-between p-8 text-white bg-gradient-to-br from-blue-700 to-indigo-800 rounded-l-xl">
          <div>
            <h1 className="text-3xl font-bold">Welcome to LHDP Complaint System</h1>
            <p className="mt-4 text-sm">
              Manage feedback, complaints and users with ease. Built for transparency and efficiency.
            </p>
          </div>
          <div className="text-xs">© {new Date().getFullYear()} LHDP | All rights reserved.</div>
        </div>

        {/* Form section */}
        <div className="flex flex-col justify-center items-center p-8 bg-white dark:bg-gray-800 rounded-r-xl md:rounded-l-none shadow-xl relative">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <img src="/images/logo/LHDP_Logo.jpg" alt="LHDP Logo" className="w-16 mb-2" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">LHDP Admin Panel</h2>

          <div className="w-full glass-card p-6 space-y-4">
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
