// src/lib/forfeit.js - Forfeit handling functions
import { adminDb } from '@/lib/firebaseAdmin';

export async function handlePlayerForfeit(gameId, playerId) {
  const gameRef = adminDb.collection('games').doc(gameId);
  
  try {
    await adminDb.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);
      
      if (!gameDoc.exists) {
        throw new Error('Game not found');
      }
      
      const gameData = gameDoc.data();
      
      // Can only forfeit if game is in progress
      if (gameData.status !== 'playing') {
        throw new Error('Game is not in progress');
      }
      
      // Find the other player
      const otherPlayer = gameData.players.find(p => p !== playerId);
      
      if (!otherPlayer) {
        throw new Error('Other player not found');
      }
      
      // Calculate bonus points for remaining questions
      const remainingQuestions = gameData.questions.length - gameData.currentQuestion;
      const bonusPoints = remainingQuestions * 10; // 10 points per remaining question
      
      const updateData = {
        status: 'finished',
        gameEndTime: Date.now(),
        forfeitedBy: playerId,
        winner: otherPlayer,
        playerScores: {
          ...gameData.playerScores,
          [otherPlayer]: (gameData.playerScores[otherPlayer] || 0) + bonusPoints
        },
        forfeitReason: 'Player forfeited'
      };
      
      transaction.update(gameRef, updateData);
    });
    
    console.log(`Player ${playerId} forfeited game ${gameId}`);
    return { success: true };
  } catch (error) {
    console.error('Error handling forfeit:', error);
    return { success: false, error: error.message };
  }
}

// Check if a player can forfeit
export function canPlayerForfeit(game, playerId) {
  return (
    game.status === 'playing' &&
    game.players.includes(playerId) &&
    !game.forfeitedBy
  );
}

// Get forfeit statistics for analytics
export function getForfeitStats(game) {
  if (!game.forfeitedBy) {
    return null;
  }
  
  const forfeitedPlayer = game.forfeitedBy;
  const winner = game.winner;
  const questionsCompleted = game.currentQuestion;
  const questionsRemaining = game.questions.length - questionsCompleted;
  
  return {
    forfeitedPlayer,
    winner,
    questionsCompleted,
    questionsRemaining,
    forfeitTime: game.gameEndTime,
    gameDuration: game.gameEndTime - game.gameStartTime
  };
}