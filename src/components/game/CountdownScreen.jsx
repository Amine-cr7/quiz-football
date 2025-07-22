"use client";
import { useState, useEffect } from "react";

export default function CountdownScreen({ onCountdownComplete }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else if (count === 0) {
      // Show START for 1 second, then call onCountdownComplete
      const timer = setTimeout(() => {
        onCountdownComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [count, onCountdownComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">Get Ready!</h1>
        <div className="text-9xl font-bold text-white mb-4 animate-pulse">
          {count === 0 ? "START!" : count}
        </div>
        <p className="text-xl text-gray-300">
          {count === 0 ? "Game is starting..." : "Game starts in..."}
        </p>
      </div>
    </div>
  );
}