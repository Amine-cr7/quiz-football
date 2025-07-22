// app/api/auth/set-admin/route.js
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(request) {
  try {
    const { uid, isAdmin } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, { admin: isAdmin });

    return NextResponse.json({ 
      success: true, 
      message: `Admin claim ${isAdmin ? 'granted' : 'revoked'} for user ${uid}` 
    });

  } catch (error) {
    console.error('Set admin claim error:', error);
    return NextResponse.json({ 
      error: 'Failed to set admin claim', 
      details: error.message 
    }, { status: 500 });
  }
}

// Optional: Get user's current claims
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    const user = await adminAuth.getUser(uid);
    const claims = user.customClaims || {};

    return NextResponse.json({ 
      success: true, 
      claims,
      isAdmin: claims.admin === true
    });

  } catch (error) {
    console.error('Get user claims error:', error);
    return NextResponse.json({ 
      error: 'Failed to get user claims', 
      details: error.message 
    }, { status: 500 });
  }
}