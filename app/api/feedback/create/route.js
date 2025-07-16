import { getUserFromRequest } from '@/lib/auth';
import { execute } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const code = 'CMP-' + Date.now();
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const result = await execute(
      `INSERT INTO complaints (complaint_code, project, source, date_received, type, location, anonymous, contact_name, contact_phone, summary_en, summary_ur, created_by, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
      [
        code,
        data.project,
        data.source,
        data.date_received,
        data.type,
        data.location,
        data.anonymous ? 1 : 0,
        data.contact_name,
        data.contact_phone,
        data.summary_en,
        data.summary_ur,
        user.id,
        createdAt
      ]
    );

    return NextResponse.json({ complaintId: result.insertId });
  } catch (err) {
    console.error('Error creating complaint:', err);
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
  }
}
