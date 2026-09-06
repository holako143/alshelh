import React, { useState, useEffect } from 'react';
import { RoundSummary } from '../shared/types';
import { Trophy, CheckCircle2, XCircle, Clock, Hash, Zap, Sparkles } from 'lucide-react';
import { fireSolveConfetti } from '../lib/confetti';

interface RoundResultModalProps {
  summary: RoundSummary | null;
  revealedWord: string | null;
  roundNumber: number;
  totalRounds: number;
  transitionEndsAt: number | null;
  myPlayerId?: string;
  players?: Array<{ id: string; nickname: string }>;
  player1: { id: string; nickname: string };
  player2?: { id: string; nickname: string } | null;
}

export const RoundResultModal: React.FC<RoundResultModalProps> = ({
  summary,
  revealedWord,
  roundNumber,
  totalRounds,
  transitionEndsAt,
  myPlayerId,
  players,
  player1,
  player2,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3);

  // All players list
  const playerList: Array<{ id: string; nickname: string }> = players && players.length > 0
    ? players
    : player2
    ? [player1, player2]
    : [player1];

  const winner = summary?.winnerPlayerId
    ? playerList.find((p) => p.id === summary.winnerPlayerId)
    : null;

  const winnerNickname = winner ? winner.nickname : null;
  const isMeWinner = myPlayerId && summary?.winnerPlayerId === myPlayerId;

  useEffect(() => {
    if (isMeWinner) {
      fireSolveConfetti();
    }
  }, [isMeWinner]);

  useEffect(() => {
    if (!transitionEndsAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((transitionEndsAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [transitionEndsAt]);

  // Sort players for this round's ranking:
  // 1. Solved first
  // 2. Score gained (descending)
  // 3. Time (ascending)
  const rankedPlayers = [...playerList].sort((a, b) => {
    const resA = summary?.playerResults[a.id];
    const resB = summary?.playerResults[b.id];
    if (!resA || !resB) return 0;
    if (resA.solved !== resB.solved) return resA.solved ? -1 : 1;
    if (resB.scoreGained !== resA.scoreGained) return resB.scoreGained - resA.scoreGained;
    return resA.completionTimeMs - resB.completionTimeMs;
  });

  return (
    <div id="round-result-modal" className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl text-center flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 text-white my-auto">
        <div className="flex flex-col items-center">
          <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">
            نتائج الجولة {roundNumber} من {totalRounds}
          </div>

          <div className="text-3xl font-black text-emerald-300 bg-white/[0.06] px-6 py-2 rounded-2xl border border-white/15 shadow-inner backdrop-blur-md mb-1.5">
            {revealedWord || summary?.secretWord}
          </div>
          <div className="text-xs text-white/50">الكلمة السرية للجولة</div>
        </div>

        {/* Winner Banner */}
        <div className={`rounded-2xl p-3 border flex items-center justify-center gap-2 shadow-sm backdrop-blur-md ${
          isMeWinner
            ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 shadow-emerald-500/10'
            : 'bg-white/[0.04] border-white/10'
        }`}>
          {winnerNickname ? (
            <>
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-sm text-white">
                {isMeWinner ? (
                  <span>🎉 <strong className="text-emerald-300 font-black">أنت فزت</strong> بهذه الجولة!</span>
                ) : (
                  <span>فاز <span className="text-emerald-300 font-extrabold">{winnerNickname}</span> بهذه الجولة!</span>
                )}
              </span>
            </>
          ) : (
            <span className="font-bold text-sm text-white/80">
              تعادل في هذه الجولة!
            </span>
          )}
        </div>

        {/* Players leaderboard for this round */}
        {summary && (
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            <div className="text-xs font-bold text-white/60 text-right px-1">
              ترتيب المتسابقين في الجولة ({playerList.length} لاعبين):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right text-xs">
              {rankedPlayers.map((player, idx) => {
                const res = summary.playerResults[player.id];
                const isWinner = player.id === summary.winnerPlayerId;
                const isMe = player.id === myPlayerId;

                return (
                  <div
                    key={player.id}
                    className={`p-3 rounded-2xl flex flex-col gap-1.5 border shadow-sm backdrop-blur-md transition-all ${
                      isWinner
                        ? 'bg-amber-500/15 border-amber-400/35 shadow-amber-500/10'
                        : isMe
                        ? 'bg-emerald-500/10 border-emerald-400/30'
                        : 'bg-white/[0.04] border-white/10'
                    }`}
                  >
                    <div className="font-bold text-white truncate flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-4 h-4 rounded-full bg-white/10 text-white/70 text-[10px] flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span className="truncate">{player.nickname}</span>
                        {isMe && <span className="text-[10px] text-emerald-400 font-normal">(أنت)</span>}
                      </div>

                      {res?.solved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-white/60 pt-1">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3 opacity-60" />
                        <span>محاولات: {res?.attemptsUsed || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 opacity-60" />
                        <span>{((res?.completionTimeMs || 0) / 1000).toFixed(1)}ث</span>
                      </span>
                    </div>

                    <div className="text-emerald-400 font-bold text-xs flex items-center justify-between pt-1 border-t border-white/10">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>النقاط</span>
                      </span>
                      <span>+{res?.scoreGained || 0} نقطة</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Countdown to Next Round */}
        <div className="text-xs text-white/60 flex items-center justify-center gap-1.5 pt-1 border-t border-white/10">
          <span>الجولة التالية تبدأ خلال</span>
          <span className="font-black text-base text-emerald-400">{secondsRemaining}</span>
          <span>ثوانٍ...</span>
        </div>
      </div>
    </div>
  );
};
