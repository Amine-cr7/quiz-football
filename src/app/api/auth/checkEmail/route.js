// /app/api/auth/checkEmail/route.js

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const userRecord = await admin.auth().getUserByEmail(email);
    return NextResponse.json({ exists: true, uid: userRecord.uid });
  } catch (error) {
    console.error("Firebase error:", error);
    return NextResponse.json({ exists: false, error: error.message }, { status: 500 });
  }
}