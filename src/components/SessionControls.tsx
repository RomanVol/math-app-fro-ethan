'use client';

import { useState, useEffect } from 'react';
import { getTimeLimit, setTimeLimit } from '@/lib/exercises';

interface SessionControlsProps {
  onStart: () => void;
  onResume?: () => void;
  hasExistingSession?: boolean;
  isLoading?: boolean;
}

/**
 * Session control buttons for starting/resuming practice
 * Follows Single Responsibility Principle - only handles session control UI
 */
export function SessionControls({
  onStart,
  onResume,
  hasExistingSession = false,
  isLoading = false,
}: SessionControlsProps) {
  const [timePerExercise, setTimePerExercise] = useState(10);

  useEffect(() => {
    setTimePerExercise(getTimeLimit());
  }, []);

  const handleTimeChange = (value: number) => {
    setTimePerExercise(value);
    setTimeLimit(value);
  };

  return (
    <div className="flex flex-col items-center gap-8" dir="rtl">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          תרגול לוח הכפל
        </h1>
        <p className="text-lg text-gray-600">
          תרגלו את לוח הכפל מ-3×3 עד 9×9
        </p>
        <p className="mt-2 text-sm text-gray-500">
          49 תרגילים • ענו נכון בזמן המוקצב
        </p>
      </div>

      {/* Time setting */}
      <div className="rounded-xl bg-white p-6 shadow-lg">
        <label className="block text-center">
          <span className="text-lg font-semibold text-gray-700">זמן לכל תרגיל (שניות)</span>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              onClick={() => handleTimeChange(Math.max(3, timePerExercise - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-700 hover:bg-gray-300"
            >
              -
            </button>
            <span className="w-16 text-center text-3xl font-bold text-blue-600">{timePerExercise}</span>
            <button
              onClick={() => handleTimeChange(Math.min(60, timePerExercise + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-700 hover:bg-gray-300"
            >
              +
            </button>
          </div>
          <div className="mt-2 flex justify-center gap-2">
            {[5, 10, 15, 20, 30].map((time) => (
              <button
                key={time}
                onClick={() => handleTimeChange(time)}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                  timePerExercise === time
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </label>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          onClick={onStart}
          disabled={isLoading}
          className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'מתחיל...' : 'התחל תרגול חדש'}
        </button>

        {hasExistingSession && onResume && (
          <button
            onClick={onResume}
            disabled={isLoading}
            className="rounded-xl border-2 border-blue-600 bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            המשך תרגול קודם
          </button>
        )}
      </div>

      <div className="mt-8 rounded-lg bg-blue-50 p-6 text-center">
        <h3 className="mb-2 font-semibold text-blue-900">איך זה עובד:</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• תראו תרגילי כפל אחד אחרי השני</li>
          <li>• הקלידו את התשובה ולחצו Enter לשליחה</li>
          <li>• תשובה נכונה בזמן = ✓ ירוק</li>
          <li>• תשובה לא נכונה = ✗ אדום + התשובה הנכונה</li>
          <li>• עבר הזמן = ⏱ כתום + התשובה הנכונה</li>
          <li>• תשובות שגויות יחזרו בסיבוב הבא</li>
        </ul>
      </div>
    </div>
  );
}
