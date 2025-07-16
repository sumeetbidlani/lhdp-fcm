// /app/api/dashboard/route.js
import { getSessionUser } from '@/lib/auth';
import { execute } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = {
      total: 0,
      my_complaints: 0,
      open: 0,
      by_status: [],
      by_type: [],
    };

    if (user.role !== 'registered_user') {
      const totalRow = await execute(`SELECT COUNT(*) AS total FROM complaints`);
      stats.total = totalRow[0]?.total || 0;

      const openRow = await execute(`SELECT COUNT(*) AS open FROM complaints WHERE status != 'closed'`);
      stats.open = openRow[0]?.open || 0;

      const statusRows = await execute(`SELECT status AS label, COUNT(*) AS value FROM complaints GROUP BY status`);
      stats.by_status = statusRows;

      const typeRows = await execute(`SELECT type AS label, COUNT(*) AS value FROM complaints GROUP BY type`);
      stats.by_type = typeRows;
    }

    const myRow = await execute(
      `SELECT COUNT(*) AS my FROM complaints WHERE created_by = ?`,
      [user.id]
    );
    stats.my_complaints = myRow[0]?.my || 0;

    return NextResponse.json(stats);
  } catch (err) {
    console.error('Dashboard API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
