// src/lib/game.js (Updated with Points System)
import { adminDb } from '@/lib/firebaseAdmin';

// Join or create a game
export async function joinOrCreateGame(userId, preferredLanguage = 'en') {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const gamesCol = adminDb.collection("games");

  try {
    // First check if user is already in a waiting or active game
    const userActiveGames = await gamesCol
      .where("players", "array-contains", userId)
      .where("status", "in", ["waiting", "countdown", "playing"])
      .get();

    if (!userActiveGames.empty) {
      const existingGame = userActiveGames.docs[0];
      const gameData = existingGame.data();
      return { 
        gameId: existingGame.id, 
        status: gameData.status,
        message: "You are already in an active game"
      };
    }

    // Look for any waiting game (regardless of language)
    const snapshot = await gamesCol
      .where("status", "==", "waiting")
      .where("players", "not-in", [[userId]]) // Ensure user isn't already in the game
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const gameData = doc.data();

      // Check if game is still waiting and has space
      if (gameData.players.length >= 2) {
        // This game is full, try to find another or create new
        return await createNewGame(userId, preferredLanguage, gamesCol);
      }

      // Add the new player with their language preference
      const updatedPlayers = [...gameData.players, userId];
      const updatedPlayerLanguages = {
        ...gameData.playerLanguages,
        [userId]: preferredLanguage
      };
      const updatedPlayerScores = {
        ...gameData.playerScores,
        [userId]: 0
      };

      await doc.ref.update({
        players: updatedPlayers,
        playerLanguages: updatedPlayerLanguages,
        playerScores: updatedPlayerScores,
        status: "countdown",
        gameStartTime: new Date(),
      });

      return { gameId: doc.id, status: "countdown" };
    } else {
      // Create new game
      return await createNewGame(userId, preferredLanguage, gamesCol);
    }
  } catch (error) {
    console.error('Error in joinOrCreateGame:', error);
    throw new Error(`Failed to join or create game: ${error.message}`);
  }
}

// Helper function to create a new game
async function createNewGame(userId, preferredLanguage, gamesCol) {
  try {
    // Get random questions from the questions collection
    const questionsSnapshot = await adminDb.collection('questions').get();
    
    if (questionsSnapshot.empty) {
      throw new Error('No questions available in the database');
    }

    const allQuestions = questionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        question: data.question[preferredLanguage] || data.question.en || data.question,
        options: data.options,
        correctAnswer: data.correctAnswer,
        translations: {
          en: data.question.en || data.question,
          ar: data.question.ar || data.question,
          fr: data.question.fr || data.question,
          de: data.question.de || data.question,
          es: data.question.es || data.question,
          pt: data.question.pt || data.question
        }
      };
    });

    // Randomly select 5 questions
    if (allQuestions.length < 5) {
      throw new Error('Not enough questions available in the database');
    }

    const selectedQuestions = allQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    const docRef = await gamesCol.add({
      players: [userId],
      playerLanguages: { [userId]: preferredLanguage },
      questions: selectedQuestions,
      answers: {},
      playerScores: { [userId]: 0 },
      status: "waiting",
      currentQuestion: 0,
      gameStartTime: null,
      gameEndTime: null,
      questionStartTime: null,
      createdAt: new Date(),
    });

    return { gameId: docRef.id, status: "waiting" };
  } catch (error) {
    console.error('Error creating new game:', error);
    throw new Error(`Failed to create new game: ${error.message}`);
  }
}

// Calculate points based on correctness and response time
export function calculatePoints(isCorrect, responseTime) {
  if (!isCorrect) return 0;
  let points = 10;

  // Quick answer bonus (under 7 seconds)
  if (responseTime < 7000) {
    points += 5;
  }

  return points;
}

// Check if all players have answered a question
export function allPlayersAnswered(game, questionIndex) {
  return game.players.every(playerId => {
    return game.answers[`${playerId}_q${questionIndex}`];
  });
}

// Get stats for each player
export function getGameStats(game) {
  const stats = {};

  game.players.forEach(playerId => {
    let correctAnswers = 0;
    let totalResponseTime = 0;
    let quickAnswers = 0;

    for (let i = 0; i < game.questions.length; i++) {
      const answer = game.answers[`${playerId}_q${i}`];

      if (answer) {
        if (answer.correct) correctAnswers++;
        totalResponseTime += answer.responseTime || 15000;
        if (answer.responseTime < 7000 && answer.correct) quickAnswers++;
      }
    }

    stats[playerId] = {
      score: game.playerScores[playerId] || 0,
      correctAnswers,
      accuracy: (correctAnswers / game.questions.length) * 100,
      averageResponseTime: totalResponseTime / game.questions.length,
      quickAnswers
    };
  });

  return stats;
}
