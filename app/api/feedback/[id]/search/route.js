import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { execute } from '@/lib/db';

export async function GET(req) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      conditions.push("(c.complaint_code LIKE ? OR p.name LIKE ?)");
      values.push(`%${search}%`, `%${search}%`);
    }

    if (project) {
      conditions.push("p.name = ?");
      values.push(project);
    }

    if (status) {
      conditions.push("c.status = ?");
      values.push(status);
    }

    if (source) {
      conditions.push("s.name = ?");
      values.push(source);
    }

    if (dateFrom) {
      conditions.push("c.date_received >= ?");
      values.push(dateFrom);
    }

    if (dateTo) {
      conditions.push("c.date_received <= ?");
      values.push(dateTo);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await execute(
      `
      SELECT
        c.id,
        c.complaint_code,
        u.name AS registered_by,
        p.name AS project_name,
        c.date_received,
        c.created_at AS created_on,
        c.status,
        CASE
          WHEN c.anonymous = 1 THEN 'Anonymous'
          ELSE 'Not Anonymous'
        END AS anonymity_status,
        s.name AS source
      FROM complaints c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN feedback_projects p ON c.project = p.id
      LEFT JOIN feedback_sources s ON c.source = s.id
      ${whereClause}
      ORDER BY c.created_at DESC
      `,
      values
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/feedback error:", err);
    return NextResponse.json({ error: "Failed to load complaints" }, { status: 500 });
  }
}
