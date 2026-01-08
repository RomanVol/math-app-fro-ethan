'use client';

import React from 'react';
import { useCompetition } from '@/hooks/useCompetition';
import { CompetitionLobby } from './CompetitionLobby';
import { CompetitionCountdown } from './CompetitionCountdown';
import { CompetitionGame } from './CompetitionGame';
import { CompetitionResults } from './CompetitionResults';

export function CompetitionPage() {
  const {
    room,
    playerId,
    roomId,
    isHost,
    currentExercise,
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
  } = useCompetition();

  // Waiting for players / Lobby
  if (!room || room.status === 'waiting') {
    return (
      <CompetitionLobby
        room={room}
        roomId={roomId}
        playerId={playerId}
        isHost={isHost}
        error={error}
        isLoading={isLoading}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onSetReady={handleSetReady}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  // Countdown before game starts
  if (room.status === 'countdown') {
    return <CompetitionCountdown countdown={countdown} />;
  }

  // Game in progress
  if (room.status === 'playing' && currentExercise && playerId) {
    const currentPlayer = room.players[playerId];
    const exerciseIndex = currentPlayer?.currentExerciseIndex || 0;
    
    // Check if current player has finished
    if (currentPlayer?.finishedAt) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center" dir="rtl">
          <div className="text-center bg-white rounded-3xl shadow-xl p-8 max-w-md mx-4">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">סיימת!</h2>
            <p className="text-gray-600 mb-4">ממתין לשאר השחקנים...</p>
            
            {/* Show other players' progress */}
            <div className="space-y-2">
              {Object.values(room.players)
                .filter(p => p.id !== playerId)
                .map(player => (
                  <div key={player.id} className="flex items-center justify-between bg-gray-100 rounded-xl p-3">
                    <span className="font-medium">{player.name}</span>
                    <span className={player.finishedAt ? 'text-green-600' : 'text-gray-500'}>
                      {player.finishedAt ? '✓ סיים' : `${player.currentExerciseIndex}/${room.exercises.length}`}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <CompetitionGame
        room={room}
        playerId={playerId}
        currentExercise={currentExercise}
        exerciseIndex={exerciseIndex}
        totalExercises={room.exercises.length}
        onSubmitAnswer={handleSubmitAnswer}
      />
    );
  }

  // Game finished - show results
  if (room.status === 'finished' && playerId) {
    return (
      <CompetitionResults
        room={room}
        results={results}
        playerId={playerId}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center">
      <div className="text-white text-2xl">טוען...</div>
    </div>
  );
}
