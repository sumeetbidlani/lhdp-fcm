import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
console.log('userId from query:', req.nextUrl.searchParams.get('userId'));
  const [permissions] = await pool.execute(`
    SELECT p.name FROM permissions p
    JOIN role_permissions rp ON rp.permission_id = p.id
    JOIN users u ON u.role_id = rp.role_id
    WHERE u.id = ?
  `, [userId]);

  const allowed = permissions.map(p => p.name);
  return NextResponse.json({ permissions: allowed });
}
