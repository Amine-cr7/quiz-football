import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "@firebase/firestore";
import { db } from '@/config/firebase';
// src/lib/league.js
export const divisionRules = {
  5: { matches: 10, requiredPoints: 10, canRelegate: false },
  4: { matches: 10, requiredPoints: 15, canRelegate: true },
  3: { matches: 10, requiredPoints: 18, canRelegate: true },
  2: { matches: 10, requiredPoints: 21, canRelegate: true },
  1: { matches: Infinity, requiredPoints: 0, canRelegate: false, isLeague: true }
};

export const matchPoints = {
  win: 3,
  tie: 1,
  loss: 0
};

export function calculateDivisionProgress(userStats) {
  const currentDivision = userStats.division || 5;
  const divisionRule = divisionRules[currentDivision];
  
  const progress = {
    currentDivision,
    matchesPlayed: userStats.matchesPlayed || 0,
    matchesRemaining: Math.max(0, divisionRule.matches - (userStats.matchesPlayed || 0)),
    pointsNeeded: Math.max(0, divisionRule.requiredPoints - (userStats.currentPoints || 0)),
    canPromote: (userStats.currentPoints || 0) >= divisionRule.requiredPoints,
    canRelegate: divisionRule.canRelegate,
    isLeague: divisionRule.isLeague || false
  };

  return progress;
}

export function updateDivisionAfterMatch(userStats, result) {
  // Clone the user stats to avoid mutation
  const updatedStats = { ...userStats };
  
  // Add match points based on result
  updatedStats.currentPoints = (updatedStats.currentPoints || 0) + matchPoints[result];
  updatedStats.matchesPlayed = (updatedStats.matchesPlayed || 0) + 1;
  
  const currentDivision = updatedStats.division || 5;
  const divisionRule = divisionRules[currentDivision];
  
  // Check for promotion if points requirement is met
  if (updatedStats.currentPoints >= divisionRule.requiredPoints && currentDivision > 1) {
    // Promote immediately
    updatedStats.division = currentDivision - 1;
    updatedStats.currentPoints = 0;
    updatedStats.matchesPlayed = 0;
    return updatedStats;
  }
  
  // Check for relegation
  if (divisionRule.canRelegate) {
    const matchesRemaining = divisionRule.matches - updatedStats.matchesPlayed;
    const maxPossiblePoints = updatedStats.currentPoints + (matchesRemaining * 3); // 3 points per win
    
    // If even winning all remaining matches won't get required points, relegate immediately
    if (maxPossiblePoints < divisionRule.requiredPoints) {
      updatedStats.division = currentDivision + 1;
      updatedStats.currentPoints = 0;
      updatedStats.matchesPlayed = 0;
      return updatedStats;
    }
  }
  
  // Check if season is complete (all matches played)
  if (updatedStats.matchesPlayed >= divisionRule.matches) {
    // If in Division 1 (league), just reset matches and points
    if (currentDivision === 1) {
      updatedStats.currentPoints = 0;
      updatedStats.matchesPlayed = 0;
    } 
    // For other divisions, check if they met the points requirement
    else {
      if (updatedStats.currentPoints >= divisionRule.requiredPoints) {
        // Promote
        updatedStats.division = currentDivision - 1;
      } else {
        // Relegate (unless in Division 5)
        if (currentDivision < 5) {
          updatedStats.division = currentDivision + 1;
        }
      }
      // Reset for new season
      updatedStats.currentPoints = 0;
      updatedStats.matchesPlayed = 0;
    }
  }
  
  return updatedStats;
}


export async function getDivisionOneLeaderboard() {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('division', '==', 1),
      orderBy('currentPoints', 'desc'),
      orderBy('wins', 'desc'),
      limit(100)
    );
    
    const querySnapshot = await getDocs(q);
    const leaderboard = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      leaderboard.push({
        id: doc.id,
        displayName: userData.displayName,
        points: userData.currentPoints || 0,
        wins: userData.wins || 0,
        matchesPlayed: userData.matchesPlayed || 0,
        winRate: userData.matchHistory?.length ? Math.round((userData.wins || 0) / userData.matchHistory.length * 100) : 0});
    });
    
    return leaderboard;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

export async function getUserRank(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data();
    if (userData.division !== 1) return null;
    
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('division', '==', 1),
      orderBy('currentPoints', 'desc'),
      orderBy('wins', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    let rank = 0;
    let found = false;
    
    querySnapshot.forEach((doc, index) => {
      if (doc.id === userId) {
        rank = index + 1;
        found = true;
      }
    });
    
    return found ? rank : null;
  } catch (error) {
    console.error("Error fetching user rank:", error);
    return null;
  }
}