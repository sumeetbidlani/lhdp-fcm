import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const complaintId = params.id;
  const body = await request.json();

  const {
    type,
    priority,
    action_required,
    assigned_to,
    due_date,
    contact_validity,
    streams,
    updated_by
  } = body;

  try {
    const [result] = await pool.query(`
      UPDATE complaints
      SET type = ?, priority = ?, action_required = ?, assigned_to = ?, due_date = ?, status = 'in_progress', last_updated = NOW()
      WHERE id = ?
    `, [type, priority, action_required, assigned_to, due_date, complaintId]);

    await pool.query(`
      INSERT INTO complaint_logs (complaint_id, action, created_by)
      VALUES (?, ?, ?)
    `, [
      complaintId,
      `Marked In Progress by User ID ${updated_by} | Streams: ${streams.join(', ')} | Contact: ${contact_validity}`,
      updated_by
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
