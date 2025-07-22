// src/components/game/WaitingForOpponent.jsx
"use client";
import { useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";

export default function WaitingForOpponent({ gameId, onGameStart }) {
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "games", gameId), (doc) => {
      if (doc.exists() && (doc.data().status === "countdown" || doc.data().status === "playing")) {
        onGameStart();
      }
    });

    return () => unsubscribe();
  }, [gameId, onGameStart]);

  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-bold">Waiting for opponent...</h2>
      <p>Share the game link with a friend to start playing!</p>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          Game ID: <span className="font-mono font-bold">{gameId}</span>
        </p>
      </div>
    </div>
  );
}