import { adminDb, FieldValue } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

// Get all questions
export async function GET() {
  try {
    const snapshot = await adminDb.collection('questions').get();
    const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Add new question
export async function POST(request) {
  try {
    const questionData = await request.json();
    const docRef = await adminDb.collection('questions').add({
      ...questionData,
      createdAt: FieldValue.serverTimestamp()
    });
    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update question
export async function PUT(request) {
  try {
    const { id, ...questionData } = await request.json();
    await adminDb.collection('questions').doc(id).update(questionData);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete question
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    await adminDb.collection('questions').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}