// hooks/useAdminProtection.js
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useAdminProtection() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!loading) {
        // Not authenticated
        if (!user) {
          router.push('/auth');
          return;
        }

        // Not admin
        if (!isAdmin) {
          router.push('/dashboard');
          return;
        }

        // Verify admin status on server
        try {
          const token = await user.getIdToken();
          const response = await fetch('/api/auth/verify-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });

          if (response.ok) {
            setIsVerified(true);
          } else {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Admin verification error:', error);
          router.push('/auth');
        } finally {
          setIsVerifying(false);
        }
      }
    };

    verifyAccess();
  }, [user, isAdmin, loading, router]);

  return {
    isVerified,
    isVerifying: loading || isVerifying,
    user,
    isAdmin
  };
}