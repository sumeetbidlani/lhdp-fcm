import { NextResponse } from 'next/server';
import { execute, withTransaction } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req, context) {
  try {
    const { params } = await context;
    const { id } = params;

    const user = await getSessionUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    console.log("user", user);
    console.log("data", data);

    const requiredFields = ['contactAssessment', 'feedbackTypeId', 'comment'];
    const missingFields = requiredFields.filter(field => !data[field] && data[field] !== 0);
    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(', ')}` }, { status: 400 });
    }

    const sanitizedData = {
      contactAssessment: data.contactAssessment || null,
      feedbackTypeId: data.feedbackTypeId ? parseInt(data.feedbackTypeId) : null,
      comment: data.comment || null,
      assignProjectId: data.assignProjectId ? parseInt(data.assignProjectId) : null,
      assignManagerId: data.assignManagerId ? parseInt(data.assignManagerId) : null,
      managerMethod: data.managerMethod || null,
      requesterMethod: data.requesterMethod || null,
      sendMethod: data.sendMethod || null,
      informedManager: data.informedManager ? 1 : 0,
      informedRequester: data.informedRequester ? 1 : 0,
      programmingStreams: data.streamsProgram && data.streamsProgram.length > 0 ? JSON.stringify(data.streamsProgram) : null,
      operationalStreams: data.streamsOperational && data.streamsOperational.length > 0 ? JSON.stringify(data.streamsOperational) : null,
      actionTaken: data.actionTaken || null,
      responseDueDate: data.responseDueDate || null,
      statusOfComplaint: data.statusOfComplaint || null,
    };

    let status = "close"; // Default status
    if (sanitizedData.feedbackTypeId === 1) {
      status = "send_relevant_manager"; // Send to Relevant Manager keeps it in process
    } else if (sanitizedData.feedbackTypeId === 2) {
      status = "close"; // Close Feedback
    } else if ((sanitizedData.feedbackTypeId === 3 || sanitizedData.feedbackTypeId === 4) && sanitizedData.statusOfComplaint === "to_crc") {
      status = "to_crc"; // Send to CRC
    } else {
      status = "close"; // Default to closed for other cases
    }

    const currentDateTime = '2025-07-18 11:10:00'; // Current timestamp (11:10 AM PKT)

    const result = await withTransaction(async (conn) => {
      await conn.execute(
        `UPDATE complaints 
         SET contact_assessment = ?,
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
             status = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          sanitizedData.contactAssessment,
          sanitizedData.feedbackTypeId,
          sanitizedData.comment,
          sanitizedData.assignProjectId,
          sanitizedData.assignManagerId,
          sanitizedData.managerMethod,
          sanitizedData.requesterMethod,
          sanitizedData.sendMethod,
          sanitizedData.informedManager,
          sanitizedData.informedRequester,
          sanitizedData.programmingStreams,
          sanitizedData.operationalStreams,
          sanitizedData.actionTaken,
          sanitizedData.responseDueDate,
          status,
          id
        ]
      );

      await conn.execute(
        `INSERT INTO complaint_logs (complaint_id, action, user_id, created_at) 
         VALUES (?, ?, ?, ?)`,
        [id, `Complaint categorized with status: ${status}`, user.id, currentDateTime]
      );

      return { success: true, complaintId: id };
    });

    return NextResponse.json({
      success: result.success,
      complaintId: result.complaintId,
      message: `Complaint categorized with status: ${status}`,
      timestamp: currentDateTime
    });
  } catch (error) {
    const currentDateTime = '2025-07-18 11:10:00'; // Ensure it's defined in catch block
    console.error("Error saving categorization:", error.stack);
    return NextResponse.json({
      error: "Failed to save categorization data",
      details: error.message,
      timestamp: currentDateTime
    }, { status: 500 });
  }
}