// /app/api/auth/checkUsername/route.js
import { db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username || username.length < 3) {
      return new Response(JSON.stringify({ error: 'Username must be at least 3 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
    console.log(usernameDoc)
    return new Response(JSON.stringify({ available: !usernameDoc.exists() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return new Response(JSON.stringify({ error: 'Error checking username availability' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
