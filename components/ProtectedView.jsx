'use client';

export default function ProtectedView({ permissions = [], required, children }) {
  // Normalize to lowercase for safe comparison
  const normalizedPermissions = permissions.map(p => p?.toLowerCase());
  const requiredPermissions = Array.isArray(required)
    ? required.map(r => r.toLowerCase())
    : [required.toLowerCase()];

  const hasPermission = requiredPermissions.some(r => normalizedPermissions.includes(r));

  if (!hasPermission) return null;

  return <>{children}</>;
}
