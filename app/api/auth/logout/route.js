// /app/api/auth/logout/route.js

import { NextResponse } from 'next/server';

export async function POST(req) {
  const baseUrl = new URL(req.url).origin; // Get absolute origin
  const res = NextResponse.redirect(`${baseUrl}/`);

  res.cookies.set('next-auth.session-token', '', { maxAge: 0 });
  res.cookies.set('__Secure-next-auth.session-token', '', { maxAge: 0 });

  return res;
}
