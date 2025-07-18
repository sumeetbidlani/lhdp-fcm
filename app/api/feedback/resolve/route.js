import db from '@/lib/db';
import { withTransaction } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req) {
  try {
    const user = await getSessionUser();
    if (!user || !user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const formData = await req.formData();
    const complaintId = formData.get('complaintId');
    const report = formData.get('report');
    const attachment = formData.get('attachment');

    if (!complaintId || !report) {
      return new Response(JSON.stringify({ error: 'Missing required fields (complaintId and report)' }), { status: 400 });
    }

    const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' '); // e.g., '2025-07-18 14:38:00'

    const result = await withTransaction(async (conn) => {
      // Update complaint status
      await conn.query(
        `UPDATE complaints SET status = 'close', updated_at = ?, actions_taken = ? WHERE id = ?`,
        [currentDateTime, report, complaintId]
      );

      // Handle attachment if provided
      let attachmentPath = null;
      if (attachment && typeof attachment.arrayBuffer === 'function') {
        const buffer = Buffer.from(await attachment.arrayBuffer());
        const ext = path.extname(attachment.name) || '.bin';
        const filename = `${Date.now()}-${path.basename(attachment.name, ext)}${ext}`;
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        const filepath = path.join(uploadsDir, filename);

        // Ensure uploads directory exists
        await fs.mkdir(uploadsDir, { recursive: true });
        await fs.writeFile(filepath, buffer);

        // Insert attachment record
        attachmentPath = `/uploads/${filename}`;
        await conn.query(
          `INSERT INTO complaint_attachments (complaint_id, file_path, description, file_type, created_at) 
           VALUES (?, ?, ?, ?, ?)`,
          [complaintId, attachmentPath, '', path.extname(attachment.name), currentDateTime]
        );
      }

      // Log the resolution
      await conn.query(
        `INSERT INTO complaint_logs (complaint_id, action, user_id, created_at) 
         VALUES (?, 'Resolved', ?, ?)`,
        [complaintId, user.id, currentDateTime]
      );

      return { success: true, attachmentPath };
    });

    return new Response(JSON.stringify({
      success: result.success,
      message: 'Complaint resolved and closed successfully',
      attachmentPath: result.attachmentPath,
    }), { status: 200 });
  } catch (error) {
    console.error('Resolve error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to resolve complaint',
      details: error.message,
    }), { status: 500 });
  }
}