import { getFirebaseDatabase } from './firebase';
import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  push,
  off,
} from 'firebase/database';
import {
  CompetitionRoom,
  CompetitionPlayer,
  CompetitionExercise,
  PlayerResult,
} from './competitionTypes';

// Generate a random 6-character room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate exercises for competition
export function generateCompetitionExercises(
  count: number,
  selectedTables: number[]
): CompetitionExercise[] {
  const exercises: CompetitionExercise[] = [];
  const tables = selectedTables.length > 0 ? selectedTables : [3, 4, 5, 6, 7, 8, 9];
  
  // Generate all possible combinations
  const allCombinations: { num1: number; num2: number }[] = [];
  for (const num1 of tables) {
    for (const num2 of tables) {
      allCombinations.push({ num1, num2 });
    }
  }
  
  // Shuffle and take the requested count
  for (let i = allCombinations.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCombinations[i], allCombinations[j]] = [allCombinations[j], allCombinations[i]];
  }
  
  const selectedCombinations = allCombinations.slice(0, Math.min(count, allCombinations.length));
  
  for (let i = 0; i < selectedCombinations.length; i++) {
    const { num1, num2 } = selectedCombinations[i];
    exercises.push({
      id: `exercise-${i}`,
      num1,
      num2,
      correctAnswer: num1 * num2,
    });
  }
  
  return exercises;
}

// Create a new competition room
export async function createRoom(
  hostName: string,
  settings: { exerciseCount: number; selectedTables: number[] }
): Promise<{ roomId: string; playerId: string }> {
  const database = getFirebaseDatabase();
  const roomId = generateRoomCode();
  const playerId = push(ref(database, 'temp')).key!;
  
  const exercises = generateCompetitionExercises(
    settings.exerciseCount,
    settings.selectedTables
  );
  
  const hostPlayer: CompetitionPlayer = {
    id: playerId,
    name: hostName,
    isReady: false,
    isHost: true,
    currentExerciseIndex: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    totalTime: 0,
  };
  
  const room: CompetitionRoom = {
    id: roomId,
    hostId: playerId,
    status: 'waiting',
    players: {
      [playerId]: hostPlayer,
    },
    exercises,
    settings,
    createdAt: Date.now(),
  };
  
  await set(ref(database, `rooms/${roomId}`), room);
  
  return { roomId, playerId };
}

// Join an existing room
export async function joinRoom(
  roomId: string,
  playerName: string
): Promise<{ success: boolean; playerId?: string; error?: string }> {
  const database = getFirebaseDatabase();
  const roomRef = ref(database, `rooms/${roomId}`);
  const snapshot = await get(roomRef);
  
  if (!snapshot.exists()) {
    return { success: false, error: 'החדר לא נמצא' };
  }
  
  const room = snapshot.val() as CompetitionRoom;
  
  if (room.status !== 'waiting') {
    return { success: false, error: 'המשחק כבר התחיל' };
  }
  
  const playerCount = Object.keys(room.players).length;
  if (playerCount >= 10) {
    return { success: false, error: 'החדר מלא (מקסימום 10 שחקנים)' };
  }
  
  const playerId = push(ref(database, 'temp')).key!;
  
  const newPlayer: CompetitionPlayer = {
    id: playerId,
    name: playerName,
    isReady: false,
    isHost: false,
    currentExerciseIndex: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    totalTime: 0,
  };
  
  await set(ref(database, `rooms/${roomId}/players/${playerId}`), newPlayer);
  
  return { success: true, playerId };
}

// Set player ready status
export async function setPlayerReady(
  roomId: string,
  playerId: string,
  isReady: boolean
): Promise<void> {
  const database = getFirebaseDatabase();
  await update(ref(database, `rooms/${roomId}/players/${playerId}`), {
    isReady,
  });
}

// Start countdown (host only)
export async function startCountdown(roomId: string): Promise<void> {
  const database = getFirebaseDatabase();
  await update(ref(database, `rooms/${roomId}`), {
    status: 'countdown',
    countdownStartedAt: Date.now(),
  });
}

// Start the game (after countdown)
export async function startGame(roomId: string): Promise<void> {
  const database = getFirebaseDatabase();
  await update(ref(database, `rooms/${roomId}`), {
    status: 'playing',
    startedAt: Date.now(),
  });
}

// Submit answer
export async function submitAnswer(
  roomId: string,
  playerId: string,
  exerciseIndex: number,
  isCorrect: boolean,
  timeSpent: number
): Promise<void> {
  const database = getFirebaseDatabase();
  const playerRef = ref(database, `rooms/${roomId}/players/${playerId}`);
  const snapshot = await get(playerRef);
  
  if (!snapshot.exists()) return;
  
  const player = snapshot.val() as CompetitionPlayer;
  
  const updates: Partial<CompetitionPlayer> = {
    currentExerciseIndex: exerciseIndex + 1,
    totalTime: player.totalTime + timeSpent,
  };
  
  if (isCorrect) {
    updates.correctAnswers = player.correctAnswers + 1;
  } else {
    updates.wrongAnswers = player.wrongAnswers + 1;
  }
  
  await update(playerRef, updates);
}

// Mark player as finished
export async function finishGame(
  roomId: string,
  playerId: string
): Promise<void> {
  const database = getFirebaseDatabase();
  await update(ref(database, `rooms/${roomId}/players/${playerId}`), {
    finishedAt: Date.now(),
  });
  
  // Check if all players finished
  const roomRef = ref(database, `rooms/${roomId}`);
  const snapshot = await get(roomRef);
  
  if (!snapshot.exists()) return;
  
  const room = snapshot.val() as CompetitionRoom;
  const allFinished = Object.values(room.players).every(p => p.finishedAt);
  
  if (allFinished) {
    await update(roomRef, { status: 'finished' });
  }
}

// Get final results sorted by performance
export function getResults(room: CompetitionRoom): PlayerResult[] {
  const players = Object.values(room.players);
  
  const results: PlayerResult[] = players.map(player => ({
    playerId: player.id,
    playerName: player.name,
    correctAnswers: player.correctAnswers,
    wrongAnswers: player.wrongAnswers,
    totalTime: player.totalTime,
    accuracy: player.correctAnswers / (player.correctAnswers + player.wrongAnswers) * 100 || 0,
    rank: 0,
  }));
  
  // Sort by correct answers (desc), then by time (asc)
  results.sort((a, b) => {
    if (b.correctAnswers !== a.correctAnswers) {
      return b.correctAnswers - a.correctAnswers;
    }
    return a.totalTime - b.totalTime;
  });
  
  // Assign ranks
  results.forEach((result, index) => {
    result.rank = index + 1;
  });
  
  return results;
}

// Leave room
export async function leaveRoom(
  roomId: string,
  playerId: string
): Promise<void> {
  const database = getFirebaseDatabase();
  const roomRef = ref(database, `rooms/${roomId}`);
  const snapshot = await get(roomRef);
  
  if (!snapshot.exists()) return;
  
  const room = snapshot.val() as CompetitionRoom;
  
  // If host leaves, delete the room
  if (room.hostId === playerId) {
    await remove(roomRef);
  } else {
    // Otherwise just remove the player
    await remove(ref(database, `rooms/${roomId}/players/${playerId}`));
  }
}

// Subscribe to room updates
export function subscribeToRoom(
  roomId: string,
  callback: (room: CompetitionRoom | null) => void
): () => void {
  const database = getFirebaseDatabase();
  const roomRef = ref(database, `rooms/${roomId}`);
  
  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as CompetitionRoom);
    } else {
      callback(null);
    }
  });
  
  return () => off(roomRef);
}
