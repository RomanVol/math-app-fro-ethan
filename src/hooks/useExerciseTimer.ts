'use client';

import { useRef, useCallback } from 'react';
import { DEFAULT_TIME_LIMIT_SECONDS } from '@/lib/exercises';

interface UseExerciseTimerReturn {
  startTimer: () => void;
  stopTimer: () => number;
  getElapsedTime: () => number;
  isTimedOut: () => boolean;
  resetTimer: () => void;
}

/**
 * Custom hook for managing exercise timing
 * Timer is internal and not exposed to UI
 */
export function useExerciseTimer(): UseExerciseTimerReturn {
  const startTimeRef = useRef<number | null>(null);
  const elapsedTimeRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    elapsedTimeRef.current = 0;
  }, []);

  const getElapsedTime = useCallback(() => {
    if (startTimeRef.current === null) {
      return 0;
    }
    return (Date.now() - startTimeRef.current) / 1000;
  }, []);

  const stopTimer = useCallback(() => {
    if (startTimeRef.current === null) {
      return 0;
    }
    
    const elapsed = getElapsedTime();
    elapsedTimeRef.current = Math.min(elapsed, DEFAULT_TIME_LIMIT_SECONDS);
    startTimeRef.current = null;
    
    return elapsedTimeRef.current;
  }, [getElapsedTime]);

  const isTimedOut = useCallback(() => {
    return getElapsedTime() >= DEFAULT_TIME_LIMIT_SECONDS;
  }, [getElapsedTime]);

  const resetTimer = useCallback(() => {
    startTimeRef.current = null;
    elapsedTimeRef.current = 0;
  }, []);

  return {
    startTimer,
    stopTimer,
    getElapsedTime,
    isTimedOut,
    resetTimer,
  };
}
