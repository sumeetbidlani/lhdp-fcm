export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = jwt.verify(token, SECRET);

  let query = 'SELECT * FROM complaints';
  let params = [];

  if (user.role === 'register_user') {
    query += ' WHERE created_by = ?';
    params.push(user.id);
  }

  const [rows] = await db.execute(query, params);
  return NextResponse.json({ complaints: rows });
}
