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
import { clientRoomEngine } from './game-engine/client-room-engine';

export default function App() {
  const [view, setView] = useState<'lobby' | 'multiplayer' | 'singleplayer'>('lobby');
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');
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

  // Auto-join room if URL contains ?room=XXXXX
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom && urlRoom.length === 5) {
        handleJoinRoom(urlRoom.toUpperCase());
      }
    }
  }, []);

  // Synchronized server clock
  const { getServerNow, updateFromTimestamp } = useClockSync();

  // Parse URL query parameter ?room=CODE on load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setInitialRoomCode(roomParam.trim().toUpperCase());
      }
    } catch {}
  }, []);

  // Multiplayer socket controller
  const {
    roomState,
    myPlayerState,
    opponentPlayerState,
    otherPlayers,
    allPlayers,
    myPlayerId,
    isConnected,
    isReconnecting,
    latencyMs,
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
    addBot,
    removeBot,
  } = useMultiplayerSocket(activeRoomCode, updateFromTimestamp);

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
      // Use sessionStorage for per-tab player identity so multiple tabs don't clash
      const playerId = sessionStorage.getItem('alwird_player_id') || 'p_' + Math.random().toString(36).substring(2, 9);
      const sessionToken = sessionStorage.getItem('alwird_session_token') || 'tok_' + Math.random().toString(36).substring(2, 12);
      sessionStorage.setItem('alwird_player_id', playerId);
      sessionStorage.setItem('alwird_session_token', sessionToken);

      let createdRoomCode: string | null = null;

      try {
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

        if (res.ok) {
          const data = await res.json();
          if (data && data.roomCode) {
            createdRoomCode = data.roomCode;
          }
        }
      } catch {
        // Server fetch failed, smoothly fallback to in-browser engine
      }

      if (!createdRoomCode) {
        const localRoom = clientRoomEngine.createRoom(playerId, nickname, sessionToken, settings);
        createdRoomCode = localRoom.roomCode;
      }

      setActiveRoomCode(createdRoomCode.trim().toUpperCase());
      setView('multiplayer');
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ في إنشاء الغرفة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (rawRoomCode: string) => {
    const roomCode = rawRoomCode.trim().toUpperCase();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Use sessionStorage for per-tab player identity so multiple tabs don't clash
      const playerId = sessionStorage.getItem('alwird_player_id') || 'p_' + Math.random().toString(36).substring(2, 9);
      const sessionToken = sessionStorage.getItem('alwird_session_token') || 'tok_' + Math.random().toString(36).substring(2, 12);
      sessionStorage.setItem('alwird_player_id', playerId);
      sessionStorage.setItem('alwird_session_token', sessionToken);

      let joined = false;

      try {
        const res = await fetch(`/api/rooms/${roomCode}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId,
            nickname,
            sessionToken,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            joined = true;
          }
        }
      } catch {
        // Server fetch failed, smoothly fallback
      }

      if (!joined) {
        const localResult = clientRoomEngine.joinRoom(roomCode, playerId, nickname, sessionToken);
        if (localResult.success) {
          joined = true;
        } else {
          throw new Error(localResult.error || 'رمز الغرفة غير موجود أو غير صالح');
        }
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
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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
              initialRoomCode={initialRoomCode}
            />
          </main>
        </div>
      )}

      {view === 'singleplayer' && (
        <div className="flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden relative z-10">
          <GameHeader
            getServerNow={getServerNow}
            onLeave={() => setView('lobby')}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onOpenTests={() => setIsTestsModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            colorBlindMode={colorBlindMode}
            onToggleColorBlind={handleToggleColorBlind}
          />
          <main className="flex-1 flex flex-col p-1 sm:p-2 relative z-10 overflow-hidden">
            <SinglePlayerGame
              onBackToLobby={() => setView('lobby')}
              colorBlindMode={colorBlindMode}
            />
          </main>
        </div>
      )}

      {view === 'multiplayer' && !roomState && (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 text-center text-white relative z-10">
          <div className="bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center animate-spin text-emerald-400">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-base font-black text-white">جارٍ الاتصال بالغرفة {activeRoomCode}...</div>
              <div className="text-xs text-white/50">تتم الآن مزامنة حالة اللعبة مع الخادم</div>
            </div>
            <button
              type="button"
              onClick={handleLeaveRoom}
              className="mt-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      )}

      {view === 'multiplayer' && roomState && (
        <div className="relative z-10 flex-1 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden">
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
            latencyMs={latencyMs}
            isReconnecting={isReconnecting}
            onAddBot={addBot}
            onRemoveBot={removeBot}
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
