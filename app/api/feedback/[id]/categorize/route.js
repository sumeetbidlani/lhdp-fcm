// File: /app/api/feedback/[id]/categorize/route.js
import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getSessionUser } from '@/lib/auth';

export async function POST(req, { params }) {
  
  
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    const data = await req.json();
    
    
    // Update complaint record
    await execute(
      `UPDATE complaints SET
        contact_assessment = ?,
        feedback_type_id = ?,
        comment = ?,
        assign_project_id = ?,
        assign_manager_id = ?,
        manager_method = ?,
        requester_method = ?,
        send_method = ?,
        informed_manager = ?,
        informed_requester = ?,
        programming_streams = ?,
        operational_streams = ?,
        action_taken = ?,
        response_due_date = ?,
        status_of_complaint = ?
      WHERE id = ?`,
      [
        data.contactAssessment,
        data.feedbackTypeId,
        data.comment,
        data.assignProjectId,
        data.assignManagerId,
        data.managerMethod,
        data.requesterMethod,
        data.sendMethod,
        data.informedManager ? 1 : 0,
        data.informedRequester ? 1 : 0,
        JSON.stringify(data.streamsProgram),
        JSON.stringify(data.streamsOperational),
        data.actionTaken,
        data.responseDueDate,
        data.statusOfComplaint,
        id
      ]
    );

    // Insert activity log
    await execute(
      `INSERT INTO complaint_logs (complaint_id, action, by_user_id) VALUES (?, ?, ?)`,
      [id, "Categorized/Processed Complaint",  user.id || 1] // Replace 1 with actual user ID from auth
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving categorization:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
