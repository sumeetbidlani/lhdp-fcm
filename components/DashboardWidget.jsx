export default function DashboardWidget({ title, value, icon }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow p-4 flex items-center space-x-4">
      <div className="text-blue-500">{icon}</div>
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
        <div className="text-xl font-semibold text-gray-800 dark:text-white">{value}</div>
      </div>
    </div>
  );
}
