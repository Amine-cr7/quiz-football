// src/components/game/GameProgress.jsx
"use client";

export default function GameProgress({ 
  currentQuestion, 
  totalQuestions = 10, 
  onForfeit 
}) {
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Question {currentQuestion + 1} of {totalQuestions}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {Math.round(progress)}%
          </span>
          <button
            onClick={onForfeit}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Forfeit
          </button>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}