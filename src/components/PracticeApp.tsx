'use client';

import { useApp } from '@/context/AppContext';
import { SessionControls } from './SessionControls';
import { ExerciseDisplay } from './ExerciseDisplay';
import { RoundSummary } from './RoundSummary';
import { SessionComplete } from './SessionComplete';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';

/**
 * Main practice app component that orchestrates the practice flow
 * Follows Single Responsibility Principle - only handles flow orchestration
 */
export function PracticeApp() {
  const {
    state,
    startNewSession,
    submitAnswer,
    handleTimeout,
    continueToNextRound,
    stopSession,
    restartSession,
    retryAfterError,
    getCurrentExercise,
  } = useApp();

  // Show error state
  if (state.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <ErrorDisplay message={state.error} onRetry={retryAfterError} />
      </div>
    );
  }

  // Show loading state
  if (state.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner message="מכין את התרגול שלך..." />
      </div>
    );
  }

  // Idle state - show start screen
  if (state.phase === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <SessionControls
          onStart={startNewSession}
          isLoading={state.isLoading}
        />
      </div>
    );
  }

  // Exercise phase
  if (state.phase === 'exercise') {
    const currentExercise = getCurrentExercise();
    
    if (!currentExercise) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <LoadingSpinner message="טוען תרגיל הבא..." />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <ExerciseDisplay
          exercise={currentExercise}
          onSubmit={submitAnswer}
          onTimeout={handleTimeout}
          onStop={stopSession}
          onRestart={restartSession}
          roundNumber={state.currentRound?.round_number || 1}
          exerciseNumber={state.currentExerciseIndex + 1}
          totalExercises={state.pendingExercises.length}
        />
      </div>
    );
  }

  // Summary phase
  if (state.phase === 'summary') {
    const lastRound = state.completedRounds[state.completedRounds.length - 1];
    
    if (!lastRound) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <LoadingSpinner message="טוען תוצאות..." />
        </div>
      );
    }

    const hasFailedExercises = lastRound.exercises.some((ex) => !ex.correct);

    return (
      <div className="min-h-screen bg-gray-50 p-4 py-8">
        <RoundSummary
          round={lastRound}
          onContinue={continueToNextRound}
          onStop={stopSession}
          hasFailedExercises={hasFailedExercises}
        />
      </div>
    );
  }

  // Complete phase
  if (state.phase === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 py-8 overflow-auto">
        <SessionComplete
          rounds={state.completedRounds}
          onNewSession={startNewSession}
          comparison={state.sessionComparison}
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <SessionControls
        onStart={startNewSession}
        isLoading={state.isLoading}
      />
    </div>
  );
}
