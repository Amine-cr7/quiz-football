// src/app/dashboard/page.js
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import LayoutClient from '@/components/LayoutClient';
import PlayerAvatar from '@/components/ui/PlayerAvatar';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { divisionRules, calculateDivisionProgress } from '@/lib/league';
import dynamic from 'next/dynamic';
import DivisionLeaderboard from '@/components/dashboard/DivisionLeaderboard';

// Dynamic imports for components that might cause issues
const WaitingForOpponent = dynamic(
  () => import('@/components/game/WaitingForOpponent'),
  { ssr: false }
);

const LanguageSelector = dynamic(
  () => import('@/components/game/LanguageSelector'),
  { ssr: false }
);

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [gameState, setGameState] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [divisionProgress, setDivisionProgress] = useState(null);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUserStats = async () => {
      setIsLoadingStats(true);
      try {
        // Fetch real data from Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();

          // Structure the stats object
          const userStats = {
            division: userData.division || 5,
            matchesPlayed: userData.matchesPlayed || 0,
            currentPoints: userData.currentPoints || 0,
            wins: userData.wins || 0,
            losses: userData.losses || 0,
            ties: userData.ties || 0,
            matchHistory: userData.matchHistory || []
          };

          setUserStats(userStats);
          setDivisionProgress(calculateDivisionProgress(userStats));
        } else {
          // Create initial user document if it doesn't exist
          const initialStats = {
            division: 5,
            matchesPlayed: 0,
            currentPoints: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            matchHistory: []
          };

          setUserStats(initialStats);
          setDivisionProgress(calculateDivisionProgress(initialStats));
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchUserStats();
  }, [user]);

  // Auto-redirect when game is ready
  useEffect(() => {
    if (gameState && gameState.status !== "waiting") {
      const timer = setTimeout(() => {
        router.push(`/game/${gameState.gameId}`);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [gameState, router]);

  const handleStartGame = async () => {
    try {
      const res = await fetch("/api/game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          language: selectedLanguage
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to start game");
      }

      const data = await res.json();
      setGameState(data);
      setShowLanguageSelector(false);
    } catch (error) {
      console.error("Error starting game:", error);
      alert(error.message);
    }
  };

  const handleGameStart = () => {
    router.push(`/game/${gameState.gameId}`);
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
  };

  const handleShowLanguageSelector = () => {
    setShowLanguageSelector(true);
  };

  if (loading || isLoadingStats) {
    return (
      <LayoutClient>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </LayoutClient>
    );
  }

  return (
    <LayoutClient>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* User Profile Header */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center">
                <PlayerAvatar userId={user?.uid} size="xl" />
                <div className="ml-6">
                  <h1 className="text-2xl md:text-3xl font-bold">{user?.displayName}</h1>
                  {divisionProgress && (
                    <div className="mt-2 flex items-center">
                      <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
                        Division {divisionProgress.currentDivision}
                      </span>
                      <div className="ml-4">
                        <span className="text-sm">Season Progress</span>
                        <div className="w-32 bg-blue-300 rounded-full h-2 mt-1">
                          <div
                            className="bg-white h-2 rounded-full"
                            style={{ width: `${(divisionProgress.matchesPlayed / (divisionProgress.matchesPlayed + divisionProgress.matchesRemaining)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            {divisionProgress && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                <div className="text-center">
                  <p className="text-gray-500 text-sm">Points</p>
                  <p className="text-2xl font-bold">{userStats?.currentPoints || 0}</p>
                  <p className="text-xs text-gray-500">
                    {divisionProgress.pointsNeeded > 0 ? (
                      <span>{divisionProgress.pointsNeeded} to promote</span>
                    ) : (
                      <span className="text-green-600">Promotion ready!</span>
                    )}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-sm">Matches</p>
                  <p className="text-2xl font-bold">{userStats?.matchesPlayed || 0}/{divisionProgress.matchesPlayed + divisionProgress.matchesRemaining}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-sm">Win Rate</p>
                  <p className="text-2xl font-bold">
                    {(userStats?.wins || 0) > 0 && (userStats?.matchHistory?.length || 0) > 0 ?
                      Math.round(((userStats.wins || 0) / (userStats.matchHistory?.length || 1)) * 100) : 0}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-sm">Highest Division</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
              </div>
            )}
          </div>

          {/* Game Start Section */}
          {gameState ? (
            gameState.status === "waiting" ? (
              <WaitingForOpponent
                gameId={gameState.gameId}
                onGameStart={handleGameStart}
              />
            ) : (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="text-green-600 text-lg font-semibold mb-2">
                    Game Ready!
                  </div>
                  <div className="text-green-700">
                    Redirecting to game...
                  </div>
                  <div className="mt-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
              {showLanguageSelector ? (
                <div>
                  <LanguageSelector
                    onLanguageSelect={handleLanguageSelect}
                    selectedLanguage={selectedLanguage}
                  />
                  <div className="text-center mt-6">
                    <button
                      onClick={handleStartGame}
                      disabled={!selectedLanguage}
                      className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mr-4"
                    >
                      Start Game
                    </button>
                    <button
                      onClick={() => setShowLanguageSelector(false)}
                      className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Start a New Game</h2>
                  <p className="text-gray-600 mb-6">
                    Test your knowledge and climb the divisions!
                  </p>
                  <button
                    onClick={handleShowLanguageSelector}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg"
                  >
                    Play Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Recent Matches */}
          {userStats?.matchHistory?.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden mt-6">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">Recent Matches</h2>
              </div>
              <div className="divide-y">
                {userStats.matchHistory.slice(0, 5).map((match, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
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
                  </div>
                ))}
              </div>
              <div className="p-4 text-center border-t">
                <button
                  onClick={() => router.push('/match-history')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Full Match History
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </LayoutClient>
  );
}