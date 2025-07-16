import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  try {
    await pool.execute('INSERT INTO roles (name) VALUES (?)', [name]);
    return NextResponse.json({ message: 'Role added' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to add role' }, { status: 500 });
  }
}
