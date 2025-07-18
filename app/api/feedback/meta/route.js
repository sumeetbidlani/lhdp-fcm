import db from "@/lib/db";

export async function GET() {
  try {
    const [projects] = await db.query("SELECT id, name FROM feedback_projects");
    const [sources] = await db.query("SELECT id, name FROM feedback_sources");
    const [types] = await db.query("SELECT id, name FROM feedback_types");
    const [managers] = await db.query("SELECT id, name FROM managers");

    return Response.json({
      projects,
      sources,
      managers,
      types
    });
  } catch (error) {
    console.error("Meta fetch error:", error);
    return Response.json({ error: "Failed to load metadata" }, { status: 500 });
  }
}
