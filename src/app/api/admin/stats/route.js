// app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('__session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify admin token
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch statistics from Firestore
    const [questionsSnapshot, categoriesSnapshot, usersSnapshot, gamesSnapshot] = await Promise.all([
      adminDb.collection('questions').get(),
      adminDb.collection('categories').get(),
      adminDb.collection('users').get(),
      adminDb.collection('games').get()
    ]);

    const stats = {
      totalQuestions: questionsSnapshot.size,
      totalCategories: categoriesSnapshot.size,
      totalUsers: usersSnapshot.size,
      totalGames: gamesSnapshot.size
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
      details: error.message 
    }, { status: 500 });
  }
}