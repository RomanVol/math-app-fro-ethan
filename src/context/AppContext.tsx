'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import {
  AppState,
  Session,
  Round,
  Exercise,
  ExerciseAttempt,
  ExerciseResult,
} from '@/lib/types';
import {
  generateAllExercises,
  generateExercisesForTables,
  shuffleExercises,
  isAnswerCorrect,
  filterExercisesByIds,
  getTimeLimit,
} from '@/lib/exercises';
import {
  createSession,
  updateSession,
  saveRound,
  getActiveSession,
  getSessionRounds,
  StorageError,
  saveExerciseToHistory,
  saveSessionSummary,
  compareWithPreviousSessions,
  getLastHistoricalAttempt,
  SessionComparison,
} from '@/lib/storage';

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'START_SESSION'; payload: { session: Session; exercises: Exercise[] } }
  | { type: 'RESUME_SESSION'; payload: { session: Session; rounds: Round[]; exercises: Exercise[] } }
  | { type: 'SET_PHASE'; payload: AppState['phase'] }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'RECORD_ATTEMPT'; payload: ExerciseAttempt }
  | { type: 'END_ROUND'; payload: Round }
  | { type: 'START_NEXT_ROUND'; payload: Exercise[] }
  | { type: 'COMPLETE_SESSION'; payload: { comparison: SessionComparison } }
  | { type: 'STOP_SESSION' }
  | { type: 'RESET' };

// Extended state with comparison
interface ExtendedAppState extends AppState {
  sessionComparison: SessionComparison | null;
}

// Initial state
const initialState: ExtendedAppState = {
  session: null,
  currentRound: null,
  completedRounds: [],
  allExercises: [],
  pendingExercises: [],
  currentExerciseIndex: 0,
  isLoading: false,
  error: null,
  phase: 'idle',
  sessionComparison: null,
};

