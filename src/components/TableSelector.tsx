'use client';

import React from 'react';

interface TableSelectorProps {
  selectedTables: number[];
  onSelectionChange: (tables: number[]) => void;
  availableTables?: number[];
}

/**
 * A reusable component for selecting multiplication tables
 */
export function TableSelector({
  selectedTables,
  onSelectionChange,
  availableTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
}: TableSelectorProps) {
  const toggleTable = (num: number) => {
    if (selectedTables.includes(num)) {
      // Don't allow deselecting if it's the last one
      if (selectedTables.length > 1) {
        onSelectionChange(selectedTables.filter((t) => t !== num));
      }
    } else {
      onSelectionChange([...selectedTables, num].sort((a, b) => a - b));
    }
  };

  const selectAll = () => {
    onSelectionChange([...availableTables]);
  };

  const selectRange = (start: number, end: number) => {
    const range = availableTables.filter((n) => n >= start && n <= end);
    onSelectionChange(range);
  };

  const exerciseCount = selectedTables.length * selectedTables.length;

  return (
    <div className="space-y-4">
      {/* Quick selection buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={selectAll}
          className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200 transition-colors"
        >
          הכל
        </button>
        <button
          onClick={() => selectRange(1, 5)}
          className="rounded-lg bg-green-100 px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-200 transition-colors"
        >
          1-5
        </button>
        <button
          onClick={() => selectRange(6, 10)}
          className="rounded-lg bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 hover:bg-purple-200 transition-colors"
        >
          6-10
        </button>
        <button
          onClick={() => selectRange(3, 9)}
          className="rounded-lg bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 hover:bg-orange-200 transition-colors"
        >
          3-9
        </button>
      </div>

      {/* Individual table buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        {availableTables.map((num) => (
          <button
            key={num}
            onClick={() => toggleTable(num)}
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold transition-all transform hover:scale-110 ${
              selectedTables.includes(num)
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Exercise count */}
      <div className="text-center text-sm text-gray-600">
        {selectedTables.length > 0 ? (
          <>
            לוחות נבחרים: <span className="font-bold text-blue-600">{selectedTables.join(', ')}</span>
            <br />
            <span className="text-gray-500">({exerciseCount} תרגילים)</span>
          </>
        ) : (
          <span className="text-red-500">יש לבחור לפחות לוח כפל אחד</span>
        )}
      </div>
    </div>
  );
}
