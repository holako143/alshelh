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
import { WifiOff, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
}) => {
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, TileState>>({});

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

  // Reset guess input and key statuses on round change
  useEffect(() => {
    setCurrentGuess('');
    setLocalError(null);
  }, [roomState.currentRound]);

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
    if (roomState.status !== 'PLAYING') return;
    if (currentGuess.length >= roomState.settings.wordLength) return;

    setCurrentGuess((prev) => prev + char);
    setLocalError(null);
  };

  const handleDelete = () => {
    if (!myPlayerState) return;
    if (myPlayerState.hasSolved || myPlayerState.hasExhausted) return;
    if (roomState.status !== 'PLAYING') return;

    setCurrentGuess((prev) => prev.slice(0, -1));
    setLocalError(null);
  };

  const handleEnter = () => {
    if (!myPlayerState) return;
    if (myPlayerState.hasSolved || myPlayerState.hasExhausted) return;
    if (roomState.status !== 'PLAYING') return;

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
    roomState.status !== 'PLAYING' ||
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

      {/* Active Game Arena */}
      <main className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full px-2 py-2">
        {/* Opponent status & local feedback bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2">
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

            {(localError || lastError) && (
              <div className="bg-rose-500/80 backdrop-blur-md border border-rose-300/40 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl shadow-lg">
                {localError || lastError}
              </div>
            )}
          </div>
        </div>

        {/* Semantic Hint Card for Easy Guessing & Fun Participation */}
        {roomState.status === 'PLAYING' && roomState.currentHint && (
          <div className="px-2 my-1.5">
            <HintCard
              hint={roomState.currentHint}
              attemptsCount={myPlayerState?.currentGuesses.length || 0}
              initialExpanded={true}
            />
          </div>
        )}

        {/* Wordle Board */}
        <div className="flex items-center justify-center my-auto py-2">
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
