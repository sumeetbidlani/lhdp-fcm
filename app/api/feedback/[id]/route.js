// File: app/api/feedback/[id]/route.js

import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function GET(req, context) {
  try {
    const id = context.params.id;
    // Fetch complaint details with correct column names
    const [complaint] = await execute(
      `
      SELECT 
        c.*,
        u.name AS user_name,
        p.name AS project,
        s.name AS source
      FROM complaints c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN feedback_projects p ON c.project = p.id
      LEFT JOIN feedback_sources s ON c.source = s.id
      WHERE c.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Fetch complaint attachments
    const attachments = await execute(
      `SELECT file_path AS filename, description FROM complaint_attachments WHERE complaint_id = ?`,
      [id]
    );
    complaint.attachments = attachments;

    // Fetch activity logs
    const logs = await execute(
      `
      SELECT 
        l.action,
        l.created_at,
        u.name AS actor_name
      FROM complaint_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.complaint_id = ?
      ORDER BY l.created_at ASC
      `,
      [id]
    );

    return NextResponse.json({
      complaint,
      logs,
    });
  } catch (error) {
    console.error("Error fetching complaint details:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
