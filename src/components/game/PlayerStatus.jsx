// src/components/game/PlayerStatus.jsx
"use client";

const LANGUAGE_NAMES = {
  'en': 'English',
  'ar': 'العربية',
  'fr': 'Français'
};

export default function PlayerStatus({ 
  players, 
  currentUserId, 
  answers, 
  currentQuestion, 
  playerLanguages 
})

{
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">Player Status</h3>
      <div className="space-y-2">
        {players.map((playerId, index) => {
          const playerAnswered = answers[`${playerId}_q${currentQuestion}`];
          const playerLang = playerLanguages?.[playerId] || 'en';
          const isCurrentUser = playerId === currentUserId;
          
          return (
            <div 
              key={`player-${index}`} 
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <span className="font-medium">
                {isCurrentUser ? 'You' : 'Opponent'}
                <span className="text-sm text-gray-600 ml-1">
                  ({LANGUAGE_NAMES[playerLang]})
                </span>
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                playerAnswered
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {playerAnswered ? 'Answered' : 'Answering...'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}