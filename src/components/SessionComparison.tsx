'use client';

import { SessionComparison, ExerciseImprovement } from '@/lib/storage';

interface SessionComparisonProps {
  comparison: SessionComparison;
}

/**
 * Component to display session comparison with previous sessions
 * Shows improvements, deteriorations, and new records
 */
export function SessionComparisonView({ comparison }: SessionComparisonProps) {
  const { currentSession, previousSession, improvement, exerciseImprovements, stats } = comparison;

  const getImprovementColor = (value: number, inverse = false) => {
    const improved = inverse ? value < 0 : value > 0;
    const deteriorated = inverse ? value > 0 : value < 0;
    
    if (improved) return 'text-green-600';
    if (deteriorated) return 'text-red-600';
    return 'text-gray-600';
  };

  const getImprovementIcon = (value: number, inverse = false) => {
    const improved = inverse ? value < 0 : value > 0;
    const deteriorated = inverse ? value > 0 : value < 0;
    
    if (improved) return '↑';
    if (deteriorated) return '↓';
    return '→';
  };

  const getStatusBadge = (status: ExerciseImprovement['status']) => {
    switch (status) {
      case 'new_record':
        return (
          <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
            🏆 שיא חדש!
          </span>
        );
      case 'mastered':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            ⭐ מושלם
          </span>
        );
      case 'improved':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            📈 שיפור
          </span>
        );
      case 'same':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
            ➡️ ללא שינוי
          </span>
        );
      case 'deteriorated':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
            📉 לתרגל יותר
          </span>
        );
      case 'new':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
            🆕 ראשון
          </span>
        );
    }
  };

  const getTimeDiff = (current: number, previous: number | null) => {
    if (previous === null) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 0.1) return null;
    
    const sign = diff < 0 ? '' : '+';
    const color = diff < 0 ? 'text-green-600' : 'text-red-600';
    return (
      <span className={`text-xs ${color}`}>
        ({sign}{diff.toFixed(1)}s)
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6" dir="rtl">
      {/* Summary Header */}
      <div className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-center">📊 השוואה לתרגולים קודמים</h2>
        
        {previousSession ? (
          <div className="grid grid-cols-3 gap-4 text-center">
            {/* Success Rate */}
            <div className="rounded-lg bg-white/20 p-4">
              <div className="text-sm opacity-80">אחוז הצלחה</div>
              <div className="text-2xl font-bold">
                {currentSession.success_rate.toFixed(0)}%
              </div>
              <div className={`text-sm font-medium ${improvement.successRate >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {getImprovementIcon(improvement.successRate)} {Math.abs(improvement.successRate).toFixed(1)}%
              </div>
            </div>

            {/* Average Time */}
            <div className="rounded-lg bg-white/20 p-4">
              <div className="text-sm opacity-80">זמן ממוצע</div>
              <div className="text-2xl font-bold">
                {currentSession.average_time_sec.toFixed(1)}s
              </div>
              <div className={`text-sm font-medium ${improvement.averageTime <= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {getImprovementIcon(improvement.averageTime, true)} {Math.abs(improvement.averageTime).toFixed(1)}s
              </div>
            </div>

            {/* Rounds */}
            <div className="rounded-lg bg-white/20 p-4">
              <div className="text-sm opacity-80">מספר סיבובים</div>
              <div className="text-2xl font-bold">
                {currentSession.total_rounds}
              </div>
              <div className={`text-sm font-medium ${improvement.totalRounds <= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {getImprovementIcon(improvement.totalRounds, true)} {Math.abs(improvement.totalRounds)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-xl opacity-90">
              זהו התרגול הראשון שלך!
            </div>
            <div className="text-sm opacity-70 mt-2">
              בתרגולים הבאים תוכל לראות את ההתקדמות שלך
            </div>
          </div>
        )}
      </div>

      {/* Improvement Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.newRecords > 0 && (
          <div className="rounded-lg bg-purple-50 p-4 text-center border-2 border-purple-200">
            <div className="text-3xl font-bold text-purple-600">{stats.newRecords}</div>
            <div className="text-sm text-purple-700">🏆 שיאים חדשים</div>
          </div>
        )}
        <div className="rounded-lg bg-green-50 p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.improved + stats.mastered}</div>
          <div className="text-sm text-green-700">📈 שיפורים</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <div className="text-3xl font-bold text-gray-600">{stats.same}</div>
          <div className="text-sm text-gray-700">➡️ ללא שינוי</div>
        </div>
        <div className="rounded-lg bg-red-50 p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{stats.deteriorated}</div>
          <div className="text-sm text-red-700">📉 לתרגל</div>
        </div>
      </div>

      {/* Exercise Details Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-lg">
        <div className="bg-gray-50 px-6 py-3 border-b">
          <h3 className="font-semibold text-gray-900">פירוט לפי תרגיל</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">תרגיל</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">הפעם</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">קודם</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">שיא</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exerciseImprovements.map((exercise) => (
                <tr 
                  key={exercise.exercise_id}
                  className={
                    exercise.status === 'new_record'
                      ? 'bg-purple-50'
                      : exercise.status === 'improved' || exercise.status === 'mastered'
                      ? 'bg-green-50'
                      : exercise.status === 'deteriorated'
                      ? 'bg-red-50'
                      : 'bg-white'
                  }
                >
                  <td className="whitespace-nowrap px-4 py-3 text-lg font-bold text-gray-900" dir="ltr">
                    {exercise.factors[0]} × {exercise.factors[1]}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      {exercise.currentCorrect ? (
                        <span className="text-green-600 text-lg">✓</span>
                      ) : (
                        <span className="text-red-600 text-lg">✗</span>
                      )}
                      <span className="text-gray-700 font-medium" dir="ltr">
                        {exercise.currentTime.toFixed(1)}s
                      </span>
                      {getTimeDiff(exercise.currentTime, exercise.previousTime)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {exercise.previousTime !== null ? (
                      <div className="flex items-center gap-2">
                        {exercise.previousCorrect ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                        <span className="text-gray-600" dir="ltr">
                          {exercise.previousTime.toFixed(1)}s
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {exercise.bestTime !== null ? (
                      <span className="text-purple-600 font-medium" dir="ltr">
                        {exercise.bestTime.toFixed(1)}s
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {getStatusBadge(exercise.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-lg bg-gray-50 p-4">
        <div className="text-sm text-gray-600 text-center">
          <span className="inline-flex items-center gap-1 mx-2">🏆 שיא חדש = מהיר מכל הפעמים הקודמות</span>
          <span className="inline-flex items-center gap-1 mx-2">📈 שיפור = מהיר מהפעם הקודמת</span>
          <span className="inline-flex items-center gap-1 mx-2">⭐ מושלם = נכון בפעם הראשונה</span>
        </div>
      </div>
    </div>
  );
}
