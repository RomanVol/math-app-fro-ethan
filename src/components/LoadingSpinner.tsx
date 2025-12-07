'use client';

interface LoadingSpinnerProps {
  message?: string;
}

/**
 * Loading spinner component with optional message
 * Follows Single Responsibility Principle - only handles loading state display
 */
export function LoadingSpinner({ message = 'טוען...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8" dir="rtl">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      <p className="text-lg text-gray-600">{message}</p>
    </div>
  );
}
