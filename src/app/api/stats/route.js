// src/api/stats/route.js
import { adminDb } from '@/lib/firebaseAdmin';
import { divisionRules } from '@/lib/league';

export async function POST(request) {
  try {
    const { userId, result, opponentId, score } = await request.json();
    
    if (!userId || !result || !opponentId || !score) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const statsRef = adminDb.collection('users').doc(userId).collection('stats').doc('current');
    
    const updatedStats = await adminDb.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      const currentStats = statsDoc.exists ? statsDoc.data() : getDefaultStats();
      
      const updated = calculateUpdatedStats(currentStats, result, opponentId, score);
      transaction.set(statsRef, updated);
      return updated;
    });

    return new Response(JSON.stringify(updatedStats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating stats:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function getDefaultStats() {
  return {
    division: 5,
    matchesPlayed: 0,
    currentPoints: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    matchHistory: []
  };
}

function calculateUpdatedStats(currentStats, result, opponentId, score) {
  const updatedStats = { ...currentStats };
  
  // Update basic stats
  updatedStats.matchesPlayed += 1;
  updatedStats.currentPoints += result === 'win' ? 3 : result === 'tie' ? 1 : 0;
  updatedStats[`${result}s`] += 1;
  
  // Add to match history (keep last 10)
  updatedStats.matchHistory = [
    {
      opponentId,
      result,
      score,
      timestamp: new Date().toISOString(),
      division: currentStats.division
    },
    ...currentStats.matchHistory.slice(0, 9)
  ];
  
  // Check for promotion/relegation
  const divisionRule = divisionRules[updatedStats.division];
  if (updatedStats.matchesPlayed >= divisionRule.matches) {
    if (updatedStats.currentPoints >= divisionRule.requiredPoints && updatedStats.division > 1) {
      updatedStats.division -= 1; // Promote
    } else if (divisionRule.canRelegate && updatedStats.division < 5) {
      updatedStats.division += 1; // Relegate
    }
    // Reset for new season
    updatedStats.currentPoints = 0;
    updatedStats.matchesPlayed = 0;
  }
  
  return updatedStats;
}