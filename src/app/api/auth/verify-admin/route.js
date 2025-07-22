// app/api/auth/verify-admin/route.js
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check if user has admin claim
    const isAdmin = decodedToken.admin === true;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Not authorized as admin' }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      uid: decodedToken.uid,
      isAdmin: true 
    });

  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}