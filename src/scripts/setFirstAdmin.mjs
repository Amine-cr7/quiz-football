// scripts/setFirstAdmin.js
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const adminAuth = getAuth();

async function setFirstAdmin() {
  try {
    // Replace with your email address
    const email = 'laouraidiamine@gmail.com';
    
    console.log(`Setting up admin for: ${email}`);
    
    // Get user by email
    const user = await adminAuth.getUserByEmail(email);
    console.log(`Found user: ${user.uid}`);
    
    // Set admin custom claim
    await adminAuth.setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Admin claim set for ${email}`);
    
    // Verify the claim was set
    const updatedUser = await adminAuth.getUser(user.uid);
    console.log('Custom claims:', updatedUser.customClaims);
    
    console.log('\n🎉 Success! You can now:');
    console.log('1. Log out if you\'re currently logged in');
    console.log('2. Log back in with this email');
    console.log('3. Access /admin routes');
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ User not found. Please:');
      console.error('1. Create an account first through your app');
      console.error('2. Update the email in this script');
      console.error('3. Run the script again');
    } else {
      console.error('Error setting admin:', error);
    }
  }
}

setFirstAdmin();