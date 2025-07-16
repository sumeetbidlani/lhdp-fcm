import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { randomBytes } from 'crypto';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function GET(req) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } 
    console.log("user---sssssss>",user);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const project = searchParams.get("project") || "";
    const status = searchParams.get("status") || "";
    const source = searchParams.get("source") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const conditions = [];
    const values = [];

    if (search) {
      conditions.push(`(c.complaint_code LIKE ? OR p.name LIKE ?)`);
      values.push(`%${search}%`, `%${search}%`);
    }
    if (project) {
      conditions.push(`p.name = ?`);
      values.push(project);
    }
    if (status) {
      conditions.push(`c.status = ?`);
      values.push(status);
    }
    if (source) {
      conditions.push(`s.name = ?`);
      values.push(source);
    }
    if (dateFrom) {
      conditions.push(`c.date_received >= ?`);
      values.push(dateFrom);
    }
    if (dateTo) {
      conditions.push(`c.date_received <= ?`);
      values.push(dateTo);
    }

    if (user.role === 'registered_user') {
      conditions.push(`c.created_by = ?`);
      values.push(user.id);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT
        c.id,
        c.complaint_code,
        u.name AS registered_by,
        p.name AS project_name,
        s.name AS source_name,
        c.date_received,
        c.created_at AS created_on,
        c.status,
        CASE WHEN c.anonymous = 1 THEN 'Anonymous' ELSE 'Not Anonymous' END AS anonymity_status
      FROM complaints c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN feedback_projects p ON c.project = p.id
      LEFT JOIN feedback_sources s ON c.source = s.id
      ${whereClause}
      ORDER BY c.created_at DESC
    `;

    const rows = await execute(query, values);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/feedback error:", err);
    return NextResponse.json({ error: 'Failed to load complaints' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();

    const project = formData.get("project");
    const source = formData.get("source");
    const date_received = formData.get("date_received");
    const location = formData.get("location");
    const anonymous = formData.get("anonymous") === "true";
    const contact_name = formData.get("contact_name");
    const contact_phone = formData.get("contact_phone");
    const summary_en = formData.get("summary_en");
    const summary_ur = formData.get("summary_ur");

    const files = formData.getAll("files[]");
    const descriptions = formData.getAll("descriptions[]");

    const complaint_code = `CMP-${randomBytes(4).toString("hex").toUpperCase()}`;
    const status = "new";

    const insertQuery = `
      INSERT INTO complaints (
        complaint_code,
        project,
        source,
        date_received,
        location,
        anonymous,
        contact_name,
        contact_phone,
        summary_en,
        summary_ur,
        created_by,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await execute(insertQuery, [
      complaint_code,
      project,
      source,
      date_received,
      location,
      anonymous,
      anonymous ? null : contact_name,
      anonymous ? null : contact_phone,
      summary_en,
      summary_ur,
      user.id,
      status
    ]);

    const complaintId = result.insertId;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await Promise.all(
      files.map(async (file, index) => {
        if (!file || typeof file.arrayBuffer !== "function") return;

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = path.extname(file.name);
        const filename = `${uuidv4()}${ext}`;
        const filepath = path.join(uploadsDir, filename);

        await writeFile(filepath, buffer);

        await execute(
          `INSERT INTO complaint_attachments (complaint_id, file_path, description) VALUES (?, ?, ?)`,
          [complaintId, `/uploads/${filename}`, descriptions[index] || ""]
        );
      })
    );

    return NextResponse.json({ message: "Complaint submitted successfully", complaint_code });
  } catch (err) {
    console.error("POST /api/feedback error:", err);
    return NextResponse.json({ error: "Failed to submit complaint" }, { status: 500 });
  }
}
