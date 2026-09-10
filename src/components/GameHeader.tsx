import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, LogOut, Copy, Check, Clock, Infinity as InfinityIcon } from 'lucide-react';
import { soundManager } from '../lib/audio';
import { LatencyIndicator } from './LatencyIndicator';

interface GameHeaderProps {
  roomCode?: string | null;
  currentRound?: number;
  totalRounds?: number;
  roundStartedAt?: number | null;
  roundDurationMs?: number;
  getServerNow: () => number;
  onLeave?: () => void;
  onOpenRules?: () => void;
  onOpenTests?: () => void;
  onOpenSettings?: () => void;
  colorBlindMode?: boolean;
  onToggleColorBlind?: () => void;
  player1Name?: string;
  player2Name?: string;
  player1Score?: number;
  player2Score?: number;
  playerCount?: number;
  latencyMs?: number | null;
  isReconnecting?: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  roomCode,
  currentRound = 1,
  totalRounds = 1,
  roundStartedAt,
  roundDurationMs = 180000,
  getServerNow,
  onLeave,
  player1Name,
  player2Name,
  player1Score = 0,
  player2Score = 0,
  latencyMs,
  isReconnecting = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());
  const isInfiniteDuration = roundDurationMs <= 0;
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    isInfiniteDuration ? 0 : Math.round(roundDurationMs / 1000)
  );

  useEffect(() => {
    const unsub = soundManager.subscribe(() => {
      setIsMuted(soundManager.isMuted());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!roundStartedAt || isInfiniteDuration) return;

    const interval = setInterval(() => {
      const serverNow = getServerNow();
      const endTime = roundStartedAt + roundDurationMs;
      const diffMs = Math.max(0, endTime - serverNow);
      const secs = Math.ceil(diffMs / 1000);
      setRemainingSeconds(secs);

      if (secs <= 5 && secs > 0) {
        soundManager.playCountdownTick(secs === 1);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [roundStartedAt, roundDurationMs, getServerNow, isInfiniteDuration]);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerStyles = () => {
    if (isInfiniteDuration) {
      return 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30';
    }
    if (remainingSeconds <= 5) {
      return 'bg-rose-500/80 text-white animate-pulse border border-rose-400/50 shadow-md shadow-rose-500/30';
    }
    if (remainingSeconds <= 15) {
      return 'bg-amber-500/80 text-white border border-amber-400/50 shadow-md shadow-amber-500/30';
    }
    return 'bg-white/[0.07] text-white border border-white/15 shadow-xs';
  };

  return (
    <header id="game-header" className="w-full bg-[#05060f]/85 backdrop-blur-xl border-b border-white/10 py-2 sm:py-2.5 px-2.5 sm:px-6 sticky top-0 z-30 shadow-md select-none">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & Room Code & Latency */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="text-lg sm:text-xl font-black bg-gradient-to-l from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
            الوِرد
          </span>

          {roomCode && (
            <button
              id="btn-copy-room-code"
              type="button"
              onClick={handleCopyCode}
              title="نسخ رمز الغرفة"
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold bg-white/[0.06] hover:bg-white/[0.12] px-2 py-1 rounded-xl border border-white/15 text-white/90 transition-all cursor-pointer"
            >
              <span>{roomCode}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-60" />}
            </button>
          )}

          {/* Latency Indicator right in header */}
          <LatencyIndicator latencyMs={latencyMs} isReconnecting={isReconnecting} className="hidden sm:inline-block" />
        </div>

        {/* Center: Round & Timer & Score */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {totalRounds > 0 && (
            <div className="text-[11px] sm:text-xs font-bold text-white/80 bg-white/[0.06] border border-white/10 px-2 sm:px-2.5 py-1 rounded-xl">
              الجولة {currentRound}/{totalRounds}
            </div>
          )}

          {roundStartedAt && (
            <div
              id="timer-badge"
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl font-mono font-black text-xs sm:text-sm border transition-all ${getTimerStyles()}`}
              title={isInfiniteDuration ? 'جولة بلا وقت محدد (لا نهائي)' : `الوقت المتبقي: ${remainingSeconds} ثانية`}
            >
              {isInfiniteDuration ? (
                <>
                  <InfinityIcon className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="text-[11px]">مفتوح</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 opacity-90" />
                  <span>{formatTimer(remainingSeconds)}</span>
                </>
              )}
            </div>
          )}

          {player1Name && player2Name && (
            <div className="hidden xs:flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold bg-white/[0.05] px-2 sm:px-2.5 py-1 rounded-xl border border-white/10 text-white">
              <span className="text-emerald-400 max-w-[65px] sm:max-w-none truncate">{player1Name} ({player1Score})</span>
              <span className="text-white/40">-</span>
              <span className="text-teal-300 max-w-[65px] sm:max-w-none truncate">{player2Name} ({player2Score})</span>
            </div>
          )}
        </div>

        {/* Controls: Sound & Leave & Mobile Latency */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="sm:hidden">
            <LatencyIndicator latencyMs={latencyMs} isReconnecting={isReconnecting} />
          </div>

          <button
            id="btn-toggle-sound"
            type="button"
            onClick={handleToggleSound}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
              !isMuted
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/25'
                : 'text-white/50 hover:text-white hover:bg-white/[0.10] border-transparent hover:border-white/10'
            }`}
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {onLeave && (
            <button
              id="btn-leave-game"
              type="button"
              onClick={onLeave}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 border border-transparent hover:border-rose-400/30 transition-all cursor-pointer"
              title="مغادرة المباراة"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
