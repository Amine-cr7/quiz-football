// src/app/game/[id]/page.js (Added forfeit functionality)
"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from '@/contexts/AuthContext';
import GameBoard from "@/components/game/GameBoard";
import CountdownScreen from "@/components/game/CountdownScreen";
import GameResults from "@/components/game/GameResults";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [game, setGame] = useState(null);
  const { user } = useAuth();
  const timeoutRef = useRef(null);
  const currentQuestionRef = useRef(null);

  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, "games", id), (snap) => {
      if (snap.exists()) {
        const gameData = { id: snap.id, ...snap.data() };
        setGame(gameData);
      } else {
        console.error("Game not found");
        router.push("/dashboard");
      }
    });

    return unsub;
  }, [id, router]);

  // FIXED: Simpler timeout handling
  useEffect(() => {
    if (!game || game.status !== "playing") {
      // Clear any existing timeout if game is not playing
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const currentQ = game.currentQuestion;
    
    // Clear previous timeout if question changed
    if (currentQuestionRef.current !== currentQ) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      currentQuestionRef.current = currentQ;
    }

    // Check if both players have already answered
    const bothPlayersAnswered = game.players.every(playerId => 
      game.answers[`${playerId}_q${currentQ}`]
    );

    if (bothPlayersAnswered) {
      // Both answered, no timeout needed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Set timeout only if not already set for this question
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(async () => {
        try {
          console.log(`Timeout triggered for question ${currentQ}`);
          
          // Find players who haven't answered
          const unansweredPlayers = game.players.filter(playerId => 
            !game.answers[`${playerId}_q${currentQ}`]
          );

          if (unansweredPlayers.length === 0) {
            // All players have answered, no need to do anything
            return;
          }

          // Auto-submit for unanswered players
          const updatedAnswers = { ...game.answers };
          const updatedScores = { ...game.playerScores };

          unansweredPlayers.forEach(playerId => {
            updatedAnswers[`${playerId}_q${currentQ}`] = {
              answer: null,
              correct: false,
              points: 0,
              responseTime: 15000,
              timestamp: Date.now(),
              timedOut: true
            };
            
            if (!updatedScores[playerId]) {
              updatedScores[playerId] = 0;
            }
          });

          // Prepare update data
          let updateData = {
            answers: updatedAnswers,
            playerScores: updatedScores
          };

          // Advance to next question or end game
          if (currentQ < game.questions.length - 1) {
            updateData.currentQuestion = currentQ + 1;
            console.log(`Advancing to question ${currentQ + 1}`);
          } else {
            updateData.status = "finished";
            updateData.gameEndTime = Date.now();
            console.log("Game finished");
          }

          await updateDoc(doc(db, "games", game.id), updateData);
          
          // Clear the timeout reference
          timeoutRef.current = null;
          
        } catch (error) {
          console.error("Error handling timeout:", error);
          timeoutRef.current = null;
        }
      }, 16000); // 16 seconds timeout

      console.log(`Timeout set for question ${currentQ}`);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [game?.currentQuestion, game?.status, game?.id, game?.players, game?.answers, game?.questions?.length, game?.playerScores]);

  const answerQuestion = async (selectedAnswer, responseTime = null) => {
    if (!game || game.status !== "playing") return;

    let uid = user?.uid || window.localStorage.getItem("uid");

    if (!uid) {
      alert("User not identified. Please log in again.");
      router.push('/login');
      return;
    }

    if (user?.uid) {
      window.localStorage.setItem("uid", user.uid);
    }

    // Clear timeout when player answers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const currentQ = game.questions[game.currentQuestion];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    
    // Calculate points
    let points = 0;
    if (isCorrect) {
      points = 10; // Base points for correct answer
      // Quick answer bonus (answered within 7 seconds)
      if (responseTime && responseTime < 7000) {
        points += 5;
      }
    }
console.log(selectedAnswer)
    const updatedAnswers = {
      ...game.answers,
      [`${uid}_q${game.currentQuestion}`]: {
        answer: selectedAnswer,
        correct: isCorrect,
        points: points,
        responseTime: responseTime || 15000,
        timestamp: Date.now(),
        timedOut: selectedAnswer === null
      }
    };
    console.log(updatedAnswers)
    const updatedScores = {
      ...game.playerScores,
      [uid]: (game.playerScores[uid] || 0) + points
    };

    let updateData = {
      answers: updatedAnswers,
      playerScores: updatedScores
    };

    // Check if ALL players have answered
    const allPlayersAnswered = game.players.every(playerId => {
      return updatedAnswers[`${playerId}_q${game.currentQuestion}`];
    });

    if (allPlayersAnswered) {
      // All players have answered, move to next question
      if (game.currentQuestion < game.questions.length - 1) {
        updateData.currentQuestion = game.currentQuestion + 1;
      } else {
        updateData.status = "finished";
        updateData.gameEndTime = Date.now();
      }
    }

    try {
      await updateDoc(doc(db, "games", game.id), updateData);
    } catch (error) {
      console.error("Error updating game:", error);
    }
  };

  // NEW: Forfeit functionality
  const forfeitGame = async () => {
    if (!game || game.status !== "playing") return;

    let uid = user?.uid || window.localStorage.getItem("uid");
    if (!uid) return;

    try {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Get opponent
      const opponent = game.players.find(p => p !== uid);
      
      // Calculate remaining questions and auto-answer them
      const updatedAnswers = { ...game.answers };
      const updatedScores = { ...game.playerScores };

      // Auto-answer remaining questions for forfeiting player (0 points)
      for (let i = game.currentQuestion; i < game.questions.length; i++) {
        updatedAnswers[`${uid}_q${i}`] = {
          answer: null,
          correct: false,
          points: 0,
          responseTime: 0,
          timestamp: Date.now(),
          forfeited: true
        };
      }

      // Auto-answer remaining questions for opponent (max points)
      for (let i = game.currentQuestion; i < game.questions.length; i++) {
        if (!updatedAnswers[`${opponent}_q${i}`]) {
          updatedAnswers[`${opponent}_q${i}`] = {
            answer: game.questions[i].correctAnswer,
            correct: true,
            points: 15, // Max points (10 base + 5 quick bonus)
            responseTime: 1000,
            timestamp: Date.now(),
            autoWin: true
          };
          
          // Update opponent's score
          updatedScores[opponent] = (updatedScores[opponent] || 0) + 15;
        }
      }

      const updateData = {
        status: "finished",
        gameEndTime: Date.now(),
        answers: updatedAnswers,
        playerScores: updatedScores,
        forfeitedBy: uid
      };

      await updateDoc(doc(db, "games", game.id), updateData);

    } catch (error) {
      console.error("Error forfeiting game:", error);
    }
  };

  const handleCountdownComplete = async () => {
    await updateDoc(doc(db, "games", game.id), {
      status: "playing",
      gameStartTime: Date.now()
    });
  };

  if (!game) {
    return <p className="p-4 text-center">Loading game...</p>;
  }

  if (game.status === "waiting") {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold">Waiting for opponent...</h2>
        <p>The game will start automatically when another player joins.</p>
      </div>
    );
  }

  if (game.status === "countdown") {
    return <CountdownScreen onCountdownComplete={handleCountdownComplete} />;
  }

  if (game.status === "finished") {
    return <GameResults game={game} onPlayAgain={() => router.push('/dashboard')} />;
  }

  return <GameBoard game={game} onAnswer={answerQuestion} onForfeit={forfeitGame} />;
}