// src/components/game/GameResults.jsx
"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import PlayerAvatar from '@/components/ui/PlayerAvatar';
import { updateDivisionAfterMatch, calculateDivisionProgress } from '@/lib/league';

export default function GameResults({ game, onPlayAgain }) {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [divisionProgress, setDivisionProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !game) return;

    const updateStats = async () => {
      try {
        const userId = user.uid;
        const opponentId = game.players.find(p => p !== userId);
        const userScore = game.playerScores[userId] || 0;
        const opponentScore = game.playerScores[opponentId] || 0;

        const result = userScore > opponentScore ? 'win' :
          userScore < opponentScore ? 'loss' : 'tie';

        // Update Firestore document
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const currentStats = userDoc.data();

          // Create updated stats object with new match data
          let updatedStats = {
            ...currentStats,
            [result + 's']: (currentStats[result + 's'] || 0) + 1
          };

          // Add current match to history
          const matchRecord = {
            gameId: game.id,
            opponentId,
            result,
            score: `${userScore}-${opponentScore}`,
            date: new Date().toISOString(),
            division: currentStats.division || 5
          };

          updatedStats.matchHistory = [matchRecord, ...(currentStats.matchHistory || [])];

          // Calculate new division status using league rules
          const tempStats = {
            ...updatedStats,
            currentPoints: (currentStats.currentPoints || 0) + (result === 'win' ? 3 : result === 'tie' ? 1 : 0),
            matchesPlayed: (currentStats.matchesPlayed || 0) + 1
          };

          const finalStats = updateDivisionAfterMatch(tempStats, result);

          // Update Firestore
          await updateDoc(userRef, finalStats);
          setUserStats(finalStats);
          setDivisionProgress(calculateDivisionProgress(finalStats));
        }
      } catch (error) {
        console.error('Error updating stats:', error);
      } finally {
        setLoading(false);
      }
    };

    updateStats();
  }, [user, game]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userStats || !divisionProgress) {
    return <div>Error loading game results</div>;
  }

  const userId = user.uid;
  const opponentId = game.players.find(p => p !== userId);
  const userScore = game.playerScores[userId] || 0;
  const opponentScore = game.playerScores[opponentId] || 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Game Result Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold text-center">
              {userScore > opponentScore ? 'Victory!' :
                userScore < opponentScore ? 'Defeat' : 'Draw'}
            </h1>
            <div className="flex justify-between items-center mt-6">
              <div className="text-center">
                <PlayerAvatar userId={userId} size="lg" />
                <p className="mt-2 font-semibold">You</p>
                <p className="text-3xl font-bold">{userScore}</p>
              </div>
              <div className="text-2xl font-bold mx-4">vs</div>
              <div className="text-center">
                <PlayerAvatar userId={opponentId} size="lg" />
                <p className="mt-2 font-semibold">Opponent</p>
                <p className="text-3xl font-bold">{opponentScore}</p>
              </div>
            </div>
          </div>

          {/* Division Progress */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold mb-4">Division Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Current Division</h3>
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                    <span className="text-xl font-bold">{divisionProgress.currentDivision}</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Season Progress</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${(divisionProgress.matchesPlayed / (divisionProgress.matchesPlayed + divisionProgress.matchesRemaining)) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs mt-1 text-gray-500">
                      {divisionProgress.matchesPlayed}/{divisionProgress.matchesPlayed + divisionProgress.matchesRemaining} matches
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Points Status</h3>
                <div className="flex items-center">
                  <div className="bg-purple-100 text-purple-800 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                    <span className="text-xl font-bold">{userStats.currentPoints}</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Points needed for promotion</p>
                    <p className="text-lg font-bold">
                      {divisionProgress.pointsNeeded > 0 ? (
                        <span className="text-gray-700">{divisionProgress.pointsNeeded} more points</span>
                      ) : (
                        <span className="text-green-600">Promotion achieved!</span>
                      )}
                    </p>
                    {divisionProgress.canRelegate && (
                      <p className="text-xs mt-1 text-red-500">
                        Relegation risk if season ends now
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Match History (last 5 matches) */}
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Matches</h2>
            <div className="space-y-3">
              {userStats.matchHistory.slice(0, 5).map((match, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <PlayerAvatar userId={match.opponentId} size="sm" />
                    <div className="ml-3">
                      <p className="font-medium">Division {match.division}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(match.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${match.result === 'win' ? 'bg-green-100 text-green-800' :
                      match.result === 'loss' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {match.result.toUpperCase()}
                    </span>
                    <span className="ml-4 font-bold">{match.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 bg-gray-50 flex justify-center space-x-4">
            <button
              onClick={onPlayAgain}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Play Again
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}