'use client';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

/**
 * Error display component with retry functionality
 * Follows Single Responsibility Principle - only handles error state display
 */
export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-xl bg-red-50 p-8 shadow-lg" dir="rtl">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg
          className="h-8 w-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div className="text-center">
        <h3 className="mb-2 text-xl font-semibold text-red-800">
          משהו השתבש
        </h3>
        <p className="mb-6 text-red-600">{message}</p>
        <button
          onClick={onRetry}
          className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          נסה שוב
        </button>
      </div>
    </div>
  );
}
