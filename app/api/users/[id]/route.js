import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(req, { params }) {
  try {
    const { name, email, role } = await req.json();
    await pool.execute('UPDATE users SET name=?, email=?, role=? WHERE id=?', [
      name, email, role, params.id,
    ]);
    return NextResponse.json({ message: 'User updated' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [params.id]);
    return NextResponse.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
