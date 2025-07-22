import { adminDb, FieldValue } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { questions } = await request.json();
    const batch = adminDb.batch();
    
    questions.forEach(question => {
      const docRef = adminDb.collection('questions').doc();
      batch.set(docRef, {
        ...question,
        createdAt: FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    return NextResponse.json({ success: true, count: questions.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}