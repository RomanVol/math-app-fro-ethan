'use client';

import React, { useState, useEffect } from 'react';
import { CompetitionRoom } from '@/lib/competitionTypes';
import { TableSelector } from '@/components/TableSelector';
import { getSelectedTables, setSelectedTables } from '@/lib/exercises';

interface CompetitionLobbyProps {
  room: CompetitionRoom | null;
  roomId: string | null;
  playerId: string | null;
  isHost: boolean;
  error: string | null;
  isLoading: boolean;
  onCreateRoom: (playerName: string, settings: {
    exerciseCount: number;
    selectedTables: number[];
  }) => Promise<void>;
  onJoinRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  onSetReady: (isReady: boolean) => Promise<void>;
  onStartGame: () => Promise<void>;
  onLeaveRoom: () => Promise<void>;
}

export function CompetitionLobby({
  room,
  roomId,
  playerId,
  isHost,
  error,
  isLoading,
  onCreateRoom,
  onJoinRoom,
  onSetReady,
  onStartGame,
  onLeaveRoom,
}: CompetitionLobbyProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [exerciseCount, setExerciseCount] = useState(10);
  const [selectedTables, setSelectedTablesState] = useState<number[]>([3, 4, 5, 6, 7, 8, 9]);

  useEffect(() => {
    setSelectedTablesState(getSelectedTables());
  }, []);

  const handleTablesChange = (tables: number[]) => {
    setSelectedTablesState(tables);
    setSelectedTables(tables);
  };

  // If already in a room, show the waiting room
  if (room && roomId) {
    const players = Object.values(room.players);
    const currentPlayer = playerId ? room.players[playerId] : null;
    const allReady = players.every(p => p.isReady || p.isHost);
    const canStart = isHost && players.length >= 1 && (players.length === 1 || allReady);

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-4" dir="rtl">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-6">
            {/* Room Code */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-700 mb-2">קוד החדר</h2>
              <div className="bg-gray-100 rounded-xl p-4">
                <span className="text-4xl font-mono font-bold text-blue-600 tracking-wider">
                  {roomId}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">שתפו את הקוד עם חברים</p>
            </div>

            {/* Players List */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-700 mb-3">
                שחקנים ({players.length}/10)
              </h3>
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      player.id === playerId
                        ? 'bg-blue-100 border-2 border-blue-400'
                        : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {player.isHost ? '👑' : '🎮'}
                      </span>
                      <span className="font-medium">
                        {player.name}
                        {player.id === playerId && ' (את/ה)'}
                      </span>
                    </div>
                    {!player.isHost && (
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          player.isReady
                            ? 'bg-green-200 text-green-700'
                            : 'bg-yellow-200 text-yellow-700'
                        }`}
                      >
                        {player.isReady ? 'מוכן! ✓' : 'ממתין...'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Game Settings */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-bold text-gray-700 mb-2">הגדרות המשחק</h3>
              <div className="text-gray-600">
                <p>📝 {room.settings.exerciseCount} תרגילים</p>
                <p>🔢 לוחות: {room.settings.selectedTables?.join(', ') || '3-9'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {isHost ? (
                <button
                  onClick={onStartGame}
                  disabled={!canStart}
                  className={`w-full py-4 rounded-xl font-bold text-xl transition-all ${
                    canStart
                      ? 'bg-green-500 text-white hover:bg-green-600 transform hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {players.length === 1
                    ? '🚀 התחל משחק יחיד'
                    : canStart
                    ? '🚀 התחל משחק!'
                    : '⏳ ממתין לשחקנים...'}
                </button>
              ) : (
                <button
                  onClick={() => onSetReady(!currentPlayer?.isReady)}
                  className={`w-full py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 ${
                    currentPlayer?.isReady
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {currentPlayer?.isReady ? '❌ ביטול מוכנות' : '✓ אני מוכן!'}
                </button>
              )}
              
              <button
                onClick={onLeaveRoom}
                className="w-full py-3 rounded-xl font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                🚪 עזוב חדר
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode selection / Join / Create screens
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-4 flex items-center justify-center" dir="rtl">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🏆 מצב תחרות</h1>
            <p className="text-gray-600">התחרו עם חברים בזמן אמת!</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {mode === 'select' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('create')}
                className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold text-xl hover:bg-blue-600 transition-all transform hover:scale-105"
              >
                ✨ צור חדר חדש
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full py-4 bg-green-500 text-white rounded-xl font-bold text-xl hover:bg-green-600 transition-all transform hover:scale-105"
              >
                🚪 הצטרף לחדר
              </button>
              <a
                href="/"
                className="block w-full py-3 text-center bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                ← חזרה לתרגול רגיל
              </a>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">השם שלך</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="הכנס את שמך"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none text-lg"
                  maxLength={20}
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">מספר תרגילים</label>
                <select
                  value={exerciseCount}
                  onChange={(e) => setExerciseCount(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none text-lg"
                >
                  <option value={5}>5 תרגילים</option>
                  <option value={10}>10 תרגילים</option>
                  <option value={15}>15 תרגילים</option>
                  <option value={20}>20 תרגילים</option>
                </select>
              </div>
              
              {/* Table Selection */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">בחירת לוחות כפל</label>
                <TableSelector
                  selectedTables={selectedTables}
                  onSelectionChange={handleTablesChange}
                  availableTables={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                />
              </div>

              <button
                onClick={() => onCreateRoom(playerName, { exerciseCount, selectedTables })}
                disabled={!playerName.trim() || selectedTables.length === 0 || isLoading}
                className={`w-full py-4 rounded-xl font-bold text-xl transition-all ${
                  playerName.trim() && selectedTables.length > 0 && !isLoading
                    ? 'bg-blue-500 text-white hover:bg-blue-600 transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? '⏳ יוצר חדר...' : '✨ צור חדר'}
              </button>
              
              <button
                onClick={() => setMode('select')}
                className="w-full py-3 rounded-xl font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                ← חזרה
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">השם שלך</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="הכנס את שמך"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none text-lg"
                  maxLength={20}
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">קוד החדר</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="הכנס קוד בן 6 תווים"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none text-lg text-center font-mono tracking-wider"
                  maxLength={6}
                />
              </div>

              <button
                onClick={() => onJoinRoom(roomCode, playerName)}
                disabled={!playerName.trim() || roomCode.length !== 6 || isLoading}
                className={`w-full py-4 rounded-xl font-bold text-xl transition-all ${
                  playerName.trim() && roomCode.length === 6 && !isLoading
                    ? 'bg-green-500 text-white hover:bg-green-600 transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? '⏳ מצטרף...' : '🚪 הצטרף לחדר'}
              </button>
              
              <button
                onClick={() => setMode('select')}
                className="w-full py-3 rounded-xl font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                ← חזרה
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
