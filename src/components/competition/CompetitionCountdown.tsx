'use client';

import React from 'react';

interface CompetitionCountdownProps {
  countdown: number;
}

export function CompetitionCountdown({ countdown }: CompetitionCountdownProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-8">מתחילים בעוד...</h2>
        <div className="relative">
          <div className="w-48 h-48 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl animate-pulse">
            <span className="text-9xl font-bold text-blue-600">
              {countdown || '🚀'}
            </span>
          </div>
          {/* Animated rings */}
          <div className="absolute inset-0 w-48 h-48 mx-auto rounded-full border-4 border-white opacity-50 animate-ping" />
        </div>
        <p className="text-2xl text-white mt-8 font-medium">התכוננו!</p>
      </div>
    </div>
  );
}
