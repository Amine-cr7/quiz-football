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
import Link from 'next/link';

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
  const [error, setError] = useState(null);
  const [gameError, setGameError] = useState(null);
  const [isStartingGame, setIsStartingGame] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchUserStats = async () => {
      setIsLoadingStats(true);
      setError(null);
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
        setError("Failed to load user statistics. Please refresh the page.");
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
    setIsStartingGame(true);
    setGameError(null);
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
      
      // Display message if user was already in a game
      if (data.message) {
        setGameError(data.message);
      }
    } catch (error) {
      console.error("Error starting game:", error);
      setGameError(error.message);
    } finally {
      setIsStartingGame(false);
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
    setGameError(null);
  };

  const retryLoadStats = () => {
    setError(null);
    if (user) {
      const fetchUserStats = async () => {
        setIsLoadingStats(true);
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
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
          }
        } catch (error) {
          console.error("Error fetching user stats:", error);
          setError("Failed to load user statistics. Please refresh the page.");
        } finally {
          setIsLoadingStats(false);
        }
      };
      fetchUserStats();
    }
  };

  if (loading || isLoadingStats) {
    return (
      <LayoutClient>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </LayoutClient>
    );
  }

  if (error) {
    return (
      <LayoutClient>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="text-red-600 text-lg font-semibold mb-2">
                Error Loading Dashboard
              </div>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={retryLoadStats}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </LayoutClient>
    );
  }

  return (
    <LayoutClient>
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* User Profile Header */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6 text-white">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <PlayerAvatar userId={user?.uid} size="xl" />
                <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{user?.displayName}</h1>
                  {divisionProgress && (
                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center">
                      <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
                        Division {divisionProgress.currentDivision}
                      </span>
                      {divisionProgress.currentDivision === 1 && (
                        <Link 
                          href="/leaderboard"
                          className="mt-2 sm:mt-0 sm:ml-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold hover:bg-yellow-300 transition-colors"
                        >
                          🏆 View Leaderboard
                        </Link>
                      )}
                      <div className="mt-2 sm:mt-0 sm:ml-4">
                        <span className="text-sm">Season Progress</span>
                        <div className="w-32 bg-blue-300 rounded-full h-2 mt-1">
                          <div
                            className="bg-white h-2 rounded-full transition-all duration-300"
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm font-medium">Points</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{userStats?.currentPoints || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {divisionProgress.pointsNeeded > 0 ? (
                      <span>{divisionProgress.pointsNeeded} to promote</span>
                    ) : (
                      <span className="text-green-600">Promotion ready!</span>
                    )}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm font-medium">Matches</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">{userStats?.matchesPlayed || 0}/{divisionProgress.matchesPlayed + divisionProgress.matchesRemaining}</p>
                  <p className="text-xs text-gray-500 mt-1">Season progress</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm font-medium">Win Rate</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {(userStats?.wins || 0) > 0 && (userStats?.matchHistory?.length || 0) > 0 ?
                      Math.round(((userStats.wins || 0) / (userStats.matchHistory?.length || 1)) * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">All matches</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm font-medium">Best Division</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">1</p>
                  <p className="text-xs text-gray-500 mt-1">Personal best</p>
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
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6">
                {gameError && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-yellow-800 text-sm">
                      {gameError}
                    </div>
                  </div>
                )}
                
                {showLanguageSelector ? (
                  <div>
                    <h2 className="text-xl font-bold mb-4 text-center">Choose Your Language</h2>
                    <LanguageSelector
                      onLanguageSelect={handleLanguageSelect}
                      selectedLanguage={selectedLanguage}
                    />
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                      <button
                        onClick={handleStartGame}
                        disabled={!selectedLanguage || isStartingGame}
                        className="px-6 sm:px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isStartingGame ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Starting Game...
                          </>
                        ) : (
                          'Start Game'
                        )}
                      </button>
                      <button
                        onClick={() => setShowLanguageSelector(false)}
                        disabled={isStartingGame}
                        className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4">Start a New Game</h2>
                    <p className="text-gray-600 mb-6">
                      Test your knowledge and climb the divisions!
                    </p>
                    <button
                      onClick={handleShowLanguageSelector}
                      className="px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg transform hover:scale-105"
                    >
                      🎮 Play Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Matches */}
          {userStats?.matchHistory?.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6 border-b">
                <h2 className="text-lg sm:text-xl font-bold">Recent Matches</h2>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
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
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  View Full Match History →
                </button>
              </div>
            </div>
          )}

          {/* Division Leaderboard for Division 1 players */}
          {divisionProgress?.currentDivision === 1 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold">Division 1 Leaderboard</h2>
                  <Link 
                    href="/leaderboard"
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    View Full →
                  </Link>
                </div>
              </div>
              <DivisionLeaderboard />
            </div>
          )}
        </div>
      </div>
    </LayoutClient>
  );
}