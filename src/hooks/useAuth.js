// hooks/useAuth.js
'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Set session cookie
  const setSessionCookie = async (user) => {
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
    } catch (error) {
      console.error('Error setting session cookie:', error);
    }
  };

  // Check if email exists
  const checkEmailExists = async (email) => {
    try {
      const response = await fetch('/api/auth/checkEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data.exists;
    } catch (err) {
      throw new Error('Error checking email');
    }
  };

  // Check username availability
  const checkUsernameAvailable = async (username) => {
    try {
      const response = await fetch('/api/auth/checkUsername', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error('Failed to check username');
      }

      const data = await response.json();
      return data.available;
    } catch (err) {
      console.error('Error checking username:', err);
      return false;
    }
  };

  // Generate unique username
  const generateUniqueUsername = async (baseUsername) => {
    let finalUsername = baseUsername;
    let counter = 1;
    
    while (!(await checkUsernameAvailable(finalUsername))) {
      finalUsername = `${baseUsername}_${counter}`;
      counter++;
    }
    
    return finalUsername;
  };

  // Create user document
  const createUserDocument = async (user, userData) => {
    try {
      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });

      // Store username in usernames collection (only if username is provided)
      if (userData.username) {
        await setDoc(doc(db, 'usernames', userData.username.toLowerCase()), {
          uid: user.uid,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  };

  // Email login
  const handleLogin = async (email, password) => {
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp(),
      }, { merge: true });

      await setSessionCookie(user);
      
      // Check if user profile is complete
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (!userData?.profileComplete) {
        router.push('/profile-setup');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // Email signup
  const handleSignUp = async (email, username, password) => {
    setLoading(true);
    setError('');

    try {
      // Validate password
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create incomplete user document (will be completed in profile setup)
      await createUserDocument(user, {
        email: email,
        authMethod: 'email',
        profileComplete: false,
      });

      await setSessionCookie(user);
      router.push('/profile-setup');
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // Anonymous login
  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      // Generate anonymous username
      const anonymousUsername = `guest_${user.uid.slice(0, 8)}`;

      // Create user document - anonymous users skip profile setup
      await createUserDocument(user, {
        username: anonymousUsername,
        email: null,
        authMethod: 'anonymous',
        isAnonymous: true,
        profileComplete: true, // Anonymous users don't need profile setup
      });

      await setSessionCookie(user);
      router.push('/dashboard');
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // Google login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create incomplete user document for new Google users
        await createUserDocument(user, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          authMethod: 'google',
          profileComplete: false,
        });

        await setSessionCookie(user);
        router.push('/profile-setup');
      } else {
        // Update last login for existing users
        await setDoc(doc(db, 'users', user.uid), {
          lastLogin: serverTimestamp(),
        }, { merge: true });

        await setSessionCookie(user);
        
        // Check if profile is complete
        const userData = userDoc.data();
        if (!userData?.profileComplete) {
          router.push('/profile-setup');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // Complete profile setup
  const completeProfileSetup = async (username, nationality) => {
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Validate username
      if (!username || username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }

      // Check username availability
      const isAvailable = await checkUsernameAvailable(username);
      if (!isAvailable) {
        throw new Error('Username is already taken');
      }

      // Update Firebase profile
      await updateProfile(user, {
        displayName: username,
      });

      // Update user document
      await setDoc(doc(db, 'users', user.uid), {
        username: username,
        nationality: nationality,
        profileComplete: true,
        profileCompletedAt: serverTimestamp(),
      }, { merge: true });

      // Store username in usernames collection
      await setDoc(doc(db, 'usernames', username.toLowerCase()), {
        uid: user.uid,
        createdAt: serverTimestamp(),
      });

      router.push('/dashboard');
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle authentication errors
  const handleAuthError = (err) => {
    console.error('Auth error:', err);
    
    switch (err.code) {
      case 'auth/weak-password':
        setError('Password should be at least 6 characters');
        break;
      case 'auth/invalid-credential':
        setError('Invalid email or password');
        break;
      case 'auth/user-not-found':
        setError('No account found with this email');
        break;
      case 'auth/wrong-password':
        setError('Incorrect password');
        break;
      case 'auth/popup-closed-by-user':
        setError('Authentication cancelled');
        break;
      case 'auth/cancelled-popup-request':
        setError('Authentication cancelled');
        break;
      case 'auth/popup-blocked':
        setError('Popup blocked. Please allow popups for this site.');
        break;
      case 'auth/account-exists-with-different-credential':
        setError('An account already exists with this email using a different sign-in method');
        break;
      case 'auth/operation-not-allowed':
        setError('This authentication method is not enabled');
        break;
      default:
        setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  return {
    loading,
    error,
    setError,
    checkEmailExists,
    handleLogin,
    handleSignUp,
    handleAnonymousLogin,
    handleGoogleLogin,
    completeProfileSetup,
  };
}