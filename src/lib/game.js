// src/lib/game.js (Updated with Points System)
import { adminDb } from '@/lib/firebaseAdmin';

// Join or create a game
export async function joinOrCreateGame(userId, preferredLanguage = 'en') {
  const gamesCol = adminDb.collection("games");

  // Look for any waiting game (regardless of language)
  const snapshot = await gamesCol.where("status", "==", "waiting").limit(1).get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    const gameData = doc.data();

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
    });

    return { gameId: doc.id, status: "countdown" };
  } else {
    // Get random questions from the questions collection
    const questionsSnapshot = await adminDb.collection('questions').get();
    const allQuestions = questionsSnapshot.docs.map(doc => ({
      id: doc.id,
      question: doc.data().question[preferredLanguage] || doc.data().question.en,
      options: doc.data().options,
      correctAnswer: doc.data().correctAnswer,
      translations: {
        en: doc.data().question.en,
        ar: doc.data().question.ar,
        fr: doc.data().question.fr,
        de: doc.data().question.de,
        es: doc.data().question.es,
        pt: doc.data().question.pt
      }
    }));

    // Randomly select 5 questions
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
    });

    return { gameId: docRef.id, status: "waiting" };
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
