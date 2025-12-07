// Core Types for Multiplication Tables Practice App

export type SessionStatus = 'in_progress' | 'completed' | 'stopped';
export type ExerciseResult = 'improved' | 'deteriorated' | 'same' | 'first';

export interface Exercise {
  exercise_id: string;
  factors: [number, number];
}

export interface ExerciseAttempt {
  exercise_id: string;
  factors: [number, number];
  user_answer: number | null;
  correct: boolean;
  time_taken_sec: number;
  result: ExerciseResult;
}

export interface Round {
  id?: string;
  round_number: number;
  total_time_sec: number;
  exercises: ExerciseAttempt[];
  created_at?: string;
}

export interface Session {
  id: string;
  user_id: string | null;
  start_time: string;
  end_time: string | null;
  status: SessionStatus;
  current_round: number;
  pending_exercises: string[];
  active_exercise: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UIState {
  current_round: number;
  failed_exercises: string[];
  active_exercise: string | null;
  user_id: string | null;
  session_id: string | null;
}

export interface AppState {
  session: Session | null;
  currentRound: Round | null;
  completedRounds: Round[];
  allExercises: Exercise[];
  pendingExercises: Exercise[];
  currentExerciseIndex: number;
  isLoading: boolean;
  error: string | null;
  phase: 'idle' | 'exercise' | 'summary' | 'complete';
}

// Supabase table types
export interface DbSession {
  id: string;
  user_id: string | null;
  start_time: string;
  end_time: string | null;
  status: SessionStatus;
  current_round: number;
  pending_exercises: string[];
  active_exercise: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbRound {
  id: string;
  session_id: string;
  round_number: number;
  total_time_sec: number;
  created_at: string;
}

export interface DbExerciseResult {
  id: string;
  round_id: string;
  session_id: string;
  exercise_id: string;
  factors: [number, number];
  user_answer: number | null;
  correct: boolean;
  time_taken_sec: number;
  result: ExerciseResult;
  created_at: string;
}
