'use client';

import { Round } from '@/lib/types';
import { SessionComparison } from '@/lib/storage';
import { SessionComparisonView } from './SessionComparison';

interface SessionCompleteProps {
  rounds: Round[];
  onNewSession: () => void;
  comparison?: SessionComparison | null;
}

/**
 * Format date and time in Hebrew
 */
function formatDateTime(isoString: string): string {
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
  return `${date} בשעה ${time}`;
}

/**
 * Format seconds to minutes:seconds
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return `${secs} שניות`;
}

/**
 * Session completion screen showing final statistics and comparison
 */
export function SessionComplete({ rounds, onNewSession, comparison }: SessionCompleteProps) {
  const totalTime = rounds.reduce((sum, r) => sum + r.total_time_sec, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4" dir="rtl">
      {/* Celebration Header */}
      <div className="rounded-xl bg-gradient-to-r from-green-500 to-blue-600 p-6 text-white text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-3xl font-bold mb-2">כל הכבוד!</h1>
        <p className="text-lg opacity-90">שלטת בכל 49 תרגילי הכפל!</p>
        <p className="text-sm opacity-70 mt-2">
          📅 {formatDateTime(comparison?.currentSession.start_time || new Date().toISOString())}
        </p>
      </div>

      {/* Current Session Stats */}
      <div className="rounded-xl bg-white shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">📋 סיכום התרגול</h2>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-blue-50 p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{rounds.length}</div>
            <div className="text-sm text-blue-800">🔄 סיבובים</div>
          </div>
          <div className="rounded-xl bg-green-50 p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {comparison ? comparison.currentSession.success_rate.toFixed(0) : 100}%
            </div>
            <div className="text-sm text-green-800">🎯 דיוק</div>
          </div>
          <div className="rounded-xl bg-purple-50 p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {formatTime(totalTime)}
            </div>
            <div className="text-sm text-purple-800">⏱️ זמן כולל</div>
          </div>
        </div>
      </div>

      {/* Comparison with Previous Session */}
      {comparison && (
        <SessionComparisonView comparison={comparison} />
      )}

      {/* New session button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onNewSession}
          className="rounded-xl bg-gradient-to-r from-green-500 to-blue-500 px-8 py-4 text-xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          🔄 התחל תרגול חדש
        </button>
      </div>
    </div>
  );
}
