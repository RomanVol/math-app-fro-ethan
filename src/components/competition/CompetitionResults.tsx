'use client';

import React from 'react';
import { PlayerResult, CompetitionRoom } from '@/lib/competitionTypes';

interface CompetitionResultsProps {
  room: CompetitionRoom;
  results: PlayerResult[];
  playerId: string;
  onLeaveRoom: () => Promise<void>;
}

export function CompetitionResults({
  room,
  results,
  playerId,
  onLeaveRoom,
}: CompetitionResultsProps) {
  const myResult = results.find(r => r.playerId === playerId);
  const winner = results[0];
  const isWinner = winner?.playerId === playerId;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 
      ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
      : `${remainingSeconds} שניות`;
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-4" dir="rtl">
      <div className="max-w-md mx-auto">
        {/* Winner Celebration */}
        <div className="text-center mb-6">
          {isWinner && results.length > 1 ? (
            <>
              <div className="text-8xl mb-4 animate-bounce">🏆</div>
              <h1 className="text-4xl font-bold text-white mb-2">ניצחת!</h1>
              <p className="text-xl text-white/90">כל הכבוד! היית הכי מהיר!</p>
            </>
          ) : results.length === 1 ? (
            <>
              <div className="text-8xl mb-4">⭐</div>
              <h1 className="text-4xl font-bold text-white mb-2">סיימת!</h1>
              <p className="text-xl text-white/90">עבודה מצוינת!</p>
            </>
          ) : (
            <>
              <div className="text-8xl mb-4">🎮</div>
              <h1 className="text-4xl font-bold text-white mb-2">המשחק הסתיים!</h1>
              <p className="text-xl text-white/90">
                סיימת במקום ה-{myResult?.rank}
              </p>
            </>
          )}
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            🏅 תוצאות
          </h2>
          
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.playerId}
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  result.playerId === playerId
                    ? 'bg-blue-100 border-2 border-blue-400'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {getRankEmoji(result.rank)}
                  </span>
                  <div>
                    <div className="font-bold text-gray-800">
                      {result.playerName}
                      {result.playerId === playerId && ' (את/ה)'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(result.totalTime)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {result.correctAnswers}/{room.settings.exerciseCount}
                  </div>
                  <div className="text-sm text-gray-500">
                    {result.accuracy.toFixed(0)}% דיוק
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Stats */}
        {myResult && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              📊 הסטטיסטיקות שלך
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-100 rounded-xl p-3">
                <div className="text-3xl font-bold text-green-600">
                  {myResult.correctAnswers}
                </div>
                <div className="text-sm text-gray-600">תשובות נכונות</div>
              </div>
              <div className="bg-red-100 rounded-xl p-3">
                <div className="text-3xl font-bold text-red-600">
                  {myResult.wrongAnswers}
                </div>
                <div className="text-sm text-gray-600">שגיאות</div>
              </div>
              <div className="bg-blue-100 rounded-xl p-3">
                <div className="text-3xl font-bold text-blue-600">
                  {formatTime(myResult.totalTime)}
                </div>
                <div className="text-sm text-gray-600">זמן כולל</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onLeaveRoom}
            className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold text-xl hover:bg-blue-600 transition-all transform hover:scale-105"
          >
            🔄 משחק חדש
          </button>
          <a
            href="/"
            className="block w-full py-3 text-center bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
          >
            ← חזרה לתרגול רגיל
          </a>
        </div>
      </div>
    </div>
  );
}
