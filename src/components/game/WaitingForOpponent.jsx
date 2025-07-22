// src/components/game/WaitingForOpponent.jsx
"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";

export default function WaitingForOpponent({ gameId, onGameStart }) {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const [playerCount, setPlayerCount] = useState(1);

  useEffect(() => {
    if (!gameId) {
      setError('Invalid game ID');
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    const unsubscribe = onSnapshot(
      doc(db, "games", gameId), 
      (doc) => {
        if (doc.exists()) {
          const gameData = doc.data();
          setPlayerCount(gameData.players?.length || 1);
          setConnectionStatus('connected');
          
          if (gameData.status === "countdown" || gameData.status === "playing") {
            onGameStart();
          }
        } else {
          setError('Game not found');
          setConnectionStatus('error');
        }
      },
      (error) => {
        console.error("Error listening to game:", error);
        setError('Connection error. Please refresh the page.');
        setConnectionStatus('error');
      }
    );

    return () => unsubscribe();
  }, [gameId, onGameStart]);

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 text-lg font-semibold mb-2">
              Connection Error
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 text-center">
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="animate-pulse flex space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Waiting for opponent...</h2>
          <p className="text-gray-600 mb-4">
            Share the game link with a friend to start playing!
          </p>
          
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">1</span>
              </div>
              <span className="text-gray-400">+</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                playerCount >= 2 ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <span className={`font-bold ${
                  playerCount >= 2 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {playerCount >= 2 ? '2' : '?'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-700 mb-2">
            <strong>Game ID:</strong>
          </p>
          <div className="bg-white border-2 border-dashed border-blue-300 rounded p-3">
            <span className="font-mono font-bold text-lg text-blue-800">{gameId}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/game/${gameId}`);
              // You could add a toast notification here
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📋 Copy Game Link
          </button>
          <button
            onClick={() => window.location.href = `/dashboard`}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel Game
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Status: {connectionStatus === 'connecting' ? 'Connecting...' : 
                   connectionStatus === 'connected' ? 'Connected' : 'Error'}
        </div>
      </div>
    </div>
  );
}