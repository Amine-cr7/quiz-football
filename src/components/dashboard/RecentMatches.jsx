// src/components/dashboard/RecentMatches.jsx
"use client";
import PlayerAvatar from '@/components/ui/PlayerAvatar';

export default function RecentMatches({ matches }) {
  return (
    <div className="space-y-3">
      {matches.map((match, index) => (
        <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex items-center">
            <PlayerAvatar userId={match.opponentId} size="sm" />
            <div className="ml-3">
              <p className="font-medium">Division {match.division}</p>
              <p className="text-sm text-gray-500">
                {new Date(match.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              match.result === 'win' ? 'bg-green-100 text-green-800' :
              match.result === 'loss' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {match.result.toUpperCase()}
            </span>
            <span className="ml-3 font-bold">{match.score}</span>
          </div>
        </div>
      ))}
    </div>
  );
}