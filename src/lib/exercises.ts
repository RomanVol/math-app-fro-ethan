import { Exercise } from './types';

/**
 * Generates all 49 unique multiplication exercises (3x3 to 9x9)
 * Excludes problems involving 1, 2, or 10 as factors
 */
export function generateAllExercises(): Exercise[] {
  const exercises: Exercise[] = [];
  
  for (let a = 3; a <= 9; a++) {
    for (let b = 3; b <= 9; b++) {
      exercises.push({
        exercise_id: `${a}x${b}`,
        factors: [a, b],
      });
    }
  }
  
  return exercises;
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export function shuffleExercises<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Gets the correct answer for an exercise
 */
export function getCorrectAnswer(exercise: Exercise): number {
  return exercise.factors[0] * exercise.factors[1];
}

/**
 * Validates if user answer is correct
 */
export function isAnswerCorrect(exercise: Exercise, userAnswer: number): boolean {
  return getCorrectAnswer(exercise) === userAnswer;
}

/**
 * Filters exercises by their IDs
 */
export function filterExercisesByIds(
  allExercises: Exercise[],
  exerciseIds: string[]
): Exercise[] {
  return allExercises.filter((ex) => exerciseIds.includes(ex.exercise_id));
}

/**
 * The default time limit in seconds for each exercise
 */
export const DEFAULT_TIME_LIMIT_SECONDS = 10;

/**
 * Get time limit from localStorage or use default
 */
export function getTimeLimit(): number {
  if (typeof window === 'undefined') return DEFAULT_TIME_LIMIT_SECONDS;
  const stored = localStorage.getItem('math-practice-time-limit');
  return stored ? parseInt(stored, 10) : DEFAULT_TIME_LIMIT_SECONDS;
}

/**
 * Save time limit to localStorage
 */
export function setTimeLimit(seconds: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('math-practice-time-limit', seconds.toString());
}
