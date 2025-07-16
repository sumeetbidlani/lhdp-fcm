import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const id = params.id;
  const data = await request.json();

  const {
    action_taken,
    outcome,
    complainant_informed,
    notification_method,
    closing_notes,
    closed_by
  } = data;

  try {
    await pool.query(`
      UPDATE complaints
      SET status = 'closed',
          outcome = ?,
          complainant_informed = ?,
          notification_method = ?,
          closing_notes = ?,
          last_updated = NOW()
      WHERE id = ?
    `, [outcome, complainant_informed, notification_method, closing_notes, id]);

    await pool.query(`
      INSERT INTO complaint_logs (complaint_id, action, created_by)
      VALUES (?, ?, ?)
    `, [
      id,
      `Complaint closed: ${action_taken}`,
      closed_by
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Close Error:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
