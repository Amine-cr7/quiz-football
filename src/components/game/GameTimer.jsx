// src/components/game/GameTimer.jsx
"use client";
import { useState, useEffect, useRef } from "react";

export default function GameTimer({ 
  initialTime = 15, 
  onTimeUp, 
  isActive = true, 
  hasAnswered = false,
  onReset 
}) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const timerRef = useRef(null);

  // Reset timer when onReset is called
  useEffect(() => {
    if (onReset) {
      setTimeLeft(initialTime);
    }
  }, [onReset, initialTime]);

  // Timer logic
  useEffect(() => {
    if (isActive && !hasAnswered && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onTimeUp?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, hasAnswered, timeLeft, onTimeUp]);

  const getTimerColor = () => {
    if (timeLeft > 10) return 'text-green-600';
    if (timeLeft > 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 text-center">
      <div className={`text-3xl font-bold ${getTimerColor()}`}>
        {timeLeft}s
      </div>
      <div className="text-sm text-gray-600 mt-1">Time remaining</div>
    </div>
  );
}