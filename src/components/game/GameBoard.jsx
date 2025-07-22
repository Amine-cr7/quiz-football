// src/components/game/GameBoard.jsx (Refactored)
"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from '@/contexts/AuthContext';
import GameTimer from './GameTimer';
import GameProgress from './GameProgress';
import ForfeitModal from './ForfeitModal';
import QuestionDisplay from './QuestionDisplay';
import PlayerStatus from './PlayerStatus';
import LanguageInfo from './LanguageInfo';

export default function GameBoard({ game, onAnswer, onForfeit }) {
  const { questions, currentQuestion, players, answers, playerLanguages } = game;
  const { user } = useAuth();
  
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [resetTimer, setResetTimer] = useState(0);

  // Get user ID from auth context or localStorage
  const userId = user?.uid || (typeof window !== 'undefined' ? window.localStorage.getItem("uid") : null);

  // Get user's preferred language
  const userLanguage = playerLanguages?.[userId] || 'en';

  // Get the question in user's language
  const questionData = questions[currentQuestion];
  const questionText = questionData?.translations?.[userLanguage] || questionData?.question;
  const questionOptions = questionData?.options;

  // Store user ID in localStorage
  useEffect(() => {
    if (user?.uid && typeof window !== 'undefined') {
      window.localStorage.setItem("uid", user.uid);
    }
  }, [user]);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setHasAnswered(false);
    setQuestionStartTime(Date.now());
    setResetTimer(prev => prev + 1); // Trigger timer reset
  }, [currentQuestion]);

  // Check if user has already answered this question
  useEffect(() => {
    const userAnswer = answers[`${userId}_q${currentQuestion}`];
    if (userAnswer && !hasAnswered) {
      setSelectedAnswer(userAnswer.answer);
      setHasAnswered(true);
    }
  }, [answers, userId, currentQuestion, hasAnswered]);

  // Handle timer expiration
  const handleTimeUp = useCallback(() => {
    if (hasAnswered) return;
    
    setHasAnswered(true);
    const responseTime = Date.now() - (questionStartTime || Date.now());
    onAnswer(null, responseTime);
  }, [hasAnswered, questionStartTime, onAnswer]);

  // Handle answer selection
  const handleAnswerSelect = useCallback((option) => {
    if (hasAnswered) return;
    
    const responseTime = Date.now() - (questionStartTime || Date.now());
    setSelectedAnswer(option);
    setHasAnswered(true);
    onAnswer(option, responseTime);
  }, [hasAnswered, questionStartTime, onAnswer]);

  // Handle forfeit confirmation
  const handleForfeit = useCallback(() => {
    setShowForfeitConfirm(false);
    onForfeit();
  }, [onForfeit]);

  // Show forfeit confirmation
  const handleShowForfeit = useCallback(() => {
    setShowForfeitConfirm(true);
  }, []);

  // Cancel forfeit
  const handleCancelForfeit = useCallback(() => {
    setShowForfeitConfirm(false);
  }, []);

  // Loading state
  if (!questionData || !questionText || !questionOptions) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-600">Loading question...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <GameProgress 
          currentQuestion={currentQuestion}
          totalQuestions={10}
          onForfeit={handleShowForfeit}
        />

        {/* Forfeit Confirmation Modal */}
        <ForfeitModal 
          isOpen={showForfeitConfirm}
          onConfirm={handleForfeit}
          onCancel={handleCancelForfeit}
        />

        {/* Timer */}
        <div className="mb-6">
          <GameTimer 
            initialTime={15}
            onTimeUp={handleTimeUp}
            isActive={true}
            hasAnswered={hasAnswered}
            onReset={resetTimer}
          />
        </div>

        {/* Language Info */}
        <div className="mb-6">
          <LanguageInfo language={userLanguage} />
        </div>

        {/* Question Display */}
        <div className="mb-6">
          <QuestionDisplay 
            question={questionText}
            options={questionOptions}
            selectedAnswer={selectedAnswer}
            hasAnswered={hasAnswered}
            onAnswerSelect={handleAnswerSelect}
          />
        </div>

        {/* Player Status */}
        <PlayerStatus 
          players={players}
          currentUserId={userId}
          answers={answers}
          currentQuestion={currentQuestion}
          playerLanguages={playerLanguages}
        />
      </div>
    </div>
  );
}