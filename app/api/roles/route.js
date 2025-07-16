import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [roles] = await pool.execute('SELECT * FROM roles');
    return NextResponse.json({ roles });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}
