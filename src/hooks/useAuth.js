// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

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
      console.error('Error checking email:', err);
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

  // Generate unique username (currently unused but kept for future use)
  // const generateUniqueUsername = async (baseUsername) => {
  //   let finalUsername = baseUsername;
  //   let counter = 1;
  //   
  //   while (!(await checkUsernameAvailable(finalUsername))) {
  //     finalUsername = `${baseUsername}_${counter}`;
  //     counter++;
  //   }
  //   
  //   return finalUsername;
  // };

  // Create user document
  const createUserDocument = async (user, userData) => {
    try {
      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        uid: user.uid,
        email: user.email,
        createdAt: new Date(),
        // Initial league stats
        division: 5,
        currentPoints: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        matchHistory: []
      });
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  };

  // Check if user exists in Firestore
  const checkUserExists = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists();
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  };

  // Register with email
  const register = async (email, password, displayName, username) => {
    try {
      setLoading(true);
      setError(null);

      // Check if email already exists
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        throw new Error('This email is already registered. Please sign in instead.');
      }

      // Check if username is available
      const usernameAvailable = await checkUsernameAvailable(username);
      if (!usernameAvailable) {
        throw new Error('This username is already taken. Please choose another.');
      }

      // Create the user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      await createUserDocument(user, {
        displayName,
        username: username.toLowerCase(),
        profilePhotoURL: user.photoURL || null,
      });

      return { user, message: 'Account created successfully!' };
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login with email
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user document exists, if not create it
      const userExists = await checkUserExists(user.uid);
      
      if (!userExists) {
        // Generate a username from display name or email
        const baseUsername = user.displayName 
          ? user.displayName.toLowerCase().replace(/\s+/g, '_')
          : user.email.split('@')[0];
        
        // For now, use the base username as is (could implement unique generation later)
        const finalUsername = baseUsername;

        await createUserDocument(user, {
          displayName: user.displayName || user.email.split('@')[0],
          username: finalUsername,
          profilePhotoURL: user.photoURL,
        });
      }

      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    logout,
    checkEmailExists,
    checkUsernameAvailable
  };
}