import { NextResponse } from "next/server";
import { execute } from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const logs = await execute(
      `SELECT * FROM complaint_logs WHERE complaint_id = ? ORDER BY created_at DESC`,
      [params.id]
    );
    return NextResponse.json({ logs });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
