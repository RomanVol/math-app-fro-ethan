'use client';

import { Round } from '@/lib/types';

interface SessionCompleteProps {
  rounds: Round[];
  onNewSession: () => void;
}

/**
 * Session completion screen showing final statistics
 * Follows Single Responsibility Principle - only handles completion display
 */
export function SessionComplete({ rounds, onNewSession }: SessionCompleteProps) {
  const totalExercises = rounds.reduce((sum, r) => sum + r.exercises.length, 0);
  const totalCorrect = rounds.reduce(
    (sum, r) => sum + r.exercises.filter((ex) => ex.correct).length,
    0
  );
  const totalTime = rounds.reduce((sum, r) => sum + r.total_time_sec, 0);

  // Find exercises that needed multiple attempts
  const exerciseAttempts: Record<string, number> = {};
  rounds.forEach((round) => {
    round.exercises.forEach((ex) => {
      exerciseAttempts[ex.exercise_id] = (exerciseAttempts[ex.exercise_id] || 0) + 1;
    });
  });

  const hardestExercises = Object.entries(exerciseAttempts)
    .filter(([, attempts]) => attempts > 1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-2xl space-y-8 text-center" dir="rtl">
      {/* Celebration */}
      <div className="space-y-4">
        <div className="text-6xl">🎉</div>
        <h1 className="text-4xl font-bold text-gray-900">כל הכבוד!</h1>
        <p className="text-xl text-gray-600">
          שלטת בכל 49 תרגילי הכפל!
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-blue-50 p-6">
          <div className="text-3xl font-bold text-blue-600">{rounds.length}</div>
          <div className="text-sm text-blue-800">סיבובים</div>
        </div>
        <div className="rounded-xl bg-green-50 p-6">
          <div className="text-3xl font-bold text-green-600">
            {Math.round((totalCorrect / totalExercises) * 100)}%
          </div>
          <div className="text-sm text-green-800">דיוק</div>
        </div>
        <div className="rounded-xl bg-purple-50 p-6">
          <div className="text-3xl font-bold text-purple-600">
            {Math.round(totalTime)} שניות
          </div>
          <div className="text-sm text-purple-800">זמן כולל</div>
        </div>
      </div>

      {/* Challenging exercises */}
      {hardestExercises.length > 0 && (
        <div className="rounded-xl bg-yellow-50 p-6">
          <h3 className="mb-4 font-semibold text-yellow-900">
            תרגילים שדרשו תרגול נוסף:
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {hardestExercises.map(([id, attempts]) => (
              <span
                key={id}
                className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-800"
              >
                {id} ({attempts} ניסיונות)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* New session button */}
      <button
        onClick={onNewSession}
        className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        התחל תרגול חדש
      </button>
    </div>
  );
}
