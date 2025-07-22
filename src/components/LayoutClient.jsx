'use client';
import { auth } from '@/config/firebase';
import { useRouter } from 'next/navigation'; // Add this import

export default function LayoutClient({ children }) {
  const router = useRouter(); // Initialize the router

  return (
    <div>
      <nav className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Quiz Game</h1>
          <button
            onClick={async () => {
              await fetch('/api/session', { method: 'DELETE' });
              await auth.signOut();
              router.push('/auth');
            }}
            className="text-red-600 hover:underline"
          >
            Sign Out
          </button>
        </div>
      </nav>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}