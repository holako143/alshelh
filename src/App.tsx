import React, { useState, useEffect } from 'react';
import { useClockSync } from './hooks/useClockSync';
import { useMultiplayerSocket } from './hooks/useMultiplayerSocket';
import { Lobby } from './components/Lobby';
import { MultiplayerGame } from './components/MultiplayerGame';
import { SinglePlayerGame } from './components/SinglePlayerGame';
import { RulesModal } from './components/RulesModal';
import { SelfTestModal } from './components/SelfTestModal';
import { SettingsModal } from './components/SettingsModal';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { GameHeader } from './components/GameHeader';
import { GameSettings } from './shared/types';

export default function App() {
  const [view, setView] = useState<'lobby' | 'multiplayer' | 'singleplayer'>('lobby');
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('alwird_nickname') || 'لاعب ' + Math.floor(100 + Math.random() * 900);
  });
  const [colorBlindMode, setColorBlindMode] = useState<boolean>(() => {
    return localStorage.getItem('alwird_colorblind') === 'true';
  });
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isTestsModalOpen, setIsTestsModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronized server clock
  const { getServerNow } = useClockSync();

  // Multiplayer socket controller
  const {
    roomState,
    myPlayerState,
    opponentPlayerState,
    otherPlayers,
    allPlayers,
    myPlayerId,
    isConnected,
    opponentDisconnected,
    gracePeriodRemaining,
    lastError,
    solveAnnouncement,
    dismissSolveAnnouncement,
    setLastError,
    toggleReady,
    startMatch,
    submitGuess,
    useJoker,
    eliminatedLetters,
    requestSync,
  } = useMultiplayerSocket(activeRoomCode);

  const handleUpdateNickname = (newName: string) => {
    setNickname(newName);
    localStorage.setItem('alwird_nickname', newName);
  };

  const handleToggleColorBlind = () => {
    const next = !colorBlindMode;
    setColorBlindMode(next);
    localStorage.setItem('alwird_colorblind', String(next));
  };

  const handleCreateRoom = async (settings: Partial<GameSettings>) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const playerId = localStorage.getItem('alwird_player_id') || 'p_' + Math.random().toString(36).substring(2, 9);
      const sessionToken = localStorage.getItem('alwird_session_token') || 'tok_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('alwird_player_id', playerId);
      localStorage.setItem('alwird_session_token', sessionToken);

      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: playerId,
          nickname,
          sessionToken,
          settings,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.roomCode) {
        throw new Error(data.error || 'تعذر إنشاء الغرفة');
      }

      setActiveRoomCode(data.roomCode);
      setView('multiplayer');
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (roomCode: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const playerId = localStorage.getItem('alwird_player_id') || 'p_' + Math.random().toString(36).substring(2, 9);
      const sessionToken = localStorage.getItem('alwird_session_token') || 'tok_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('alwird_player_id', playerId);
      localStorage.setItem('alwird_session_token', sessionToken);

      const res = await fetch(`/api/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          nickname,
          sessionToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'تعذر الانضمام للغرفة');
      }

      setActiveRoomCode(roomCode);
      setView('multiplayer');
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل الانضمام للغرفة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveRoom = () => {
    setActiveRoomCode(null);
    setView('lobby');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05060f] text-white selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      {/* Frosted Glass Ambient Lighting Orbs */}
      <div className="pointer-events-none fixed top-[-120px] left-[-100px] w-[550px] h-[550px] bg-blue-600/25 rounded-full blur-[130px] z-0" />
      <div className="pointer-events-none fixed bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] z-0" />
      <div className="pointer-events-none fixed top-[25%] right-[10%] w-[350px] h-[350px] bg-cyan-400/10 rounded-full blur-[110px] z-0" />
      <div className="pointer-events-none fixed bottom-[20%] left-[15%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] z-0" />

      {view === 'lobby' && (
        <div className="flex flex-col min-h-screen relative z-10">
          <GameHeader
            getServerNow={getServerNow}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onOpenTests={() => setIsTestsModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            colorBlindMode={colorBlindMode}
            onToggleColorBlind={handleToggleColorBlind}
          />
          <main className="flex-1 flex items-center justify-center p-2 sm:p-4">
            <Lobby
              nickname={nickname}
              onUpdateNickname={handleUpdateNickname}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onStartSinglePlayer={() => setView('singleplayer')}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onOpenDailyChallenge={() => setIsDailyChallengeOpen(true)}
              isLoading={isLoading}
              errorMessage={errorMessage}
            />
          </main>
        </div>
      )}

      {view === 'singleplayer' && (
        <div className="flex flex-col min-h-screen relative z-10">
          <GameHeader
            getServerNow={getServerNow}
            onLeave={() => setView('lobby')}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onOpenTests={() => setIsTestsModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            colorBlindMode={colorBlindMode}
            onToggleColorBlind={handleToggleColorBlind}
          />
          <main className="flex-1 flex flex-col p-2 relative z-10">
            <SinglePlayerGame
              onBackToLobby={() => setView('lobby')}
              colorBlindMode={colorBlindMode}
            />
          </main>
        </div>
      )}

      {view === 'multiplayer' && roomState && (
        <div className="relative z-10 flex-1 flex flex-col">
          <MultiplayerGame
            roomState={roomState}
            myPlayerState={myPlayerState}
            opponentPlayerState={opponentPlayerState}
            otherPlayers={otherPlayers}
            allPlayers={allPlayers}
            myPlayerId={myPlayerId}
            opponentDisconnected={opponentDisconnected}
            gracePeriodRemaining={gracePeriodRemaining}
            lastError={lastError}
            getServerNow={getServerNow}
            onToggleReady={toggleReady}
            onStartMatch={startMatch}
            onSubmitGuess={submitGuess}
            onLeave={handleLeaveRoom}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onOpenTests={() => setIsTestsModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            colorBlindMode={colorBlindMode}
            onToggleColorBlind={handleToggleColorBlind}
            solveAnnouncement={solveAnnouncement}
            onDismissSolveAnnouncement={dismissSolveAnnouncement}
            onUseJoker={useJoker}
            eliminatedLetters={eliminatedLetters}
          />
        </div>
      )}

      {/* Rules & Guide Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* Live Self-Test Verification Modal */}
      <SelfTestModal
        isOpen={isTestsModalOpen}
        onClose={() => setIsTestsModalOpen(false)}
      />

      {/* Audio & Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        colorBlindMode={colorBlindMode}
        onToggleColorBlind={handleToggleColorBlind}
      />

      {/* Daily Challenge Modal */}
      <DailyChallengeModal
        isOpen={isDailyChallengeOpen}
        onClose={() => setIsDailyChallengeOpen(false)}
        colorBlindMode={colorBlindMode}
      />
    </div>
  );
}
