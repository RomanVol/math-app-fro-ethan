'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Exercise } from '@/lib/types';
import { getCorrectAnswer, getTimeLimit } from '@/lib/exercises';

interface ExerciseDisplayProps {
  exercise: Exercise;
  onSubmit: (answer: number, elapsedTime: number) => void;
  onTimeout: (elapsedTime: number) => void;
  onStop: () => void;
  onRestart: () => void;
  roundNumber: number;
  exerciseNumber: number;
  totalExercises: number;
}

type FeedbackType = 'correct' | 'incorrect' | 'timeout' | null;

/**
 * Exercise display component for showing and answering multiplication problems
 * Follows Single Responsibility Principle - only handles exercise interaction
 */
export function ExerciseDisplay({
  exercise,
  onSubmit,
  onTimeout,
  onStop,
  onRestart,
  roundNumber,
  exerciseNumber,
  totalExercises,
}: ExerciseDisplayProps) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  
  // Correction mode state
  const [correctionMode, setCorrectionMode] = useState(false);
  const [correctionFactor1, setCorrectionFactor1] = useState('');
  const [correctionFactor2, setCorrectionFactor2] = useState('');
  const [correctionAnswer, setCorrectionAnswer] = useState('');
  const [correctionComplete, setCorrectionComplete] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const correctionFactor1Ref = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeLimit = getTimeLimit();

  const correctAnswer = getCorrectAnswer(exercise);

  // Check if correction is valid
  const isCorrectionValid = 
    parseInt(correctionFactor1) === exercise.factors[0] &&
    parseInt(correctionFactor2) === exercise.factors[1] &&
    parseInt(correctionAnswer) === correctAnswer;

  // Reset state when exercise changes
  useEffect(() => {
    setAnswer('');
    setFeedback(null);
    setIsSubmitted(false);
    setUserAnswer(null);
    setElapsedTime(0);
    setCorrectionMode(false);
    setCorrectionFactor1('');
    setCorrectionFactor2('');
    setCorrectionAnswer('');
    setCorrectionComplete(false);
    startTimeRef.current = Date.now();
    
    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      if (!isSubmitted) {
        handleTimeout();
      }
    }, timeLimit * 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [exercise.exercise_id, timeLimit]);

  // Focus correction input when entering correction mode
  useEffect(() => {
    if (correctionMode) {
      setTimeout(() => {
        correctionFactor1Ref.current?.focus();
      }, 100);
    }
  }, [correctionMode]);

  // Check correction automatically
  useEffect(() => {
    if (correctionMode && isCorrectionValid) {
      setCorrectionComplete(true);
    }
  }, [correctionFactor1, correctionFactor2, correctionAnswer, correctionMode, isCorrectionValid]);

  const getElapsedTime = useCallback(() => {
    return (Date.now() - startTimeRef.current) / 1000;
  }, []);

  const handleTimeout = useCallback(() => {
    if (isSubmitted) return;
    
    setIsSubmitted(true);
    setFeedback('timeout');
    setCorrectionMode(true);
    setElapsedTime(timeLimit);
  }, [isSubmitted, timeLimit]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitted || !answer.trim()) return;

    const numAnswer = parseInt(answer, 10);
    if (isNaN(numAnswer)) return;

    const elapsed = getElapsedTime();
    const isCorrect = numAnswer === correctAnswer;
    const isInTime = elapsed < timeLimit;

    setIsSubmitted(true);
    setUserAnswer(numAnswer);
    setElapsedTime(elapsed);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isCorrect && isInTime) {
      // Correct and in time - show green check and auto-advance
      setFeedback('correct');
      setTimeout(() => {
        onSubmit(numAnswer, elapsed);
      }, 800);
    } else if (isCorrect && !isInTime) {
      // Correct but too slow - show timeout message, need correction
      setFeedback('timeout');
      setCorrectionMode(true);
    } else {
      // Incorrect - show red X, need correction
      setFeedback('incorrect');
      setCorrectionMode(true);
    }
  }, [answer, correctAnswer, getElapsedTime, isSubmitted, onSubmit, timeLimit]);

  const handleNext = useCallback(() => {
    if (!correctionComplete) return;
    
    if (feedback === 'timeout') {
      onTimeout(timeLimit);
    } else if (userAnswer !== null) {
      onSubmit(userAnswer, elapsedTime);
    }
  }, [feedback, userAnswer, elapsedTime, onSubmit, onTimeout, timeLimit, correctionComplete]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onStop();
    }
  }, [onStop]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8" dir="rtl">
      {/* Progress indicator */}
      <div className="text-center">
        <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
          סיבוב {roundNumber} • תרגיל {exerciseNumber} מתוך {totalExercises}
        </span>
        <span className="mr-4 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
          זמן לתרגיל: {timeLimit} שניות
        </span>
      </div>

      {/* Exercise */}
      <div className="rounded-2xl bg-white p-12 shadow-xl">
        <div className="text-center">
          <div className="mb-8 text-6xl font-bold text-gray-900" dir="ltr">
            {exercise.factors[0]} × {exercise.factors[1]}
          </div>

          {/* Feedback display */}
          {feedback && (
            <div className="mb-6">
              {feedback === 'correct' ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-6xl text-green-500">✓</span>
                  <span className="text-xl font-semibold text-green-600">נכון!</span>
                </div>
              ) : feedback === 'timeout' ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-6xl text-orange-500">⏱</span>
                  <span className="text-xl font-semibold text-orange-600">עבר הזמן!</span>
                  <span className="text-lg text-gray-600">
                    התשובה הנכונה: <span className="font-bold text-blue-600">{correctAnswer}</span>
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-6xl text-red-500">✗</span>
                  <span className="text-xl font-semibold text-red-600">לא נכון</span>
                  <span className="text-lg text-gray-600">
                    התשובה הנכונה: <span className="font-bold text-blue-600">{correctAnswer}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Correction mode */}
          {correctionMode && (
            <div className="mb-6 rounded-xl bg-yellow-50 p-6">
              <p className="mb-4 text-lg font-semibold text-yellow-800">
                כתוב את התרגיל והתשובה הנכונה כדי להמשיך:
              </p>
              <div className="flex items-center justify-center gap-2" dir="ltr">
                <input
                  ref={correctionFactor1Ref}
                  type="number"
                  value={correctionFactor1}
                  onChange={(e) => setCorrectionFactor1(e.target.value)}
                  className={`w-16 rounded-lg border-2 p-2 text-center text-2xl font-bold ${
                    correctionFactor1 && parseInt(correctionFactor1) === exercise.factors[0]
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="?"
                />
                <span className="text-2xl font-bold text-gray-600">×</span>
                <input
                  type="number"
                  value={correctionFactor2}
                  onChange={(e) => setCorrectionFactor2(e.target.value)}
                  className={`w-16 rounded-lg border-2 p-2 text-center text-2xl font-bold ${
                    correctionFactor2 && parseInt(correctionFactor2) === exercise.factors[1]
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="?"
                />
                <span className="text-2xl font-bold text-gray-600">=</span>
                <input
                  type="number"
                  value={correctionAnswer}
                  onChange={(e) => setCorrectionAnswer(e.target.value)}
                  className={`w-20 rounded-lg border-2 p-2 text-center text-2xl font-bold ${
                    correctionAnswer && parseInt(correctionAnswer) === correctAnswer
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="?"
                />
              </div>
              {correctionComplete && (
                <p className="mt-3 text-lg font-semibold text-green-600">✓ מצוין! עכשיו אפשר להמשיך</p>
              )}
            </div>
          )}

          {/* Input form */}
          {!correctionMode && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                ref={inputRef}
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitted}
                placeholder="?"
                className={`w-32 rounded-xl border-2 p-4 text-center text-3xl font-bold text-gray-900 focus:outline-none disabled:bg-gray-100 ${
                  feedback === 'correct'
                    ? 'border-green-500 bg-green-50'
                    : feedback === 'incorrect'
                    ? 'border-red-500 bg-red-50'
                    : feedback === 'timeout'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
                autoFocus
              />
              <div className="flex justify-center gap-4">
                <button
                  type="submit"
                  disabled={isSubmitted || !answer.trim()}
                  className="rounded-xl bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  שלח
                </button>
              </div>
            </form>
          )}

          {/* Next button - only enabled after correction is complete */}
          {correctionMode && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleNext}
                disabled={!correctionComplete}
                className={`rounded-xl px-8 py-3 text-lg font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  correctionComplete
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'cursor-not-allowed bg-gray-400'
                }`}
              >
                הבא ←
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-4">
        <button
          onClick={onRestart}
          className="rounded-lg bg-orange-500 px-6 py-2 font-medium text-white transition-colors hover:bg-orange-600"
        >
          התחל מהתחלה
        </button>
        <button
          onClick={onStop}
          className="text-gray-500 transition-colors hover:text-gray-700"
        >
          עצור תרגול (Esc)
        </button>
      </div>
    </div>
  );
}
