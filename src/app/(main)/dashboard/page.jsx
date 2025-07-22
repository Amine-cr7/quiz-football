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
  const [selectedMode, setSelectedMode] = useState('quiz');
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState(null);
  const [gameError, setGameError] = useState(null);
  const [isStartingGame, setIsStartingGame] = useState(false);

  // Game modes configuration
  const gameModes = [
    {
      id: 'quiz',
      name: 'Quiz Mode',
      description: '10 questions, ranked matches',
      icon: '🧠',
      difficulty: 'Competitive',
      duration: '~5 min',
      available: true,
      features: ['Ranked matches', '10 questions', 'Real-time multiplayer', 'Division system']
    },
    {
      id: 'blitz',
      name: 'Blitz Mode',
      description: '5 questions, quick matches',
      icon: '⚡',
      difficulty: 'Fast',
      duration: '~2 min',
      available: false,
      features: ['Quick matches', '5 questions', 'No ranking', 'Casual play']
    },
    {
      id: 'tournament',
      name: 'Tournament',
      description: 'Bracket-style competition',
      icon: '🏆',
      difficulty: 'Elite',
      duration: '~30 min',
      available: false,
      features: ['8-player brackets', 'Prize pools', 'Weekly events', 'Elimination rounds']
    },
    {
      id: 'practice',
      name: 'Practice Mode',
      description: 'Solo practice with AI',
      icon: '🎯',
      difficulty: 'Learning',
      duration: '~3 min',
      available: false,
      features: ['AI opponents', 'Skill improvement', 'No pressure', 'Unlimited attempts']
    }
  ];

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
          language: selectedLanguage,
          mode: selectedMode
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

          {/* Game Modes Section */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Game Modes</h2>
              <p className="text-gray-600 mt-1">Choose your preferred way to play</p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {gameModes.map((mode) => (
                  <div
                    key={mode.id}
                    className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${
                      mode.available
                        ? selectedMode === mode.id
                          ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    }`}
                    onClick={() => mode.available && setSelectedMode(mode.id)}
                  >
                    {!mode.available && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
                        Coming Soon
                      </div>
                    )}
                    
                    <div className="text-center mb-3">
                      <div className="text-3xl mb-2">{mode.icon}</div>
                      <h3 className="font-bold text-lg text-gray-800">{mode.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{mode.description}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Difficulty:</span>
                        <span className="font-medium">{mode.difficulty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium">{mode.duration}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <ul className="text-xs text-gray-600 space-y-1">
                        {mode.features.slice(0, 2).map((feature, idx) => (
                          <li key={idx} className="flex items-center">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {mode.available && selectedMode === mode.id && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold mb-2">
                        Starting {gameModes.find(m => m.id === selectedMode)?.name}
                      </h2>
                      <p className="text-gray-600">Choose your preferred language</p>
                    </div>
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
                            Finding Opponent...
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
                    <h2 className="text-xl sm:text-2xl font-bold mb-4">
                      Ready to Play {gameModes.find(m => m.id === selectedMode)?.name}?
                    </h2>
                    <p className="text-gray-600 mb-6">
                      {selectedMode === 'quiz' 
                        ? '10 questions • Competitive ranked match • Climb the divisions!'
                        : gameModes.find(m => m.id === selectedMode)?.description
                      }
                    </p>
                    <button
                      onClick={handleShowLanguageSelector}
                      disabled={!gameModes.find(m => m.id === selectedMode)?.available}
                      className="px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {gameModes.find(m => m.id === selectedMode)?.available ? (
                        <>🎮 Play Now</>
                      ) : (
                        <>🔒 Coming Soon</>
                      )}
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