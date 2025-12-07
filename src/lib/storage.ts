'use client';

import { Session, Round, ExerciseAttempt } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
  SESSION: 'math-practice-session',
  ROUNDS: 'math-practice-rounds',
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
