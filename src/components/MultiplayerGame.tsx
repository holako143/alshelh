import React, { useState, useEffect } from 'react';
import { RoomState, PlayerState, TileState } from '../shared/types';
import { GameHeader } from './GameHeader';
import { GameBoard } from './GameBoard';
import { OpponentProgress } from './OpponentProgress';
import { ArabicKeyboard } from './ArabicKeyboard';
import { WaitingRoom } from './WaitingRoom';
import { RoundResultModal } from './RoundResultModal';
import { MatchResultModal } from './MatchResultModal';
import { HintCard } from './HintCard';
import { WinnerAlertBanner } from './WinnerAlertBanner';
import { SolveAnnouncement } from '../hooks/useMultiplayerSocket';
import { soundManager } from '../lib/audio';
import { fireSolveConfetti } from '../lib/confetti';
import { WifiOff, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface MultiplayerGameProps {
  roomState: RoomState;
  myPlayerState: PlayerState | null;
  opponentPlayerState: PlayerState | null;
  otherPlayers?: PlayerState[];
  allPlayers?: PlayerState[];
  myPlayerId: string;
  opponentDisconnected: boolean;
  gracePeriodRemaining: number | null;
  lastError: string | null;
  getServerNow: () => number;
  onToggleReady: (ready: boolean) => void;
  onStartMatch?: () => void;
  onSubmitGuess: (guess: string, roundNumber: number) => void;
  onLeave: () => void;
  onOpenRules: () => void;
  onOpenTests: () => void;
  onOpenSettings?: () => void;
  colorBlindMode: boolean;
  onToggleColorBlind: () => void;
  solveAnnouncement?: SolveAnnouncement | null;
  onDismissSolveAnnouncement?: () => void;
  onUseJoker?: () => void;
  eliminatedLetters?: string[];
  latencyMs?: number | null;
  isReconnecting?: boolean;
  onAddBot?: () => void;
  onRemoveBot?: () => void;
}

export const MultiplayerGame: React.FC<MultiplayerGameProps> = ({
  roomState,
  myPlayerState,
  opponentPlayerState,
  otherPlayers,
  allPlayers,
  myPlayerId,
  opponentDisconnected,
  gracePeriodRemaining,
  lastError,
  getServerNow,
  onToggleReady,
  onStartMatch,
  onSubmitGuess,
  onLeave,
  onOpenRules,
  onOpenTests,
  onOpenSettings,
  colorBlindMode,
  onToggleColorBlind,
  solveAnnouncement,
  onDismissSolveAnnouncement,
  onUseJoker,
  eliminatedLetters = [],
  latencyMs,
  isReconnecting,
  onAddBot,
  onRemoveBot,
}) => {
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, TileState>>({});

  // Unified Server Timestamp Synchronization
  const [serverTime, setServerTime] = useState<number>(() => getServerNow());

  useEffect(() => {
    const updateTime = () => {
      setServerTime(getServerNow());
    };
    updateTime();
    // 250ms interval ensures accurate real-time clock, smooth countdown without high CPU consumption
    const interval = setInterval(updateTime, 250);
    return () => clearInterval(interval);
  }, [getServerNow]);

  // Derived authoritative round boundaries based on unified server timestamps
  const roundStartedAt = roomState.roundStartedAt;
  const roundDurationMs = roomState.roundDurationMs;
  const roundEndsAt = roundStartedAt ? roundStartedAt + roundDurationMs : null;

  const isPlaying = roomState.status === 'PLAYING';
  const hasRoundStarted = roundStartedAt ? serverTime >= roundStartedAt : true;
  const isTimeExpired = Boolean(
    isPlaying && roundEndsAt && serverTime >= roundEndsAt
  );

  const timeRemainingMs = roundEndsAt ? Math.max(0, roundEndsAt - serverTime) : 0;
  const remainingSeconds = Math.ceil(timeRemainingMs / 1000);
  const progressPercent =
    roundDurationMs > 0
      ? Math.min(100, Math.max(0, (timeRemainingMs / roundDurationMs) * 100))
      : 0;

  const playerList = allPlayers && allPlayers.length > 0
    ? allPlayers
    : (Object.values(roomState.players) as PlayerState[]);

  const opponentsList = otherPlayers && otherPlayers.length > 0
    ? otherPlayers
    : playerList.filter((p) => p.id !== myPlayerId);

  // Trigger confetti when current player solves word or any player solves
  useEffect(() => {
    if (myPlayerState?.hasSolved) {
      fireSolveConfetti();
    }
  }, [myPlayerState?.hasSolved]);

  useEffect(() => {
    if (solveAnnouncement) {
      fireSolveConfetti();
    }
  }, [solveAnnouncement]);

  // Reset guess input and key statuses on round change or roundStartedAt update
  useEffect(() => {
    setCurrentGuess('');
    setLocalError(null);
  }, [roomState.currentRound, roomState.roundStartedAt]);

  // Compute key statuses from player's current evaluations
  useEffect(() => {
    if (!myPlayerState) return;
    const statuses: Record<string, TileState> = {};

    myPlayerState.currentGuesses.forEach((word, wordIdx) => {
      const evaluation = myPlayerState.currentEvaluations[wordIdx];
      if (!evaluation) return;

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const status = evaluation[i];
        const currentBest = statuses[char];

        if (status === 'CORRECT') {
          statuses[char] = 'CORRECT';
        } else if (status === 'PRESENT' && currentBest !== 'CORRECT') {
          statuses[char] = 'PRESENT';
        } else if (status === 'ABSENT' && !currentBest) {
          statuses[char] = 'ABSENT';
        }
      }
    });

    // Merge eliminated letters from Joker power-up
    eliminatedLetters.forEach((char) => {
      if (!statuses[char]) {
        statuses[char] = 'ABSENT';
      }
    });

    setLetterStatuses(statuses);
  }, [myPlayerState?.currentGuesses, myPlayerState?.currentEvaluations, eliminatedLetters]);

  const handleChar = (char: string) => {
    if (!myPlayerState) return;
    if (myPlayerState.hasSolved || myPlayerState.hasExhausted) return;
    if (!isPlaying || !hasRoundStarted || isTimeExpired) return;
    if (currentGuess.length >= roomState.settings.wordLength) return;

    setCurrentGuess((prev) => prev + char);
    setLocalError(null);
  };

  const handleDelete = () => {
    if (!myPlayerState) return;
    if (myPlayerState.hasSolved || myPlayerState.hasExhausted) return;
    if (!isPlaying || !hasRoundStarted || isTimeExpired) return;

    setCurrentGuess((prev) => prev.slice(0, -1));
    setLocalError(null);
  };

  const handleEnter = () => {
    if (!myPlayerState) return;
    if (myPlayerState.hasSolved || myPlayerState.hasExhausted) return;
    if (!isPlaying) return;

    if (!hasRoundStarted) {
      setLocalError('تبدأ الجولة بعد لحظات...');
      triggerShake();
      return;
    }

    if (isTimeExpired) {
      setLocalError('انتهى وقت الجولة الرسمي حسب توقيت الخادم!');
      triggerShake();
      return;
    }

    if (currentGuess.length < roomState.settings.wordLength) {
      setLocalError(`يجب إكمال ${roomState.settings.wordLength} أحرف أولاً`);
      triggerShake();
      return;
    }

    // Submit guess to authoritative server
    onSubmitGuess(currentGuess, roomState.currentRound);
    setCurrentGuess('');
  };

  const triggerShake = () => {
    setIsShaking(true);
    soundManager.playInvalidWord();
    setTimeout(() => setIsShaking(false), 500);
  };

  // If in pre-game stages, render WaitingRoom
  if (
    roomState.status === 'WAITING' ||
    roomState.status === 'READY_CHECK' ||
    roomState.status === 'COUNTDOWN'
  ) {
    return (
      <div className="flex flex-col min-h-screen">
        <GameHeader
          roomCode={roomState.roomCode}
          getServerNow={getServerNow}
          onLeave={onLeave}
          onOpenRules={onOpenRules}
          onOpenTests={onOpenTests}
          onOpenSettings={onOpenSettings}
          colorBlindMode={colorBlindMode}
          onToggleColorBlind={onToggleColorBlind}
          playerCount={playerList.length}
        />
        <main className="flex-1 flex items-center justify-center p-2">
          <WaitingRoom
            roomState={roomState}
            myPlayerId={myPlayerId}
            onToggleReady={onToggleReady}
            onStartMatch={onStartMatch}
            onLeave={onLeave}
            countdownEndsAt={roomState.countdownEndsAt}
            getServerNow={getServerNow}
            onAddBot={onAddBot}
            onRemoveBot={onRemoveBot}
          />
        </main>
      </div>
    );
  }

  const latestSummary =
    roomState.roundSummaries.length > 0
      ? roomState.roundSummaries[roomState.roundSummaries.length - 1]
      : null;

  const isInputDisabled =
    !isPlaying ||
    !hasRoundStarted ||
    isTimeExpired ||
    Boolean(myPlayerState?.hasSolved) ||
    Boolean(myPlayerState?.hasExhausted);

  return (
    <div id="multiplayer-game-arena" className="flex flex-col min-h-screen">
      <GameHeader
        roomCode={roomState.roomCode}
        currentRound={roomState.currentRound}
        totalRounds={roomState.settings.totalRounds}
        roundStartedAt={roomState.roundStartedAt}
        roundDurationMs={roomState.roundDurationMs}
        getServerNow={getServerNow}
        onLeave={onLeave}
        onOpenRules={onOpenRules}
        onOpenTests={onOpenTests}
        onOpenSettings={onOpenSettings}
        colorBlindMode={colorBlindMode}
        onToggleColorBlind={onToggleColorBlind}
        player1Name={myPlayerState?.nickname}
        player2Name={opponentPlayerState?.nickname}
        player1Score={myPlayerState?.totalScore}
        player2Score={opponentPlayerState?.totalScore}
        playerCount={playerList.length}
        latencyMs={latencyMs}
        isReconnecting={isReconnecting}
      />

      {/* Real-time Winner Notification Broadcast to All Players */}
      <WinnerAlertBanner
        announcement={solveAnnouncement || null}
        onDismiss={onDismissSolveAnnouncement || (() => {})}
      />

      {/* Opponent Disconnect Grace Alert */}
      {opponentDisconnected && (
        <div className="bg-amber-500/80 backdrop-blur-md border-b border-amber-300/40 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg animate-pulse">
          <WifiOff className="w-4 h-4" />
          <span>
            انقطع اتصال أحد اللاعبين مؤقتاً... بانتظار عودته خلال{' '}
            {gracePeriodRemaining !== null ? `${gracePeriodRemaining} ثانية` : 'لحظات'}
          </span>
        </div>
      )}

      {/* Synchronized Round Time Bar (Unified across all competitors via Server Timestamp) */}
      {isPlaying && roundStartedAt && (
        <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 pt-1">
          <div className="w-full bg-white/[0.08] rounded-full h-1.5 overflow-hidden backdrop-blur-xs">
            <div
              className={`h-full transition-all duration-100 ease-linear rounded-full ${
                remainingSeconds <= 5
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                  : remainingSeconds <= 15
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                  : 'bg-gradient-to-r from-emerald-400 to-teal-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Active Game Arena */}
      <main className="flex-1 min-h-0 flex flex-col justify-between max-w-4xl mx-auto w-full px-1.5 sm:px-2 py-1 sm:py-2">
        {/* Opponent status & local feedback bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 px-1 sm:px-2">
          <div className="w-full sm:w-auto">
            <OpponentProgress
              opponent={opponentPlayerState}
              opponents={opponentsList}
              maxAttempts={roomState.settings.maxAttempts}
              wordLength={roomState.settings.wordLength}
              isDisconnected={opponentDisconnected}
              gracePeriodRemaining={gracePeriodRemaining}
            />
          </div>

          <div className="flex flex-col items-center sm:items-end gap-1.5">
            {myPlayerState?.hasSolved && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 font-bold text-xs shadow-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span>أحسنت! حللت كلمة هذه الجولة بنجاح 🎉</span>
              </div>
            )}

            {myPlayerState?.hasExhausted && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 backdrop-blur-md border border-rose-400/30 text-rose-300 font-bold text-xs shadow-lg">
                <AlertTriangle className="w-4 h-4" />
                <span>استنفدت محاولاتك! بانتظار انتهاء الجولة...</span>
              </div>
            )}

            {isTimeExpired && !myPlayerState?.hasSolved && !myPlayerState?.hasExhausted && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-amber-300 font-bold text-xs shadow-lg animate-pulse">
                <Clock className="w-4 h-4" />
                <span>انتهى وقت الجولة الرسمي! جاري احتساب النتائج...</span>
              </div>
            )}

            {!hasRoundStarted && isPlaying && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-300 font-bold text-xs shadow-lg animate-pulse">
                <Clock className="w-4 h-4" />
                <span>تبدأ الجولة خلال لحظات متزامنة...</span>
              </div>
            )}

            {(localError || lastError) && (
              <div className="bg-rose-500/80 backdrop-blur-md border border-rose-300/40 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl shadow-lg">
                {localError || lastError}
              </div>
            )}
          </div>
        </div>

        {/* Semantic Hint Card for Easy Guessing & Fun Participation */}
        {roomState.status === 'PLAYING' && roomState.currentHint && (
          <div className="px-1 sm:px-2 my-1">
            <HintCard
              hint={roomState.currentHint}
              attemptsCount={myPlayerState?.currentGuesses.length || 0}
              initialExpanded={false}
            />
          </div>
        )}

        {/* Wordle Board */}
        <div className="flex items-center justify-center my-auto py-1 sm:py-2">
          <GameBoard
            guesses={myPlayerState?.currentGuesses || []}
            evaluations={myPlayerState?.currentEvaluations || []}
            currentGuess={currentGuess}
            maxAttempts={roomState.settings.maxAttempts}
            wordLength={roomState.settings.wordLength}
            isShaking={isShaking}
            colorBlindMode={colorBlindMode}
          />
        </div>

        {/* On-screen Arabic Keyboard */}
        <div className="pt-2 pb-1">
          <ArabicKeyboard
            onChar={handleChar}
            onDelete={handleDelete}
            onEnter={handleEnter}
            letterStatuses={letterStatuses}
            disabled={isInputDisabled}
            onUseJoker={onUseJoker}
            jokersRemaining={myPlayerState?.jokersRemaining ?? 0}
          />
        </div>
      </main>

      {/* Round Ending Results Modal */}
      {roomState.status === 'ROUND_ENDING' && (
        <RoundResultModal
          summary={latestSummary}
          revealedWord={roomState.revealedWord}
          roundNumber={roomState.currentRound}
          totalRounds={roomState.settings.totalRounds}
          transitionEndsAt={roomState.transitionEndsAt}
          getServerNow={getServerNow}
          myPlayerId={myPlayerId}
          players={playerList.map((p) => ({ id: p.id, nickname: p.nickname }))}
          player1={{
            id: myPlayerId,
            nickname: myPlayerState?.nickname || 'أنت',
          }}
          player2={
            opponentPlayerState
              ? { id: opponentPlayerState.id, nickname: opponentPlayerState.nickname }
              : null
          }
        />
      )}

      {/* Final Match Results Modal */}
      {roomState.status === 'MATCH_ENDED' && (
        <MatchResultModal
          roomState={roomState}
          myPlayerId={myPlayerId}
          onHome={onLeave}
        />
      )}
    </div>
  );
};
