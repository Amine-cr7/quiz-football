"use client";
import { useEffect } from 'react';

export default function QuestionTransition({ game, onNextQuestion }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onNextQuestion();
    }, 2000); // 2 second delay between questions

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="text-center p-8">
      <h2 className="text-2xl font-bold mb-4">Next question starting...</h2>
      <div className="text-4xl">⏳</div>
    </div>
  );
}