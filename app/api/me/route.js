// /app/api/me/route.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user from DB with role
  const users = await execute(
      `
  SELECT users.id, users.name, users.email, roles.name as role
  FROM users
  LEFT JOIN roles ON users.role_id = roles.id
  WHERE users.email = ?
  LIMIT 1
  `,
    [session.user.email]
  );

  const user = users[0];

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}
