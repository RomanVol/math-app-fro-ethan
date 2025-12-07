'use client';

import { Session, Round, ExerciseAttempt } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
  SESSION: 'math-practice-session',
  ROUNDS: 'math-practice-rounds',
  EXERCISE_HISTORY: 'math-practice-exercise-history',
  ALL_SESSIONS: 'math-practice-all-sessions',
} as const;

/**
 * Local storage service for persisting session data
 * Replaces Supabase with browser localStorage
 */

export class StorageError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a new session
 */
export async function createSession(userId?: string): Promise<Session> {
  const session: Session = {
    id: uuidv4(),
    user_id: userId || null,
    start_time: new Date().toISOString(),
    end_time: null,
    status: 'in_progress',
    current_round: 1,
    pending_exercises: [],
    active_exercise: null,
  };

  if (isStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.ROUNDS, JSON.stringify([]));
    } catch (error) {
      throw new StorageError('Failed to save session to localStorage', error);
    }
  }

  return session;
}

/**
 * Updates session state
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<Session, 'status' | 'current_round' | 'pending_exercises' | 'active_exercise' | 'end_time'>>
): Promise<void> {
  if (!isStorageAvailable()) return;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!stored) return;

    const session: Session = JSON.parse(stored);
    if (session.id !== sessionId) return;

    const updated = {
      ...session,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updated));
  } catch (error) {
    throw new StorageError('Failed to update session in localStorage', error);
  }
}

/**
 * Gets an existing in-progress session
 */
export async function getActiveSession(): Promise<Session | null> {
  if (!isStorageAvailable()) return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!stored) return null;

    const session: Session = JSON.parse(stored);
    if (session.status !== 'in_progress') return null;

    return session;
  } catch {
    return null;
  }
}

/**
 * Saves a completed round
 */
export async function saveRound(sessionId: string, round: Round): Promise<string> {
  const roundId = uuidv4();

  if (!isStorageAvailable()) return roundId;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ROUNDS);
    const rounds: Round[] = stored ? JSON.parse(stored) : [];

    const savedRound: Round = {
      ...round,
      id: roundId,
      created_at: new Date().toISOString(),
    };

    rounds.push(savedRound);
    localStorage.setItem(STORAGE_KEYS.ROUNDS, JSON.stringify(rounds));

    return roundId;
  } catch (error) {
    throw new StorageError('Failed to save round to localStorage', error);
  }
}

/**
 * Gets all rounds for a session
 */
export async function getSessionRounds(sessionId: string): Promise<Round[]> {
  if (!isStorageAvailable()) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ROUNDS);
    if (!stored) return [];

    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Clears all stored data (for starting fresh)
 */
export function clearAllData(): void {
  if (!isStorageAvailable()) return;

  localStorage.removeItem(STORAGE_KEYS.SESSION);
  localStorage.removeItem(STORAGE_KEYS.ROUNDS);
}

/**
 * Gets the last attempt for a specific exercise (not used with localStorage approach)
 */
export async function getLastExerciseAttempt(
  sessionId: string,
  exerciseId: string
): Promise<ExerciseAttempt | null> {
  return null; // Handled in-memory by AppContext
}

// ============================================
// EXERCISE HISTORY - Track all attempts across sessions
// ============================================

/**
 * Exercise history entry - tracks all attempts across all sessions
 */
export interface ExerciseHistoryEntry {
  exercise_id: string;
  session_id: string;
  correct: boolean;
  time_taken_sec: number;
  attempted_at: string;
}

/**
 * Session summary for comparison
 */
export interface SessionSummary {
  session_id: string;
  start_time: string;
  end_time: string | null;
  total_exercises: number;
  correct_exercises: number;
  total_rounds: number;
  average_time_sec: number;
  success_rate: number;
}

/**
 * Save exercise attempt to global history
 */
