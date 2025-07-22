// src/lib/game.js (Updated with Points System)
import { adminDb } from '@/lib/firebaseAdmin';

// Clean up old abandoned games (older than 10 minutes)
async function cleanupOldGames() {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const oldGamesSnapshot = await adminDb.collection("games")
      .where("status", "==", "waiting")
      .get();

    const batch = adminDb.batch();
    let deletedCount = 0;

    oldGamesSnapshot.docs.forEach(doc => {
      const gameData = doc.data();
      const createdAt = gameData.createdAt?.toDate() || new Date(0);
      
      if (createdAt < tenMinutesAgo) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
      console.log(`Cleaned up ${deletedCount} old games`);
    }
  } catch (error) {
    console.error('Error cleaning up old games:', error);
    // Don't throw here, as cleanup failure shouldn't prevent game creation
  }
}

// Join or create a game
export async function joinOrCreateGame(userId, preferredLanguage = 'en') {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const gamesCol = adminDb.collection("games");

  try {
    // Clean up old games first (optional, runs in background)
    cleanupOldGames().catch(err => console.log('Cleanup warning:', err.message));

    // Check if user is already in any game (simple query)
    const userGamesSnapshot = await gamesCol
      .where("players", "array-contains", userId)
      .get();

    // Filter for active games in application code
    const activeUserGames = userGamesSnapshot.docs.filter(doc => {
      const status = doc.data().status;
      return status === "waiting" || status === "countdown" || status === "playing";
    });

    if (activeUserGames.length > 0) {
      const existingGame = activeUserGames[0];
      const gameData = existingGame.data();
      return { 
        gameId: existingGame.id, 
        status: gameData.status,
        message: "You are already in an active game"
      };
    }

    // Look for waiting games (simple query, no composite index needed)
    const waitingGamesSnapshot = await gamesCol
      .where("status", "==", "waiting")
      .limit(20) // Get more options to choose from
      .get();

    // Filter in application code to avoid complex queries
    const availableGames = waitingGamesSnapshot.docs.filter(doc => {
      const gameData = doc.data();
      const players = gameData.players || [];
      
      // Game must not include this user and must have space
      return !players.includes(userId) && players.length < 2;
    });

    if (availableGames.length > 0) {
      // Sort by creation time to join the oldest game first
      availableGames.sort((a, b) => {
        const aTime = a.data().createdAt?.toDate() || new Date(0);
        const bTime = b.data().createdAt?.toDate() || new Date(0);
        return aTime - bTime;
      });

      const doc = availableGames[0];
      const gameData = doc.data();

      // Double-check the game is still available (race condition protection)
      if (gameData.players.length >= 2) {
        // Game filled up, try to create new one
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
        lastUpdated: new Date(),
      });

      return { gameId: doc.id, status: "countdown" };
    } else {
      // No available games, create new one
      return await createNewGame(userId, preferredLanguage, gamesCol);
    }
  } catch (error) {
    console.error('Error in joinOrCreateGame:', error);
    
    // Provide more specific error messages
    if (error.message.includes('index')) {
      throw new Error('Database configuration issue. Please try again in a moment.');
    }
    
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
        question: data.question?.[preferredLanguage] || data.question?.en || data.question,
        options: data.options,
        correctAnswer: data.correctAnswer,
        translations: {
          en: data.question?.en || data.question,
          ar: data.question?.ar || data.question,
          fr: data.question?.fr || data.question,
          de: data.question?.de || data.question,
          es: data.question?.es || data.question,
          pt: data.question?.pt || data.question
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

    const gameData = {
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
      lastUpdated: new Date(),
    };

    const docRef = await gamesCol.add(gameData);

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