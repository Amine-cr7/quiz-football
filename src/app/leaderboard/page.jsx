// src/app/leaderboard/page.jsx
"use client";
import { useState } from 'react';
import DivisionLeaderboard from '@/components/dashboard/DivisionLeaderboard';
import LayoutClient from '@/components/LayoutClient';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('division1');

  return (
    <LayoutClient>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('division1')}
                  className={`px-6 py-4 font-medium ${activeTab === 'division1' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                  Division 1
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-6 py-4 font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                  All Divisions
                </button>
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`px-6 py-4 font-medium ${activeTab === 'friends' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                  Friends
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {activeTab === 'division1' && <DivisionLeaderboard />}
              {activeTab === 'all' && <div>All Divisions Leaderboard (implementation similar to DivisionLeaderboard)</div>}
              {activeTab === 'friends' && <div>Friends Leaderboard (implementation similar to DivisionLeaderboard)</div>}
            </div>
          </div>
        </div>
      </div>
    </LayoutClient>
  );
}