// /lib/auth.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// /lib/auth.js
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { execute } from './db';
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}
// Add this new one
export async function getUserFromRequest() {
  // const cookieStore = cookies();
  const cookieStore = await cookies(); // ✅ Await it
  const token = cookieStore.get('token')?.value;
  // const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [user] = await execute(
      `SELECT u.id, u.name, u.email, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? LIMIT 1`,
      [decoded.id]
    );
    console.log("user--->",user);
    return user || null;
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }
}