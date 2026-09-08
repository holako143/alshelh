import React, { useState } from 'react';
import { PlayerState } from '../shared/types';
import { User, Wifi, WifiOff, CheckCircle2, AlertCircle, Users, ChevronDown } from 'lucide-react';

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
  maxAttempts = 8,
  wordLength = 5,
  isDisconnected = false,
  gracePeriodRemaining = null,
}) => {
  const opponentList: PlayerState[] = opponents && opponents.length > 0
    ? opponents
    : opponent
    ? [opponent]
    : [];

  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(null);

  if (opponentList.length === 0) {
    return (
      <div id="opponent-progress" className="bg-white/[0.04] backdrop-blur-2xl rounded-2xl p-3 border border-white/10 text-center text-xs text-white/50 shadow-lg">
        بانتظار انضمام المنافسين...
      </div>
    );
  }

  // Active opponent to display in detail if requested
  const activeOpponent = (selectedOpponentId
    ? opponentList.find((p) => p.id === selectedOpponentId)
    : null) || opponentList[0];

  // If there's only 1 opponent, display single card
  if (opponentList.length === 1) {
    const opp = opponentList[0];
    const attemptsCount = opp.currentEvaluations.length;

    return (
      <div
        id="opponent-progress-card"
        className="bg-white/[0.04] backdrop-blur-2xl rounded-2xl p-3 border border-white/10 shadow-lg flex flex-col gap-2.5 w-full max-w-sm text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                <span>{opp.nickname}</span>
                {isDisconnected ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full">
                    <WifiOff className="w-2.5 h-2.5" />
                    <span>منقطع {gracePeriodRemaining !== null && `(${gracePeriodRemaining}ث)`}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <Wifi className="w-2.5 h-2.5" />
                    <span>متصل</span>
                  </span>
                )}
              </div>
              <div className="text-[11px] text-white/50">
                المحاولات: {attemptsCount} / {maxAttempts} • النقاط: {opp.totalScore}
              </div>
            </div>
          </div>

          <div>
            {opp.hasSolved ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>حل الكلمة!</span>
              </span>
            ) : opp.hasExhausted ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>استنفد</span>
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-xl animate-pulse">
                يفكر ويخمّن...
              </span>
            )}
          </div>
        </div>

        {/* Mini preview of opponent guesses (compact on mobile, matrix on desktop) */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 pt-1.5 border-t border-white/10">
          {Array.from({ length: maxAttempts }).map((_, rIdx) => {
            const evalRow = opp.currentEvaluations[rIdx];
            const isRowDone = Boolean(evalRow);
            const hasCorrect = evalRow && evalRow.some((s) => s === 'CORRECT');
            const hasPresent = evalRow && evalRow.some((s) => s === 'PRESENT');
            return (
              <div
                key={rIdx}
                title={`المحاولة ${rIdx + 1}`}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  !isRowDone
                    ? 'bg-white/10'
                    : hasCorrect
                    ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50'
                    : hasPresent
                    ? 'bg-amber-400'
                    : 'bg-white/30'
                }`}
              />
            );
          })}
        </div>

        <div className="hidden sm:flex flex-col gap-1 pt-1.5 border-t border-white/10">
          {Array.from({ length: maxAttempts }).map((_, rIdx) => {
            const evalRow = opp.currentEvaluations[rIdx];
            const isRowDone = Boolean(evalRow);

            return (
              <div key={rIdx} className="flex justify-center gap-1">
                {Array.from({ length: wordLength }).map((_, cIdx) => {
                  const state = evalRow ? evalRow[cIdx] : 'EMPTY';
                  let dotClass = 'bg-white/10';

                  if (isRowDone) {
                    if (state === 'CORRECT') dotClass = 'bg-emerald-400 shadow-xs shadow-emerald-400/50';
                    else if (state === 'PRESENT') dotClass = 'bg-amber-400 shadow-xs shadow-amber-400/50';
                    else dotClass = 'bg-white/20';
                  }

                  return (
                    <div
                      key={cIdx}
                      className={`w-3.5 h-1.5 sm:w-4 sm:h-2 rounded-xs transition-colors ${dotClass}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Multi-opponent deck (2 to 9 opponents)
  const solvedCount = opponentList.filter((p) => p.hasSolved).length;

  return (
    <div
      id="multi-opponent-progress-card"
      className="bg-white/[0.04] backdrop-blur-2xl rounded-2xl p-3 border border-white/10 shadow-lg flex flex-col gap-2.5 w-full max-w-md text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white/80">
          <Users className="w-3.5 h-3.5 text-teal-400" />
          <span>المنافسون ({opponentList.length})</span>
        </div>
        <div className="text-[11px] text-white/50">
          حلوها: <span className="text-emerald-400 font-bold">{solvedCount}</span> من <span className="font-bold">{opponentList.length}</span>
        </div>
      </div>

      {/* Opponent chips/grid */}
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
        {opponentList.map((opp) => {
          const isSelected = opp.id === activeOpponent.id;
          return (
            <button
              key={opp.id}
              type="button"
              onClick={() => setSelectedOpponentId(opp.id)}
              className={`flex-1 min-w-[120px] p-2 rounded-xl border text-right transition-all cursor-pointer backdrop-blur-md flex items-center justify-between gap-1.5 ${
                isSelected
                  ? 'bg-emerald-500/20 border-emerald-400/50 shadow-sm'
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08]'
              }`}
            >
              <div className="min-w-0">
                <div className="font-bold text-xs text-white truncate">
                  {opp.nickname}
                </div>
                <div className="text-[10px] text-white/50">
                  {opp.totalScore} نقطة • {opp.currentEvaluations.length}/{maxAttempts}
                </div>
              </div>

              <div>
                {opp.hasSolved ? (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>حل</span>
                  </span>
                ) : opp.hasExhausted ? (
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3" />
                    <span>انتهى</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-amber-300/80 animate-pulse">
                    يفكر...
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mini grid of currently selected opponent */}
      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
        <span className="text-[11px] text-white/50">
          لوحة تخمين: <strong className="text-white">{activeOpponent.nickname}</strong>
        </span>
        <div className="flex gap-1">
          {Array.from({ length: maxAttempts }).map((_, rIdx) => {
            const evalRow = activeOpponent.currentEvaluations[rIdx];
            const isRowDone = Boolean(evalRow);
            const hasGreen = evalRow && evalRow.some((s) => s === 'CORRECT');

            return (
              <div
                key={rIdx}
                title={`المحاولة ${rIdx + 1}`}
                className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center text-[8px] font-bold ${
                  hasGreen
                    ? 'bg-emerald-500 text-white'
                    : isRowDone
                    ? 'bg-amber-500/80 text-white'
                    : 'bg-white/10 text-transparent'
                }`}
              >
                {rIdx + 1}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
