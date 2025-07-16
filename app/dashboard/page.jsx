'use client';

import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/me').then(res => res.json()).then(setUser);
    fetch('/api/dashboard').then(res => res.json()).then(setStats);
  }, []);

  if (!user || !stats) return <div className="p-6">Loading your dashboard...</div>;

  const isAdmin = user.role === 'super_admin';
  const isManager = user.role === 'fcm_user';

  return (
    <div className="p-4 space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📊 Welcome, {user.name}</h1>

      {(isAdmin || isManager) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChartWidget title="Complaints by Status" data={stats.by_status} />
          <BarChartWidget title="Complaints by Type" data={stats.by_type} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(isAdmin || isManager) && <StatCard title="Total Complaints" value={stats.total} />}
        <StatCard title="My Complaints" value={stats.my_complaints} />
        {(isAdmin || isManager) && <StatCard title="Open Complaints" value={stats.open} />}
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow text-center hover:shadow-md transition">
      <h3 className="text-sm text-gray-500 dark:text-gray-300">{title}</h3>
      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{value}</p>
    </div>
  );
}

function BarChartWidget({ title, data }) {
  const labels = data.map(d => d.label);
  const values = data.map(d => d.value);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
      <h3 className="mb-3 text-sm text-gray-600 dark:text-gray-300 font-semibold">{title}</h3>
      <Bar
        data={{
          labels,
          datasets: [{
            label: title,
            data: values,
            backgroundColor: '#3B82F6',
          }]
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { ticks: { color: '#9CA3AF' } },
            y: { ticks: { color: '#9CA3AF' }, beginAtZero: true }
          }
        }}
      />
    </div>
  );
}