export function saveExerciseToHistory(
  sessionId: string,
  attempt: ExerciseAttempt
): void {
  if (!isStorageAvailable()) return;

  try {
    const history = getExerciseHistory();
    const entry: ExerciseHistoryEntry = {
      exercise_id: attempt.exercise_id,
      session_id: sessionId,
      correct: attempt.correct,
      time_taken_sec: attempt.time_taken_sec,
      attempted_at: new Date().toISOString(),
    };

    if (!history[attempt.exercise_id]) {
      history[attempt.exercise_id] = [];
    }
    history[attempt.exercise_id].push(entry);

    localStorage.setItem(STORAGE_KEYS.EXERCISE_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save exercise history:', error);
  }
}

/**
 * Get all exercise history
 */
export function getExerciseHistory(): Record<string, ExerciseHistoryEntry[]> {
  if (!isStorageAvailable()) return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EXERCISE_HISTORY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Get history for a specific exercise
 */
export function getExerciseAttempts(exerciseId: string): ExerciseHistoryEntry[] {
  const history = getExerciseHistory();
  return history[exerciseId] || [];
}

/**
 * Get the last attempt for an exercise from previous sessions
 */
export function getLastHistoricalAttempt(
  exerciseId: string,
  excludeSessionId?: string
): ExerciseHistoryEntry | null {
  const attempts = getExerciseAttempts(exerciseId);
  const filtered = excludeSessionId
    ? attempts.filter((a) => a.session_id !== excludeSessionId)
    : attempts;

  if (filtered.length === 0) return null;
  return filtered[filtered.length - 1];
}

/**
 * Get all previous attempts for an exercise (excluding current session)
 */
export function getPreviousAttempts(
  exerciseId: string,
  excludeSessionId: string
): ExerciseHistoryEntry[] {
  const attempts = getExerciseAttempts(exerciseId);
  return attempts.filter((a) => a.session_id !== excludeSessionId);
}

/**
 * Get the best time for an exercise from history
 */
export function getBestTime(exerciseId: string): number | null {
  const attempts = getExerciseAttempts(exerciseId);
  const correctAttempts = attempts.filter((a) => a.correct);
  if (correctAttempts.length === 0) return null;
  return Math.min(...correctAttempts.map((a) => a.time_taken_sec));
}

// ============================================
// SESSION SUMMARIES - Track all sessions for comparison
// ============================================

/**
 * Save session summary when session ends
 */
export function saveSessionSummary(
  sessionId: string,
  rounds: Round[],
  startTime: string,
  endTime: string
): void {
  if (!isStorageAvailable()) return;

  try {
    const summaries = getAllSessionSummaries();
    
    let totalExercises = 0;
    let correctExercises = 0;
    let totalTime = 0;

    for (const round of rounds) {
      for (const exercise of round.exercises) {
        totalExercises++;
        if (exercise.correct) correctExercises++;
        totalTime += exercise.time_taken_sec;
      }
    }

    const summary: SessionSummary = {
      session_id: sessionId,
      start_time: startTime,
      end_time: endTime,
      total_exercises: totalExercises,
      correct_exercises: correctExercises,
      total_rounds: rounds.length,
      average_time_sec: totalExercises > 0 ? totalTime / totalExercises : 0,
      success_rate: totalExercises > 0 ? (correctExercises / totalExercises) * 100 : 0,
    };

    // Remove existing summary for this session if exists
    const filteredSummaries = summaries.filter((s) => s.session_id !== sessionId);
    filteredSummaries.push(summary);
    
    localStorage.setItem(STORAGE_KEYS.ALL_SESSIONS, JSON.stringify(filteredSummaries));
  } catch (error) {
    console.error('Failed to save session summary:', error);
  }
}

/**
 * Get all session summaries
 */
export function getAllSessionSummaries(): SessionSummary[] {
  if (!isStorageAvailable()) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ALL_SESSIONS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get the previous session summary (for comparison)
 */
export function getPreviousSessionSummary(excludeSessionId: string): SessionSummary | null {
  const summaries = getAllSessionSummaries();
  const filtered = summaries.filter((s) => s.session_id !== excludeSessionId);
  if (filtered.length === 0) return null;
  return filtered[filtered.length - 1];
}

// ============================================
// SESSION COMPARISON
// ============================================

export interface ExerciseImprovement {
  exercise_id: string;
  factors: [number, number];
  currentCorrect: boolean;
  currentTime: number;
  previousCorrect: boolean | null;
  previousTime: number | null;
  bestTime: number | null;
  status: 'new' | 'improved' | 'same' | 'deteriorated' | 'mastered' | 'new_record';
}

export interface SessionComparison {
  currentSession: SessionSummary;
  previousSession: SessionSummary | null;
  improvement: {
    successRate: number; // positive = improved
    averageTime: number; // negative = improved (faster)
    totalRounds: number; // negative = improved (fewer rounds needed)
  };
  exerciseImprovements: ExerciseImprovement[];
  stats: {
    improved: number;
    same: number;
    deteriorated: number;
    newRecords: number;
    mastered: number;
  };
}

/**
 * Compare current session results with previous sessions
 */
export function compareWithPreviousSessions(
  currentSessionId: string,
  currentRounds: Round[],
  startTime: string
): SessionComparison {
  const previousSession = getPreviousSessionSummary(currentSessionId);

  // Calculate current session stats
  let totalExercises = 0;
  let correctExercises = 0;
  let totalTime = 0;

  for (const round of currentRounds) {
    for (const exercise of round.exercises) {
      totalExercises++;
      if (exercise.correct) correctExercises++;
      totalTime += exercise.time_taken_sec;
    }
  }

  const currentSummary: SessionSummary = {
    session_id: currentSessionId,
    start_time: startTime,
    end_time: new Date().toISOString(),
    total_exercises: totalExercises,
    correct_exercises: correctExercises,
    total_rounds: currentRounds.length,
    average_time_sec: totalExercises > 0 ? totalTime / totalExercises : 0,
    success_rate: totalExercises > 0 ? (correctExercises / totalExercises) * 100 : 0,
  };

  // Calculate exercise improvements
  const exerciseImprovements: ExerciseImprovement[] = [];
  const stats = {
    improved: 0,
    same: 0,
    deteriorated: 0,
    newRecords: 0,
    mastered: 0,
  };

  // Get the final attempt for each exercise in this session
  const finalAttempts: Record<string, ExerciseAttempt> = {};
  for (const round of currentRounds) {
    for (const attempt of round.exercises) {
      finalAttempts[attempt.exercise_id] = attempt; // Last attempt wins
    }
  }

  for (const [exerciseId, attempt] of Object.entries(finalAttempts)) {
    const previousAttempts = getPreviousAttempts(exerciseId, currentSessionId);
    const lastPrevious = previousAttempts.length > 0 ? previousAttempts[previousAttempts.length - 1] : null;
    const bestTime = getBestTimeFromAttempts(previousAttempts);

    let status: ExerciseImprovement['status'];

    if (!lastPrevious) {
      // First time ever doing this exercise
      status = attempt.correct ? 'mastered' : 'new';
      if (attempt.correct) stats.mastered++;
    } else if (attempt.correct && !lastPrevious.correct) {
      // Was wrong, now correct
      status = 'improved';
      stats.improved++;
    } else if (!attempt.correct && lastPrevious.correct) {
      // Was correct, now wrong
      status = 'deteriorated';
      stats.deteriorated++;
    } else if (attempt.correct && lastPrevious.correct) {
      // Both correct - compare times
      if (bestTime !== null && attempt.time_taken_sec < bestTime - 0.1) {
        status = 'new_record';
        stats.newRecords++;
      } else if (attempt.time_taken_sec < lastPrevious.time_taken_sec - 0.5) {
        status = 'improved';
        stats.improved++;
      } else if (attempt.time_taken_sec > lastPrevious.time_taken_sec + 0.5) {
        status = 'deteriorated';
        stats.deteriorated++;
      } else {
        status = 'same';
        stats.same++;
      }
    } else {
      // Both wrong
      status = 'same';
      stats.same++;
    }

    exerciseImprovements.push({
      exercise_id: exerciseId,
      factors: attempt.factors,
      currentCorrect: attempt.correct,
      currentTime: attempt.time_taken_sec,
      previousCorrect: lastPrevious?.correct ?? null,
      previousTime: lastPrevious?.time_taken_sec ?? null,
      bestTime,
      status,
    });
  }

  // Sort by status priority: new_record, improved, mastered, same, deteriorated, new
  const statusOrder: Record<ExerciseImprovement['status'], number> = {
    'new_record': 0,
    'improved': 1,
    'mastered': 2,
    'same': 3,
    'deteriorated': 4,
    'new': 5,
  };
  exerciseImprovements.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  return {
    currentSession: currentSummary,
    previousSession,
    improvement: {
      successRate: previousSession
        ? currentSummary.success_rate - previousSession.success_rate
        : 0,
      averageTime: previousSession
        ? currentSummary.average_time_sec - previousSession.average_time_sec
        : 0,
      totalRounds: previousSession
        ? currentSummary.total_rounds - previousSession.total_rounds
        : 0,
    },
    exerciseImprovements,
    stats,
  };
}

function getBestTimeFromAttempts(attempts: ExerciseHistoryEntry[]): number | null {
  const correctAttempts = attempts.filter((a) => a.correct);
  if (correctAttempts.length === 0) return null;
  return Math.min(...correctAttempts.map((a) => a.time_taken_sec));
}
