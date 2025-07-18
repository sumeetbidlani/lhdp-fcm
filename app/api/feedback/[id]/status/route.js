import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PUT(req, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = params.id;
    const { status } = await req.json();

    if (!["in_process", "closed", "escalated"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await execute(`UPDATE complaints SET status = ? WHERE id = ?`, [status, id]);

    // Insert into complaint_logs table
    await execute(
      `INSERT INTO complaint_logs (complaint_id, action, user_id, created_at)
       VALUES (?, ?, ?, NOW())`,
      [id, `Status updated to ${status}`, user.id]
    );

    return NextResponse.json({ message: "Status updated" });
  } catch (err) {
    console.error("PUT /api/feedback/[id]/status error:", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
