// src/components/dashboard/PlayerStatsOverview.jsx
"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export default function PlayerStatsOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const statsRef = doc(db, 'users', user.uid, 'stats', 'current');
        const statsSnap = await getDoc(statsRef);
        
        if (statsSnap.exists()) {
          setStats(statsSnap.data());
        } else {
          setStats({
            division: 5,
            matchesPlayed: 0,
            currentPoints: 0,
            wins: 0,
            losses: 0,
            ties: 0
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return <div>Loading stats...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Your Stats</h2>
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Division</p>
            <p className="text-2xl font-bold">{stats.division}</p>
          </div>
          <div>
            <p className="text-gray-600">Points</p>
            <p className="text-2xl font-bold">{stats.currentPoints}</p>
          </div>
          <div>
            <p className="text-gray-600">Matches</p>
            <p className="text-2xl font-bold">{stats.matchesPlayed}/10</p>
          </div>
          <div>
            <p className="text-gray-600">Win Rate</p>
            <p className="text-2xl font-bold">
              {stats.matchesPlayed > 0 
                ? Math.round((stats.wins / stats.matchesPlayed) * 100) 
                : 0}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}