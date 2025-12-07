'use client';

import { SessionComparison } from '@/lib/storage';

interface SessionComparisonProps {
  comparison: SessionComparison;
}

/**
 * Format date and time in Hebrew
 */
function formatDateTime(isoString: string): { date: string; time: string } {
  const d = new Date(isoString);
  const date = d.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return { date, time };
}

/**
 * Format seconds to minutes:seconds
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')} דקות`;
  }
  return `${secs} שניות`;
}

/**
 * Get improvement indicator
 */
function getChangeIndicator(current: number, previous: number, inverse = false): {
  icon: string;
  color: string;
  diff: string;
} {
  const diff = current - previous;
  const improved = inverse ? diff < 0 : diff > 0;
  const deteriorated = inverse ? diff > 0 : diff < 0;

  if (Math.abs(diff) < 0.01) {
    return { icon: '➡️', color: 'text-gray-500', diff: 'ללא שינוי' };
  }

  if (improved) {
    return {
      icon: '📈',
      color: 'text-green-600',
      diff: inverse ? `מהיר ב-${Math.abs(diff).toFixed(1)}` : `+${diff.toFixed(1)}`,
    };
  }

  return {
    icon: '📉',
    color: 'text-red-600',
    diff: inverse ? `איטי ב-${Math.abs(diff).toFixed(1)}` : `${diff.toFixed(1)}`,
  };
}

/**
 * Simple comparison component showing current vs previous session
 */
export function SessionComparisonView({ comparison }: SessionComparisonProps) {
  const { currentSession, previousSession, stats } = comparison;

  const currentDateTime = formatDateTime(currentSession.start_time);
  const previousDateTime = previousSession ? formatDateTime(previousSession.start_time) : null;

  // If no previous session, show first session message
  if (!previousSession) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white text-center" dir="rtl">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold mb-2">זהו התרגול הראשון שלך!</h2>
        <p className="text-lg opacity-90">
          📅 {currentDateTime.date} בשעה {currentDateTime.time}
        </p>
        <p className="text-sm opacity-70 mt-3">
          בתרגולים הבאים תוכל לראות את ההתקדמות שלך
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with dates */}
      <div className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <h2 className="text-2xl font-bold text-center mb-4">📊 השוואה לתרגול הקודם</h2>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-sm opacity-80">תרגול קודם</div>
            <div className="font-bold">{previousDateTime?.date}</div>
            <div className="text-sm">{previousDateTime?.time}</div>
          </div>
          <div className="bg-white/30 rounded-lg p-3 ring-2 ring-white/50">
            <div className="text-sm opacity-80">תרגול נוכחי</div>
            <div className="font-bold">{currentDateTime.date}</div>
            <div className="text-sm">{currentDateTime.time}</div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-lg">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">מדד</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-500">קודם</th>
              <th className="px-4 py-3 text-center font-semibold text-blue-600">עכשיו</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">שינוי</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* Rounds */}
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-4 font-medium text-gray-900">🔄 מספר סיבובים</td>
              <td className="px-4 py-4 text-center text-gray-500 text-lg">
                {previousSession.total_rounds}
              </td>
              <td className="px-4 py-4 text-center text-blue-600 text-lg font-bold">
                {currentSession.total_rounds}
              </td>
              <td className="px-4 py-4 text-center">
                {(() => {
                  const change = getChangeIndicator(
                    currentSession.total_rounds,
                    previousSession.total_rounds,
                    true // inverse - less is better
                  );
                  return (
                    <span className={`font-medium ${change.color}`}>
                      {change.icon}
                    </span>
                  );
                })()}
              </td>
            </tr>

            {/* Accuracy */}
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-4 font-medium text-gray-900">🎯 דיוק</td>
              <td className="px-4 py-4 text-center text-gray-500 text-lg">
                {previousSession.success_rate.toFixed(0)}%
              </td>
              <td className="px-4 py-4 text-center text-blue-600 text-lg font-bold">
                {currentSession.success_rate.toFixed(0)}%
              </td>
              <td className="px-4 py-4 text-center">
                {(() => {
                  const change = getChangeIndicator(
                    currentSession.success_rate,
                    previousSession.success_rate
                  );
                  return (
                    <span className={`font-medium ${change.color}`}>
                      {change.icon}
                    </span>
                  );
                })()}
              </td>
            </tr>

            {/* Total Time */}
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-4 font-medium text-gray-900">⏱️ זמן כולל</td>
              <td className="px-4 py-4 text-center text-gray-500">
                {formatTime(previousSession.average_time_sec * previousSession.total_exercises)}
              </td>
              <td className="px-4 py-4 text-center text-blue-600 font-bold">
                {formatTime(currentSession.average_time_sec * currentSession.total_exercises)}
              </td>
              <td className="px-4 py-4 text-center">
                {(() => {
                  const prevTotal = previousSession.average_time_sec * previousSession.total_exercises;
                  const currTotal = currentSession.average_time_sec * currentSession.total_exercises;
                  const change = getChangeIndicator(currTotal, prevTotal, true);
                  return (
                    <span className={`font-medium ${change.color}`}>
                      {change.icon}
                    </span>
                  );
                })()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Overall Progress Indicator */}
      {(() => {
        const roundsImproved = currentSession.total_rounds < previousSession.total_rounds;
        const accuracyImproved = currentSession.success_rate > previousSession.success_rate;
        const timeImproved = currentSession.average_time_sec < previousSession.average_time_sec;
        const improvements = [roundsImproved, accuracyImproved, timeImproved].filter(Boolean).length;

        let message: string;
        let emoji: string;
        let bgColor: string;

        if (improvements >= 2) {
          message = 'התקדמות מעולה! 🌟';
          emoji = '🚀';
          bgColor = 'bg-green-100 border-green-300';
        } else if (improvements === 1) {
          message = 'יש שיפור! המשך כך 💪';
          emoji = '📈';
          bgColor = 'bg-blue-100 border-blue-300';
        } else {
          message = 'תמשיך להתאמן, השיפור יגיע! 💪';
          emoji = '🎯';
          bgColor = 'bg-yellow-100 border-yellow-300';
        }

        return (
          <div className={`rounded-xl p-6 text-center border-2 ${bgColor}`}>
            <div className="text-4xl mb-2">{emoji}</div>
            <div className="text-xl font-bold text-gray-800">{message}</div>
          </div>
        );
      })()}
    </div>
  );
}
