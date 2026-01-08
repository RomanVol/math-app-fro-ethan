'use client';

import { useState, useEffect } from 'react';
import { getTimeLimit, setTimeLimit, getSelectedTables, setSelectedTables } from '@/lib/exercises';
import { TableSelector } from './TableSelector';

interface SessionControlsProps {
  onStart: (selectedTables: number[]) => void;
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
  const [selectedTables, setSelectedTablesState] = useState<number[]>([3, 4, 5, 6, 7, 8, 9]);

  useEffect(() => {
    setTimePerExercise(getTimeLimit());
    setSelectedTablesState(getSelectedTables());
  }, []);

  const handleTimeChange = (value: number) => {
    setTimePerExercise(value);
    setTimeLimit(value);
  };

  const handleTablesChange = (tables: number[]) => {
    setSelectedTablesState(tables);
    setSelectedTables(tables);
  };

  const handleStart = () => {
    onStart(selectedTables);
  };

  const exerciseCount = selectedTables.length * selectedTables.length;

  return (
    <div className="flex flex-col items-center gap-6" dir="rtl">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          תרגול לוח הכפל
        </h1>
        <p className="text-lg text-gray-600">
          בחרו את לוחות הכפל לתרגול
        </p>
      </div>

      {/* Table Selection */}
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-center text-lg font-semibold text-gray-700">
          בחירת לוחות כפל
        </h3>
        <TableSelector
          selectedTables={selectedTables}
          onSelectionChange={handleTablesChange}
          availableTables={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
        />
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
          onClick={handleStart}
          disabled={isLoading || selectedTables.length === 0}
          className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'מתחיל...' : `התחל תרגול (${exerciseCount} תרגילים)`}
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

      {/* Competition Mode Link */}
      <a
        href="/competition"
        className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-purple-600 hover:to-pink-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        🏆 מצב תחרות - שחק עם חברים!
      </a>

      <div className="mt-4 rounded-lg bg-blue-50 p-6 text-center">
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
