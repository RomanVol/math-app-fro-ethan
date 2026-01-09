'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CompetitionRoom, CompetitionExercise } from '@/lib/competitionTypes';

interface CompetitionGameProps {
  room: CompetitionRoom;
  playerId: string;
  currentExercise: CompetitionExercise;
  exerciseIndex: number;
  totalExercises: number;
  onSubmitAnswer: (answer: number) => Promise<boolean>;
}

export function CompetitionGame({
  room,
  playerId,
  currentExercise,
  exerciseIndex,
  totalExercises,
  onSubmitAnswer,
}: CompetitionGameProps) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount and when exercise changes
  useEffect(() => {
    setAnswer('');
    setFeedback(null);
    inputRef.current?.focus();
  }, [currentExercise.id]);

  const handleSubmit = async () => {
    if (isSubmitting || !answer.trim()) return;
    
    setIsSubmitting(true);
    const numAnswer = parseInt(answer, 10);
    const isCorrect = await onSubmitAnswer(numAnswer);
    
    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    // Brief delay to show feedback
    setTimeout(() => {
      setFeedback(null);
      setAnswer('');
      setIsSubmitting(false);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Calculate other players' progress
  const players = Object.values(room.players);
  const otherPlayers = players.filter(p => p.id !== playerId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-4" dir="rtl">
      <div className="max-w-lg mx-auto">
        {/* Progress Bar */}
        <div className="bg-white rounded-full h-4 mb-4 overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all duration-300"
            style={{ width: `${((exerciseIndex) / totalExercises) * 100}%` }}
          />
        </div>
        
        {/* Exercise Counter */}
        <div className="text-center text-white mb-4">
          <span className="text-xl font-bold">
            תרגיל {exerciseIndex + 1} מתוך {totalExercises}
          </span>
        </div>

        {/* Exercise Card */}
        <div
          className={`bg-white rounded-3xl shadow-xl p-8 mb-6 transition-all duration-200 ${
            feedback === 'correct'
              ? 'bg-green-100 scale-105'
              : feedback === 'wrong'
              ? 'bg-red-100 shake'
              : ''
          }`}
        >
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-800 mb-8">
              {currentExercise.num1} × {currentExercise.num2} = ?
            </div>
            
            <input
              ref={inputRef}
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="התשובה שלך"
              className="w-full text-center text-4xl font-bold py-4 border-4 border-blue-300 rounded-2xl focus:border-blue-500 focus:outline-none text-black placeholder:text-gray-400 bg-white"
              disabled={isSubmitting}
              autoFocus
            />
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !answer.trim()}
              className={`w-full mt-4 py-4 rounded-xl font-bold text-2xl transition-all ${
                answer.trim() && !isSubmitting
                  ? 'bg-blue-500 text-white hover:bg-blue-600 transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? '⏳' : '✓ שלח'}
            </button>
          </div>
        </div>

        {/* Other Players Progress */}
        {otherPlayers.length > 0 && (
          <div className="bg-white/90 rounded-2xl p-4">
            <h3 className="text-lg font-bold text-gray-700 mb-3">התקדמות המתחרים</h3>
            <div className="space-y-2">
              {otherPlayers.map((player) => {
                const progress = (player.currentExerciseIndex / totalExercises) * 100;
                const isFinished = player.finishedAt !== undefined;
                
                return (
                  <div key={player.id} className="flex items-center gap-3">
                    <span className="w-20 truncate font-medium text-gray-700">
                      {player.name}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFinished ? 'bg-green-500' : 'bg-blue-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12">
                      {isFinished ? '✓ סיים' : `${player.currentExerciseIndex}/${totalExercises}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .shake {
          animation: shake 0.3s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}
