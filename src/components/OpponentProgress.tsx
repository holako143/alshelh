import React from 'react';
import { PlayerState } from '../shared/types';
import { User, CheckCircle2, AlertCircle } from 'lucide-react';

interface OpponentProgressProps {
  opponent?: PlayerState | null;
  opponents?: PlayerState[];
  maxAttempts?: number;
  wordLength?: number;
  isDisconnected?: boolean;
  gracePeriodRemaining?: number | null;
}

export const OpponentProgress: React.FC<OpponentProgressProps> = ({
  opponent,
  opponents,
  maxAttempts = 6,
}) => {
  const opponentList: PlayerState[] =
    opponents && opponents.length > 0 ? opponents : opponent ? [opponent] : [];

  if (opponentList.length === 0) {
    return null;
  }

  const opp = opponentList[0];
  const attemptsCount = opp.currentEvaluations.length;

  return (
    <div
      id="opponent-progress-card"
      className="bg-white/[0.04] backdrop-blur-xl rounded-xl px-3 py-2 border border-white/10 shadow-md flex items-center justify-between gap-3 w-full max-w-sm mx-auto text-white"
    >
      {/* Opponent Info */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
          <User className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 text-right">
          <div className="font-bold text-xs text-white truncate">
            {opp.nickname}
          </div>
          <div className="text-[10px] text-white/50">
            النقاط: <strong className="text-emerald-300 font-bold">{opp.totalScore}</strong>
          </div>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1">
        {Array.from({ length: maxAttempts }).map((_, rIdx) => {
          const evalRow = opp.currentEvaluations[rIdx];
          const isRowDone = Boolean(evalRow);
          const hasCorrect = evalRow && evalRow.some((s) => s === 'CORRECT');

          return (
            <div
              key={rIdx}
              title={`المحاولة ${rIdx + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                !isRowDone
                  ? 'bg-white/15'
                  : hasCorrect
                  ? 'bg-emerald-400 shadow-xs shadow-emerald-400/60'
                  : 'bg-amber-400'
              }`}
            />
          );
        })}
      </div>

      {/* Status Badge */}
      <div>
        {opp.hasSolved ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
            <CheckCircle2 className="w-3 h-3" />
            <span>حل الكلمة!</span>
          </span>
        ) : opp.hasExhausted ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-lg">
            <AlertCircle className="w-3 h-3" />
            <span>استنفد</span>
          </span>
        ) : (
          <span className="text-[11px] font-medium text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg animate-pulse">
            المحاولة {attemptsCount}/{maxAttempts}
          </span>
        )}
      </div>
    </div>
  );
};
