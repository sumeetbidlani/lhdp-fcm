import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  const [rows] = await pool.query('SELECT id, name, email,  created_at FROM users ORDER BY id DESC');
  return NextResponse.json({ users: rows });
}

export async function POST(req) {
  try {
    const { name, email, password, role } = await req.json();
    const hashed = await bcrypt.hash(password, 10);

    await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, role]
    );

    return NextResponse.json({ message: 'User added successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 });
  }
}
