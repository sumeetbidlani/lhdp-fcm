import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req, { params }) {
  const roleId = params.id;
  const [perms] = await pool.execute(`
    SELECT p.id, p.name, p.section,
           IF(rp.permission_id IS NOT NULL, 1, 0) AS assigned
    FROM permissions p
    LEFT JOIN role_permissions rp ON rp.permission_id = p.id AND rp.role_id = ?
    ORDER BY p.section, p.name
  `, [roleId]);

  return Response.json(perms);
}

export async function POST(req, { params }) {
  const roleId = params.id;
  const selectedPermissions = await req.json();

  await pool.execute(`DELETE FROM role_permissions WHERE role_id = ?`, [roleId]);

  for (const permId of selectedPermissions) {
    await pool.execute(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
      [roleId, permId]
    );
  }

  return Response.json({ success: true });
}

export async function PUT(req, { params }) {
  const roleId = params.id;
  const { permissionIds } = await req.json();

  await pool.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

  for (let pid of permissionIds) {
    await pool.execute('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [
      roleId,
      pid,
    ]);
  }

  return NextResponse.json({ message: 'Permissions updated' });
}