// Reducer
function appReducer(state: ExtendedAppState, action: AppAction): ExtendedAppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'START_SESSION':
      return {
        ...state,
        session: action.payload.session,
        allExercises: generateAllExercises(),
        pendingExercises: action.payload.exercises,
        currentExerciseIndex: 0,
        currentRound: {
          round_number: 1,
          total_time_sec: 0,
          exercises: [],
        },
        completedRounds: [],
        phase: 'exercise',
        isLoading: false,
        error: null,
        sessionComparison: null,
      };

    case 'RESUME_SESSION':
      const pendingIds = action.payload.session.pending_exercises;
      const resumeExercises = pendingIds.length > 0
        ? filterExercisesByIds(action.payload.exercises, pendingIds)
        : action.payload.exercises;
      
      return {
        ...state,
        session: action.payload.session,
        allExercises: action.payload.exercises,
        pendingExercises: shuffleExercises(resumeExercises),
        currentExerciseIndex: 0,
        currentRound: {
          round_number: action.payload.session.current_round,
          total_time_sec: 0,
          exercises: [],
        },
        completedRounds: action.payload.rounds,
        phase: 'exercise',
        isLoading: false,
        error: null,
        sessionComparison: null,
      };

    case 'SET_PHASE':
      return { ...state, phase: action.payload };

    case 'NEXT_EXERCISE':
      return {
        ...state,
        currentExerciseIndex: state.currentExerciseIndex + 1,
      };

    case 'RECORD_ATTEMPT':
      if (!state.currentRound) return state;
      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          exercises: [...state.currentRound.exercises, action.payload],
          total_time_sec: state.currentRound.total_time_sec + action.payload.time_taken_sec,
        },
      };

    case 'END_ROUND':
      return {
        ...state,
        completedRounds: [...state.completedRounds, action.payload],
        phase: 'summary',
      };

    case 'START_NEXT_ROUND':
      if (!state.session) return state;
      const newRoundNumber = state.completedRounds.length + 1;
      return {
        ...state,
        pendingExercises: action.payload,
        currentExerciseIndex: 0,
        currentRound: {
          round_number: newRoundNumber,
          total_time_sec: 0,
          exercises: [],
        },
        phase: 'exercise',
      };

    case 'COMPLETE_SESSION':
      return {
        ...state,
        phase: 'complete',
        sessionComparison: action.payload.comparison,
      };

    case 'STOP_SESSION':
      return {
        ...state,
        phase: 'idle',
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: ExtendedAppState;
  startNewSession: (selectedTables?: number[]) => Promise<void>;
  resumeSession: () => Promise<void>;
  submitAnswer: (answer: number, elapsedTime: number) => Promise<void>;
  handleTimeout: (elapsedTime: number) => Promise<void>;
  continueToNextRound: () => Promise<void>;
  stopSession: () => Promise<void>;
  restartSession: () => Promise<void>;
  retryAfterError: () => void;
  getCurrentExercise: () => Exercise | null;
  getPreviousAttempt: (exerciseId: string) => ExerciseAttempt | null;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const pendingRetryAction = useRef<(() => Promise<void>) | null>(null);

  // Get current exercise
  const getCurrentExercise = useCallback((): Exercise | null => {
    if (state.currentExerciseIndex >= state.pendingExercises.length) {
      return null;
    }
    return state.pendingExercises[state.currentExerciseIndex];
  }, [state.pendingExercises, state.currentExerciseIndex]);

  // Get previous attempt for an exercise (from any completed round)
  const getPreviousAttempt = useCallback((exerciseId: string): ExerciseAttempt | null => {
    for (let i = state.completedRounds.length - 1; i >= 0; i--) {
      const attempt = state.completedRounds[i].exercises.find(
        (ex) => ex.exercise_id === exerciseId
      );
      if (attempt) return attempt;
    }
    return null;
  }, [state.completedRounds]);

  // Calculate result compared to previous attempt
  const calculateResult = useCallback((
    exerciseId: string,
    correct: boolean,
    timeTaken: number
  ): ExerciseResult => {
    const prevAttempt = getPreviousAttempt(exerciseId);
    
    if (!prevAttempt) {
      return 'first';
    }

    if (correct && !prevAttempt.correct) {
      return 'improved';
    }
    
    if (!correct && prevAttempt.correct) {
      return 'deteriorated';
    }
    
    if (correct && prevAttempt.correct) {
      if (timeTaken < prevAttempt.time_taken_sec) {
        return 'improved';
      } else if (timeTaken > prevAttempt.time_taken_sec) {
        return 'deteriorated';
      }
    }
    
    return 'same';
  }, [getPreviousAttempt]);

  // Save session state for resumption
  const saveSessionState = useCallback(async (
    pendingExerciseIds: string[],
    activeExerciseId: string | null,
    currentRound: number
  ) => {
    if (!state.session) return;

    try {
      await updateSession(state.session.id, {
        pending_exercises: pendingExerciseIds,
        active_exercise: activeExerciseId,
        current_round: currentRound,
      });
    } catch (error) {
      console.error('Failed to save session state:', error);
      throw error;
    }
  }, [state.session]);

  // Start a new session
  const startNewSession = useCallback(async (selectedTables?: number[]) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    const action = async () => {
      try {
        const session = await createSession();
        // Use selected tables or default to 3-9
        const tables = selectedTables && selectedTables.length > 0 
          ? selectedTables 
          : [3, 4, 5, 6, 7, 8, 9];
        const allExercises = generateExercisesForTables(tables);
        const shuffled = shuffleExercises(allExercises);

        dispatch({
          type: 'START_SESSION',
          payload: { session, exercises: shuffled },
        });

        // Save initial state
        await updateSession(session.id, {
          pending_exercises: shuffled.map((e) => e.exercise_id),
          active_exercise: shuffled[0]?.exercise_id || null,
          current_round: 1,
        });
      } catch (error) {
        const message = error instanceof StorageError
          ? error.message
          : 'Failed to start session. Please try again.';
        dispatch({ type: 'SET_ERROR', payload: message });
        pendingRetryAction.current = action;
      }
    };

    await action();
  }, []);

  // Resume an existing session
  const resumeSession = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    const action = async () => {
      try {
        const session = await getActiveSession();
        
        if (!session) {
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        const rounds = await getSessionRounds(session.id);
        const allExercises = generateAllExercises();

        dispatch({
          type: 'RESUME_SESSION',
          payload: { session, rounds, exercises: allExercises },
        });
      } catch (error) {
        const message = error instanceof StorageError
          ? error.message
          : 'Failed to resume session. Please try again.';
        dispatch({ type: 'SET_ERROR', payload: message });
        pendingRetryAction.current = action;
      }
    };

    await action();
  }, []);

  // Submit an answer
  const submitAnswer = useCallback(async (answer: number, elapsedTime: number) => {
    const exercise = getCurrentExercise();
    if (!exercise || !state.session) return;

    const timeLimit = getTimeLimit();
    const correct = isAnswerCorrect(exercise, answer) && elapsedTime < timeLimit;
    const timeTaken = correct ? elapsedTime : timeLimit;
    const result = calculateResult(exercise.exercise_id, correct, timeTaken);

    const attempt: ExerciseAttempt = {
      exercise_id: exercise.exercise_id,
      factors: exercise.factors,
      user_answer: answer,
      correct,
      time_taken_sec: parseFloat(timeTaken.toFixed(2)),
      result,
    };

    // Save to global history for cross-session comparison
    saveExerciseToHistory(state.session.id, attempt);

    dispatch({ type: 'RECORD_ATTEMPT', payload: attempt });

    // Move to next exercise or end round
    const isLastExercise = state.currentExerciseIndex >= state.pendingExercises.length - 1;
    
    if (isLastExercise) {
      // End the round
      const completedRound: Round = {
        round_number: state.currentRound?.round_number || 1,
        total_time_sec: (state.currentRound?.total_time_sec || 0) + attempt.time_taken_sec,
        exercises: [...(state.currentRound?.exercises || []), attempt],
      };

      const action = async () => {
        try {
          await saveRound(state.session!.id, completedRound);
          dispatch({ type: 'END_ROUND', payload: completedRound });
        } catch (error) {
          const message = error instanceof StorageError
            ? error.message
            : 'Failed to save round. Please try again.';
          dispatch({ type: 'SET_ERROR', payload: message });
          pendingRetryAction.current = action;
        }
      };

      await action();
    } else {
      dispatch({ type: 'NEXT_EXERCISE' });
      
      // Save progress
      try {
        const remainingExercises = state.pendingExercises
          .slice(state.currentExerciseIndex + 1)
          .map((e) => e.exercise_id);
        await saveSessionState(
          remainingExercises,
          remainingExercises[0] || null,
          state.currentRound?.round_number || 1
        );
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }
  }, [getCurrentExercise, state, calculateResult, saveSessionState]);

  // Handle timeout
  const handleTimeout = useCallback(async (elapsedTime: number) => {
    const exercise = getCurrentExercise();
    if (!exercise || !state.session) return;

    const timeLimit = getTimeLimit();
    const result = calculateResult(exercise.exercise_id, false, timeLimit);

    const attempt: ExerciseAttempt = {
      exercise_id: exercise.exercise_id,
      factors: exercise.factors,
      user_answer: null,
      correct: false,
      time_taken_sec: timeLimit,
      result,
    };

    // Save to global history for cross-session comparison
    saveExerciseToHistory(state.session.id, attempt);

    dispatch({ type: 'RECORD_ATTEMPT', payload: attempt });

    const isLastExercise = state.currentExerciseIndex >= state.pendingExercises.length - 1;

    if (isLastExercise) {
      const completedRound: Round = {
        round_number: state.currentRound?.round_number || 1,
        total_time_sec: (state.currentRound?.total_time_sec || 0) + attempt.time_taken_sec,
        exercises: [...(state.currentRound?.exercises || []), attempt],
      };

      const action = async () => {
        try {
          await saveRound(state.session!.id, completedRound);
          dispatch({ type: 'END_ROUND', payload: completedRound });
        } catch (error) {
          const message = error instanceof StorageError
            ? error.message
            : 'Failed to save round. Please try again.';
          dispatch({ type: 'SET_ERROR', payload: message });
          pendingRetryAction.current = action;
        }
      };

      await action();
    } else {
      dispatch({ type: 'NEXT_EXERCISE' });
    }
  }, [getCurrentExercise, state, calculateResult]);

  // Continue to next round
  const continueToNextRound = useCallback(async () => {
    if (!state.session) return;

    const lastRound = state.completedRounds[state.completedRounds.length - 1];
    if (!lastRound) return;

    // Get failed exercises from last round
    const failedExerciseIds = lastRound.exercises
      .filter((ex) => !ex.correct)
      .map((ex) => ex.exercise_id);

    if (failedExerciseIds.length === 0) {
      // All exercises completed successfully - save and compare
      const action = async () => {
        try {
          const endTime = new Date().toISOString();
          
          // Save session summary for future comparisons
          saveSessionSummary(
            state.session!.id,
            state.completedRounds,
            state.session!.start_time,
            endTime
          );

          // Compare with previous sessions
          const comparison = compareWithPreviousSessions(
            state.session!.id,
            state.completedRounds,
            state.session!.start_time
          );

          await updateSession(state.session!.id, {
            status: 'completed',
            end_time: endTime,
          });
          
          dispatch({ type: 'COMPLETE_SESSION', payload: { comparison } });
        } catch (error) {
          const message = error instanceof StorageError
            ? error.message
            : 'Failed to complete session. Please try again.';
          dispatch({ type: 'SET_ERROR', payload: message });
          pendingRetryAction.current = action;
        }
      };

      await action();
      return;
    }

    // Prepare next round with failed exercises
    const failedExercises = filterExercisesByIds(state.allExercises, failedExerciseIds);
    const shuffled = shuffleExercises(failedExercises);
    const nextRoundNumber = state.completedRounds.length + 1;

    const action = async () => {
      try {
        await updateSession(state.session!.id, {
          current_round: nextRoundNumber,
          pending_exercises: shuffled.map((e) => e.exercise_id),
          active_exercise: shuffled[0]?.exercise_id || null,
        });
        dispatch({ type: 'START_NEXT_ROUND', payload: shuffled });
      } catch (error) {
        const message = error instanceof StorageError
          ? error.message
          : 'Failed to start next round. Please try again.';
        dispatch({ type: 'SET_ERROR', payload: message });
        pendingRetryAction.current = action;
      }
    };

    await action();
  }, [state]);

  // Stop session
  const stopSession = useCallback(async () => {
    if (!state.session) {
      dispatch({ type: 'STOP_SESSION' });
      return;
    }

    const action = async () => {
      try {
        await updateSession(state.session!.id, {
          status: 'stopped',
          end_time: new Date().toISOString(),
        });
        dispatch({ type: 'STOP_SESSION' });
        dispatch({ type: 'RESET' });
      } catch (error) {
        const message = error instanceof StorageError
          ? error.message
          : 'Failed to stop session. Please try again.';
        dispatch({ type: 'SET_ERROR', payload: message });
        pendingRetryAction.current = action;
      }
    };

    await action();
  }, [state.session]);

  // Restart session - start fresh from the beginning
  const restartSession = useCallback(async () => {
    dispatch({ type: 'RESET' });
    await startNewSession();
  }, [startNewSession]);

  // Retry after error
  const retryAfterError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
    if (pendingRetryAction.current) {
      pendingRetryAction.current();
    }
  }, []);

  const value: AppContextType = {
    state,
    startNewSession,
    resumeSession,
    submitAnswer,
    handleTimeout,
    continueToNextRound,
    stopSession,
    restartSession,
    retryAfterError,
    getCurrentExercise,
    getPreviousAttempt,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
