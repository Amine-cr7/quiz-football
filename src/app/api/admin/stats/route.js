// app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function GET() {
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

    // Fetch stats from Firestore
    const usersRef = adminDb.collection('users');
    const questionsRef = adminDb.collection('questions');
    const gamesRef = adminDb.collection('games');

    const [usersSnapshot, questionsSnapshot, gamesSnapshot] = await Promise.all([
      usersRef.get(),
      questionsRef.get(),
      gamesRef.get()
    ]);

    const stats = {
      totalUsers: usersSnapshot.size,
      totalQuestions: questionsSnapshot.size,
      totalGames: gamesSnapshot.size,
      recentActivity: [] // You can implement this based on your needs
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