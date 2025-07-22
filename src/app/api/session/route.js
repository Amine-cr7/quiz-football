// app/api/session/route.js
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(request) {
  const { idToken } = await request.json();

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const expiresIn = 60 * 60 * 24 * 5; // 5 days in seconds

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: '__session',
      value: idToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: '/',
      sameSite: 'strict',
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('__session');
  return response;
}