import db from "@/lib/db";

export async function GET() {
  try {
    const [in_process_complaints] = await db.query(`
    SELECT 
      c.id, c.complaint_code, c.project, c.source, c.date_received, c.location, 
      c.anonymous, c.contact_name, c.contact_phone, c.summary_en, c.summary_ur, 
      c.status, c.created_at, c.updated_at, c.assign_manager_id, c.feedback_type_id, 
      u.name AS user_name, ft.name AS feedback_type_name
    FROM complaints c
    LEFT JOIN users u ON c.created_by = u.id
    LEFT JOIN feedback_types ft ON c.feedback_type_id = ft.id
    WHERE c.status= 'in_process'
  `);
    const [closed_complaints] = await db.query(`
    SELECT 
      c.id, c.complaint_code, c.project, c.source, c.date_received, c.location, 
      c.anonymous, c.contact_name, c.contact_phone, c.summary_en, c.summary_ur, 
      c.status, c.created_at, c.updated_at, c.assign_manager_id, c.feedback_type_id, 
      u.name AS user_name, ft.name AS feedback_type_name
    FROM complaints c
    LEFT JOIN users u ON c.created_by = u.id
    LEFT JOIN feedback_types ft ON c.feedback_type_id = ft.id
    WHERE c.status= 'close'
  `);
    const [waiting_for_response_complaints] = await db.query(`
   SELECT 
  c.id, c.complaint_code, c.project, c.source, c.date_received, c.location, 
  c.anonymous, c.contact_name, c.contact_phone, c.summary_en, c.summary_ur, 
  c.status, c.created_at, c.updated_at, c.assign_manager_id, c.feedback_type_id, 
  u.name AS user_name, ft.name AS feedback_type_name
FROM complaints c
LEFT JOIN users u ON c.created_by = u.id
LEFT JOIN feedback_types ft ON c.feedback_type_id = ft.id
WHERE (c.assign_manager_id IS NOT NULL OR c.status = 'to_crc')
  AND c.status != 'close'
    `);


 

    return Response.json({
      in_process_complaints,
      closed_complaints,
      waiting_for_response_complaints
    });
  } catch (error) {
    console.error("Meta fetch error:", error);
    return Response.json({ error: "Failed to load metadata" }, { status: 500 });
  }
}






