'use client'
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Create context with default value
const AuthContext = createContext({
  user: null,
  isAdmin: false,
  loading: true,
  error: null,
  logout: () => {}
});

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Get the user's ID token to check custom claims
          const tokenResult = await user.getIdTokenResult();
          const adminClaim = tokenResult.claims.admin || false;
          
          setUser(user);
          setIsAdmin(adminClaim);
          
          // Set session cookie for server-side auth
          if (adminClaim) {
            const idToken = await user.getIdToken();
            await fetch('/api/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken })
            });
          }
        } else {
          setUser(null);
          setIsAdmin(false);
          // Clear session cookie
          await fetch('/api/session', { method: 'DELETE' });
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      await fetch('/api/session', { method: 'DELETE' });
    } catch (err) {
      console.error('Logout error:', err);
      setError(err);
    }
  };

  // Context value
  const value = {
    user,
    isAdmin,
    loading,
    error,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);