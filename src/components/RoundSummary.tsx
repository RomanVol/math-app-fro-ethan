'use client';

import { Round, ExerciseAttempt } from '@/lib/types';

interface RoundSummaryProps {
  round: Round;
  onContinue: () => void;
  onStop: () => void;
  hasFailedExercises: boolean;
}

/**
 * Round summary component displaying results after each round
 * Follows Single Responsibility Principle - only handles round summary display
 */
export function RoundSummary({
  round,
  onContinue,
  onStop,
  hasFailedExercises,
}: RoundSummaryProps) {
  const correctCount = round.exercises.filter((ex) => ex.correct).length;
  const totalCount = round.exercises.length;
  const successRate = Math.round((correctCount / totalCount) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold text-gray-900">
          סיבוב {round.round_number} הושלם!
        </h2>
        <div className="flex justify-center gap-6 text-lg">
          <span className="text-gray-600">
            ציון:{' '}
            <span className="font-semibold text-blue-600">
              {correctCount}/{totalCount}
            </span>
          </span>
          <span className="text-gray-600">
            אחוז הצלחה:{' '}
            <span className="font-semibold text-blue-600">{successRate}%</span>
          </span>
          <span className="text-gray-600">
            זמן כולל:{' '}
            <span className="font-semibold text-blue-600">
              {round.total_time_sec.toFixed(1)} שניות
            </span>
          </span>
        </div>
      </div>

      {/* Results table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                תרגיל
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                התשובה שלך
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                נכון
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                תוצאה
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                זמן
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                התקדמות
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {round.exercises.map((exercise) => (
              <ExerciseRow key={exercise.exercise_id} exercise={exercise} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-4">
        {hasFailedExercises ? (
          <>
            <button
              onClick={onContinue}
              className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              המשך לסיבוב הבא ({totalCount - correctCount} תרגילים נותרו)
            </button>
            <button
              onClick={onStop}
              className="rounded-xl border-2 border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-700 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              עצור תרגול
            </button>
          </>
        ) : (
          <button
            onClick={onContinue}
            className="rounded-xl bg-green-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-green-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            🎉 סיים תרגול
          </button>
        )}
      </div>
    </div>
  );
}

interface ExerciseRowProps {
  exercise: ExerciseAttempt;
}

function ExerciseRow({ exercise }: ExerciseRowProps) {
  const correctAnswer = exercise.factors[0] * exercise.factors[1];

  const getResultBadge = () => {
    switch (exercise.result) {
      case 'improved':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            ↑ השתפר
          </span>
        );
      case 'deteriorated':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
            ↓ איטי יותר
          </span>
        );
      case 'same':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
            → זהה
          </span>
        );
      case 'first':
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            חדש
          </span>
        );
    }
  };

  return (
    <tr className={exercise.correct ? 'bg-white' : 'bg-red-50'}>
      <td className="whitespace-nowrap px-6 py-4 text-lg font-medium text-gray-900" dir="ltr">
        {exercise.factors[0]} × {exercise.factors[1]}
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        {exercise.user_answer !== null ? (
          <span
            className={`text-lg font-medium ${
              exercise.correct ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {exercise.user_answer}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        {exercise.correct ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
            ✓
          </span>
        ) : (
          <span className="text-gray-600">{correctAnswer}</span>
        )}
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        {exercise.correct ? (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            נכון
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
            שגוי
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-gray-600" dir="ltr">
        {exercise.time_taken_sec.toFixed(1)}s
      </td>
      <td className="whitespace-nowrap px-6 py-4">{getResultBadge()}</td>
    </tr>
  );
}
