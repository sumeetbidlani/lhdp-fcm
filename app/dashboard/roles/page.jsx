'use client';

import { useEffect, useState } from 'react';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [assigned, setAssigned] = useState({});

useEffect(() => {
  fetch('/api/roles')
    .then((res) => res.json())
    .then((data) => {
  console.log("Roles API Response:", data);
  setRoles(data.roles || []);
});
}, []);


  const loadPermissions = (roleId) => {
    setSelectedRole(roleId);
    fetch(`/api/roles/${roleId}/permissions`)
      .then((res) => res.json())
      .then((data) => {
        setPermissions(data);
        const initial = {};
        data.forEach((p) => {
          initial[p.id] = p.assigned;
        });
        setAssigned(initial);
      });
  };

  const togglePermission = (permId) => {
    setAssigned((prev) => ({ ...prev, [permId]: !prev[permId] }));
  };

  const toggleSection = (sectionName, value) => {
    const updated = { ...assigned };
    permissions.forEach((p) => {
      if (p.section === sectionName) {
        updated[p.id] = value;
      }
    });
    setAssigned(updated);
  };

  const handleSubmit = async () => {
    await fetch(`/api/roles/${selectedRole}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.keys(assigned).filter((pid) => assigned[pid])),
    });
    alert('✅ Permissions updated successfully!');
  };

  const groupBySection = () => {
    const grouped = {};
    permissions.forEach((p) => {
      if (!grouped[p.section]) grouped[p.section] = [];
      grouped[p.section].push(p);
    });
    return grouped;
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6">
      {/* Role List */}
      <div className="w-full md:w-1/4 border-r pr-4">
        <h2 className="text-lg font-bold mb-3">User Roles</h2>
        <ul className="space-y-1">
          {roles.map((r) => (
            <li
              key={r.id}
              onClick={() => loadPermissions(r.id)}
              className={`cursor-pointer px-4 py-2 rounded transition font-medium ${
                selectedRole === r.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {r.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Permission Assignment */}
      <div className="w-full md:w-3/4">
        {selectedRole ? (
          <>
            <h2 className="text-xl font-bold mb-4">Manage Permissions</h2>
            <div className="space-y-6">
              {Object.entries(groupBySection()).map(([section, perms]) => (
                <div key={section} className="border p-4 rounded bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold capitalize">{section}</h3>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={perms.every((p) => assigned[p.id])}
                        onChange={(e) => toggleSection(section, e.target.checked)}
                      />
                      Select All
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {perms.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={assigned[p.id] || false}
                          onChange={() => togglePermission(p.id)}
                        />
                        {p.name.replaceAll('_', ' ')}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-500 mt-4">Please select a role to manage permissions.</p>
        )}
      </div>
    </div>
  );
}
