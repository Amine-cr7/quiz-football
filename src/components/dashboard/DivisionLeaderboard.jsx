// src/components/dashboard/DivisionLeaderboard.jsx
"use client";
import { useState, useEffect } from 'react';
import PlayerAvatar from '@/components/ui/PlayerAvatar';
import { getDivisionOneLeaderboard, getUserRank } from '@/lib/league';
import { useAuth } from '@/contexts/AuthContext';

const podiumColors = [
  { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' }
];

const podiumRanks = ['1st', '2nd', '3rd'];

export default function DivisionLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all-time'); // 'all-time', 'monthly', 'weekly'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [leaderboardData, rank] = await Promise.all([
          getDivisionOneLeaderboard(),
          user ? getUserRank(user.uid) : null
        ]);
        
        setLeaderboard(leaderboardData);
        setUserRank(rank);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, timeFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Division 1 Leaderboard</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeFilter('all-time')}
              className={`px-3 py-1 rounded-md text-sm ${timeFilter === 'all-time' ? 'bg-white text-blue-600' : 'bg-blue-500'}`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFilter('monthly')}
              className={`px-3 py-1 rounded-md text-sm ${timeFilter === 'monthly' ? 'bg-white text-blue-600' : 'bg-blue-500'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeFilter('weekly')}
              className={`px-3 py-1 rounded-md text-sm ${timeFilter === 'weekly' ? 'bg-white text-blue-600' : 'bg-blue-500'}`}
            >
              Weekly
            </button>
          </div>
        </div>
        
        {userRank && (
          <div className="mt-4 flex items-center">
            <PlayerAvatar userId={user.uid} size="sm" />
            <div className="ml-3">
              <p className="font-medium">Your Rank: #{userRank}</p>
              <p className="text-sm opacity-80">
                {leaderboard[userRank - 1]?.points || 0} points • {leaderboard[userRank - 1]?.wins || 0} wins
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Podium */}
      <div className="p-6 border-b">
        <div className="flex justify-center space-x-4 md:space-x-8">
          {leaderboard.slice(0, 3).map((player, index) => (
            <div 
              key={player.id}
              className={`flex flex-col items-center ${index === 1 ? 'order-first' : ''}`}
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 ${podiumColors[index].border} ${podiumColors[index].bg} flex items-center justify-center mb-2`}>
                <span className={`text-xl font-bold ${podiumColors[index].text}`}>{podiumRanks[index]}</span>
              </div>
              <PlayerAvatar userId={player.id} size="lg" />
              <h3 className="mt-2 font-bold text-center">{player.displayName}</h3>
              <p className="text-sm text-gray-600">{player.points} points</p>
              <p className="text-xs text-gray-500">{player.winRate}% win rate</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y">
        {leaderboard.slice(3).map((player, index) => (
          <div 
            key={player.id} 
            className={`p-4 hover:bg-gray-50 transition-colors flex items-center ${user?.uid === player.id ? 'bg-blue-50' : ''}`}
          >
            <span className="w-8 text-gray-500 font-medium">{index + 4}</span>
            <PlayerAvatar userId={player.id} size="sm" className="mx-3" />
            <div className="flex-1">
              <h3 className="font-medium">{player.displayName}</h3>
              <div className="flex items-center mt-1">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                  {player.wins} wins
                </span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {player.winRate}% win rate
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{player.points}</p>
              <p className="text-xs text-gray-500">points</p>
            </div>
          </div>
        ))}
      </div>

      {/* View More */}
      {leaderboard.length > 10 && (
        <div className="p-4 text-center border-t">
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            View Full Leaderboard
          </button>
        </div>
      )}
    </div>
  );
}