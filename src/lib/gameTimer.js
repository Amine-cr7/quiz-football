// src/lib/gameTimer.js - Server-side timer logic (for Firebase Functions or similar)
import { adminDb } from './firebaseAdmin';

export async function handleQuestionTimeout(gameId, questionIndex) {
  const gameRef = adminDb.collection('games').doc(gameId);
  
  try {
    await adminDb.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);
      
      if (!gameDoc.exists) {
        throw new Error('Game not found');
      }
      
      const gameData = gameDoc.data();
      
      // Check if we're still on the same question
      if (gameData.currentQuestion !== questionIndex || gameData.status !== 'playing') {
        return; // Question already advanced or game ended
      }
      
      // Find players who haven't answered
      const unansweredPlayers = gameData.players.filter(playerId => {
        return !gameData.answers[`${playerId}_q${questionIndex}`];
      });
      
      // Auto-submit for unanswered players
      const updatedAnswers = { ...gameData.answers };
      const updatedScores = { ...gameData.playerScores };
      
      unansweredPlayers.forEach(playerId => {
        updatedAnswers[`${playerId}_q${questionIndex}`] = {
          answer: null,
          correct: false,
          points: 0,
          responseTime: 15000, // Max time
          timestamp: Date.now(),
          timedOut: true
        };
        
        // Score remains unchanged (0 points for timeout)
        if (!updatedScores[playerId]) {
          updatedScores[playerId] = 0;
        }
      });
      
      // Determine next action
      let updateData = {
        answers: updatedAnswers,
        playerScores: updatedScores
      };
      
      // Move to next question or end game
      if (questionIndex < gameData.questions.length - 1) {
        updateData.currentQuestion = questionIndex + 1;
      } else {
        updateData.status = 'finished';
        updateData.gameEndTime = Date.now();
      }
      
      transaction.update(gameRef, updateData);
    });
    
    console.log(`Game ${gameId} question ${questionIndex} timeout handled`);
  } catch (error) {
    console.error('Error handling question timeout:', error);
  }
}

// Schedule timer when question starts (call this when currentQuestion changes)
export function scheduleQuestionTimeout(gameId, questionIndex) {
  // This would typically be implemented with Firebase Functions scheduled tasks
  // or a job queue system like Bull Queue with Redis
  
  setTimeout(() => {
    handleQuestionTimeout(gameId, questionIndex);
  }, 15000); // 15 seconds
}

// Alternative implementation using Firebase Functions (pseudo-code)
/*
// In your Firebase Functions index.js
exports.scheduleQuestionTimer = functions.firestore
  .document('games/{gameId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if currentQuestion changed and game is playing
    if (before.currentQuestion !== after.currentQuestion && after.status === 'playing') {
      const gameId = context.params.gameId;
      const questionIndex = after.currentQuestion;
      
      // Schedule a task to run in 15 seconds
      const tasks = getFunctions().taskQueue('question-timer');
      
      await tasks.enqueue({
        gameId,
        questionIndex,
        scheduleTime: Date.now() + 15000
      });
    }
  });

exports.processQuestionTimer = functions.tasks.taskQueue('question-timer')
  .onRun(async (data) => {
    const { gameId, questionIndex } = data;
    await handleQuestionTimeout(gameId, questionIndex);
  });
*/