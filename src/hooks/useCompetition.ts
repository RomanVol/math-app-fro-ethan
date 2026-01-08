import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CompetitionRoom,
  CompetitionExercise,
  PlayerResult,
} from '@/lib/competitionTypes';
import {
  createRoom,
  joinRoom,
  setPlayerReady,
  startCountdown,
  startGame,
  submitAnswer,
  finishGame,
  leaveRoom,
  subscribeToRoom,
  getResults,
} from '@/lib/competitionService';

interface UseCompetitionReturn {
  // State
  room: CompetitionRoom | null;
  playerId: string | null;
  roomId: string | null;
  isHost: boolean;
  currentExercise: CompetitionExercise | null;
  exerciseStartTime: number | null;
  countdown: number;
  results: PlayerResult[];
  error: string | null;
  isLoading: boolean;
  
  // Actions
  handleCreateRoom: (playerName: string, settings: {
    exerciseCount: number;
    selectedTables: number[];
  }) => Promise<void>;
  handleJoinRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  handleSetReady: (isReady: boolean) => Promise<void>;
  handleStartGame: () => Promise<void>;
  handleSubmitAnswer: (answer: number) => Promise<boolean>;
  handleLeaveRoom: () => Promise<void>;
}

export function useCompetition(): UseCompetitionReturn {
  const [room, setRoom] = useState<CompetitionRoom | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [exerciseStartTime, setExerciseStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);
  
  // Handle countdown
  useEffect(() => {
    if (room?.status === 'countdown' && room.countdownStartedAt) {
      const updateCountdown = () => {
        const elapsed = Date.now() - room.countdownStartedAt!;
        const remaining = Math.max(0, 3 - Math.floor(elapsed / 1000));
        setCountdown(remaining);
        
        if (remaining === 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          // Host starts the game when countdown reaches 0
          if (room.hostId === playerId) {
            startGame(room.id);
          }
        }
      };
      
      updateCountdown();
      countdownIntervalRef.current = setInterval(updateCountdown, 100);
      
      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      };
    }
  }, [room?.status, room?.countdownStartedAt, room?.hostId, room?.id, playerId]);
  
  // Track exercise start time
  useEffect(() => {
    if (room?.status === 'playing') {
      setExerciseStartTime(Date.now());
    }
  }, [room?.status, room?.players?.[playerId || '']?.currentExerciseIndex]);
  
  const isHost = room?.hostId === playerId;
  
  const currentPlayer = playerId && room?.players?.[playerId];
  const currentExerciseIndex = currentPlayer ? currentPlayer.currentExerciseIndex : 0;
  const currentExercise = room?.exercises?.[currentExerciseIndex] || null;
  
  const results = room ? getResults(room) : [];
  
  // Subscribe to room updates
  const subscribeRoom = useCallback((id: string) => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    unsubscribeRef.current = subscribeToRoom(id, (updatedRoom) => {
      setRoom(updatedRoom);
      
      if (!updatedRoom) {
        setError('החדר נסגר');
        setRoomId(null);
        setPlayerId(null);
      }
    });
  }, []);
  
  const handleCreateRoom = useCallback(async (
    playerName: string,
    settings: { exerciseCount: number; selectedTables: number[] }
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createRoom(playerName, settings);
      setRoomId(result.roomId);
      setPlayerId(result.playerId);
      subscribeRoom(result.roomId);
    } catch (err) {
      setError('שגיאה ביצירת החדר');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [subscribeRoom]);
  
  const handleJoinRoom = useCallback(async (
    roomCode: string,
    playerName: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await joinRoom(roomCode.toUpperCase(), playerName);
      
      if (!result.success) {
        setError(result.error || 'שגיאה בהצטרפות לחדר');
        return false;
      }
      
      setRoomId(roomCode.toUpperCase());
      setPlayerId(result.playerId!);
      subscribeRoom(roomCode.toUpperCase());
      return true;
    } catch (err) {
      setError('שגיאה בהצטרפות לחדר');
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscribeRoom]);
  
  const handleSetReady = useCallback(async (isReady: boolean) => {
    if (!roomId || !playerId) return;
    
    try {
      await setPlayerReady(roomId, playerId, isReady);
    } catch (err) {
      console.error(err);
    }
  }, [roomId, playerId]);
  
  const handleStartGame = useCallback(async () => {
    if (!roomId || !isHost) return;
    
    try {
      await startCountdown(roomId);
    } catch (err) {
      setError('שגיאה בהתחלת המשחק');
      console.error(err);
    }
  }, [roomId, isHost]);
  
  const handleSubmitAnswer = useCallback(async (answer: number): Promise<boolean> => {
    if (!roomId || !playerId || !currentExercise || !exerciseStartTime) {
      return false;
    }
    
    const isCorrect = answer === currentExercise.correctAnswer;
    const timeSpent = Date.now() - exerciseStartTime;
    
    try {
      await submitAnswer(roomId, playerId, currentExerciseIndex, isCorrect, timeSpent);
      
      // Reset exercise start time for next exercise
      setExerciseStartTime(Date.now());
      
      // Check if this was the last exercise
      if (currentExerciseIndex + 1 >= (room?.exercises?.length || 0)) {
        await finishGame(roomId, playerId);
      }
      
      return isCorrect;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [roomId, playerId, currentExercise, exerciseStartTime, currentExerciseIndex, room?.exercises?.length]);
  
  const handleLeaveRoom = useCallback(async () => {
    if (!roomId || !playerId) return;
    
    try {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      await leaveRoom(roomId, playerId);
      
      setRoom(null);
      setRoomId(null);
      setPlayerId(null);
      setError(null);
    } catch (err) {
      console.error(err);
    }
  }, [roomId, playerId]);
  
  return {
    room,
    playerId,
    roomId,
    isHost,
    currentExercise,
    exerciseStartTime,
    countdown,
    results,
    error,
    isLoading,
    handleCreateRoom,
    handleJoinRoom,
    handleSetReady,
    handleStartGame,
    handleSubmitAnswer,
    handleLeaveRoom,
  };
}
