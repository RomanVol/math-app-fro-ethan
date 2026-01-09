// Types for competition mode

export interface ExerciseAttempt {
  playerId: string;
  answer: number | null;
  isCorrect: boolean;
  timeMs: number; // time in milliseconds
  submittedAt: number; // timestamp
}

export interface CompetitionPlayer {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  currentExerciseIndex: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalTime: number; // in milliseconds
  finishedAt?: number; // timestamp when finished
  attempts?: Record<string, ExerciseAttempt>; // exerciseId -> attempt
}

export interface CompetitionExercise {
  id: string;
  num1: number;
  num2: number;
  correctAnswer: number;
}

export interface CompetitionRoom {
  id: string;
  hostId: string;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  players: Record<string, CompetitionPlayer>;
  exercises: CompetitionExercise[];
  settings: {
    exerciseCount: number;
    selectedTables: number[];
  };
  createdAt: number;
  startedAt?: number;
  countdownStartedAt?: number;
}

export interface PlayerResult {
  playerId: string;
  playerName: string;
  correctAnswers: number;
  wrongAnswers: number;
  totalTime: number;
  accuracy: number;
  rank: number;
}

export interface ExerciseComparison {
  exerciseId: string;
  num1: number;
  num2: number;
  correctAnswer: number;
  results: {
    playerId: string;
    playerName: string;
    answer: number | null;
    isCorrect: boolean;
    timeMs: number;
    isWinner: boolean; // fastest correct answer
  }[];
}

export type CompetitionStatus = CompetitionRoom['status'];
