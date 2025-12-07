'use client';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Session,
  Round,
  ExerciseAttempt,
  DbSession,
  DbRound,
  DbExerciseResult,
} from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export class SupabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'SupabaseError';
  }
}

/**
 * Creates a new session in the database
 */
export async function createSession(userId?: string): Promise<Session> {
  if (!isSupabaseConfigured()) {
    // Return a mock session for local development
    const mockSession: Session = {
      id: uuidv4(),
      user_id: userId || null,
      start_time: new Date().toISOString(),
      end_time: null,
      status: 'in_progress',
      current_round: 1,
      pending_exercises: [],
      active_exercise: null,
    };
    return mockSession;
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId || null,
      status: 'in_progress',
      current_round: 1,
      pending_exercises: [],
      active_exercise: null,
    })
    .select()
    .single();

  if (error) {
    throw new SupabaseError('Failed to create session', error);
  }

  return mapDbSessionToSession(data);
}

/**
 * Updates session state in the database
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<Session, 'status' | 'current_round' | 'pending_exercises' | 'active_exercise' | 'end_time'>>
): Promise<void> {
  if (!isSupabaseConfigured()) {
    return; // Skip for local development
  }

  const { error } = await supabase
    .from('sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    throw new SupabaseError('Failed to update session', error);
  }
}

/**
 * Gets an existing in-progress session for a user
 */
export async function getActiveSession(userId?: string): Promise<Session | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  let query = supabase
    .from('sessions')
    .select('*')
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No rows returned
    }
    throw new SupabaseError('Failed to get active session', error);
  }

  return data ? mapDbSessionToSession(data) : null;
}

/**
 * Saves a completed round to the database
 */
export async function saveRound(
  sessionId: string,
  round: Round
): Promise<string> {
  if (!isSupabaseConfigured()) {
    return uuidv4(); // Return mock ID for local development
  }

  // Insert the round
  const { data: roundData, error: roundError } = await supabase
    .from('rounds')
    .insert({
      session_id: sessionId,
      round_number: round.round_number,
      total_time_sec: round.total_time_sec,
    })
    .select()
    .single();

  if (roundError) {
    throw new SupabaseError('Failed to save round', roundError);
  }

  const roundId = roundData.id;

  // Insert exercise results
  const exerciseResults = round.exercises.map((ex) => ({
    round_id: roundId,
    session_id: sessionId,
    exercise_id: ex.exercise_id,
    factors: ex.factors,
    user_answer: ex.user_answer,
    correct: ex.correct,
    time_taken_sec: ex.time_taken_sec,
    result: ex.result,
  }));

  const { error: exerciseError } = await supabase
    .from('exercise_results')
    .insert(exerciseResults);

  if (exerciseError) {
    throw new SupabaseError('Failed to save exercise results', exerciseError);
  }

  return roundId;
}

/**
 * Gets all rounds for a session
 */
export async function getSessionRounds(sessionId: string): Promise<Round[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data: roundsData, error: roundsError } = await supabase
    .from('rounds')
    .select('*')
    .eq('session_id', sessionId)
    .order('round_number', { ascending: true });

  if (roundsError) {
    throw new SupabaseError('Failed to get session rounds', roundsError);
  }

  const rounds: Round[] = [];

  for (const roundData of roundsData) {
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('exercise_results')
      .select('*')
      .eq('round_id', roundData.id);

    if (exercisesError) {
      throw new SupabaseError('Failed to get exercise results', exercisesError);
    }

    rounds.push({
      id: roundData.id,
      round_number: roundData.round_number,
      total_time_sec: roundData.total_time_sec,
      exercises: exercisesData.map(mapDbExerciseResultToAttempt),
      created_at: roundData.created_at,
    });
  }

  return rounds;
}

/**
 * Gets the last attempt for a specific exercise across all rounds
 */
export async function getLastExerciseAttempt(
  sessionId: string,
  exerciseId: string
): Promise<ExerciseAttempt | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('exercise_results')
    .select('*')
    .eq('session_id', sessionId)
    .eq('exercise_id', exerciseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new SupabaseError('Failed to get last exercise attempt', error);
  }

  return data ? mapDbExerciseResultToAttempt(data) : null;
}

// Helper functions
function mapDbSessionToSession(db: DbSession): Session {
  return {
    id: db.id,
    user_id: db.user_id,
    start_time: db.start_time,
    end_time: db.end_time,
    status: db.status,
    current_round: db.current_round,
    pending_exercises: db.pending_exercises || [],
    active_exercise: db.active_exercise,
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

function mapDbExerciseResultToAttempt(db: DbExerciseResult): ExerciseAttempt {
  return {
    exercise_id: db.exercise_id,
    factors: db.factors,
    user_answer: db.user_answer,
    correct: db.correct,
    time_taken_sec: db.time_taken_sec,
    result: db.result,
  };
}
