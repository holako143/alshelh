import React, { useState } from 'react';
import { WordHint } from '../shared/types';
import { Lightbulb, Sparkles, RefreshCw, Eye, EyeOff, Tag, ChevronLeft, Lock, Unlock } from 'lucide-react';

interface HintCardProps {
  hint?: WordHint | null;
  allowNewWord?: boolean;
  onNewWord?: () => void;
  className?: string;
  attemptsCount?: number;
  initialExpanded?: boolean;
}

export const HintCard: React.FC<HintCardProps> = ({
  hint,
  allowNewWord = false,
  onNewWord,
  className = '',
  attemptsCount = 0,
  initialExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);

  if (!hint) {
    return null;
  }

  // Calculate current accessible progressive level based on attempts count or manual unlocks
  const autoLevel = attemptsCount >= 4 ? 3 : attemptsCount >= 2 ? 2 : 1;
  const currentLevel = Math.max(unlockedLevel, autoLevel);

  return (
    <div
      id="word-hint-card"
      className={`relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-white/[0.04] to-orange-500/10 backdrop-blur-xl p-3.5 shadow-lg transition-all duration-300 text-right ${className}`}
    >
      {/* Header bar of Hint Card */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-xl shadow-inner ring-1 ring-amber-400/40">
            {hint.icon || '💡'}
          </span>
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-300">
                نظام التلميحات التدريجي
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-bold text-amber-200 border border-amber-400/30">
                <Tag className="h-2.5 w-2.5" />
                {hint.category}
              </span>
            </div>
            <span className="text-[11px] text-white/50">
              تتطور التلميحات تدريجياً لتسهيل التخمين
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {allowNewWord && onNewWord && (
            <button
              id="change-word-hint-btn"
              onClick={onNewWord}
              type="button"
              className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer shadow-xs"
              title="تغيير الكلمة وتلميحاتها"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>تغيير</span>
            </button>
          )}

          <button
            id="toggle-hint-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
            className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer shadow-xs"
            title={isExpanded ? 'إخفاء التلميح' : 'إظهار التلميح'}
          >
            {isExpanded ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span className="text-[11px]">{isExpanded ? 'طي' : 'عرض'}</span>
          </button>
        </div>
      </div>

      {/* Progressive Stage Pills & Clue Content (Only when expanded) */}
      {isExpanded && (
        <>
          <div className="mt-2.5 flex items-center justify-between gap-1 border-t border-white/10 pt-2 text-[11px]">
            <div className="flex items-center gap-1.5 w-full">
              {/* Level 1 Pill */}
              <div
                className={`flex-1 py-1 px-2 rounded-lg text-center font-bold transition-all ${
                  currentLevel >= 1
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                    : 'bg-white/5 text-white/40'
                }`}
              >
                1. الوصف العام
              </div>

              {/* Level 2 Pill */}
              <button
                type="button"
                onClick={() => setUnlockedLevel(Math.max(unlockedLevel, 2))}
                className={`flex-1 py-1 px-2 rounded-lg text-center font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  currentLevel >= 2
                    ? 'bg-teal-500/25 text-teal-200 border border-teal-400/40'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {currentLevel >= 2 ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                <span>2. البداية</span>
              </button>

              {/* Level 3 Pill */}
              <button
                type="button"
                onClick={() => setUnlockedLevel(Math.max(unlockedLevel, 3))}
                className={`flex-1 py-1 px-2 rounded-lg text-center font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  currentLevel >= 3
                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {currentLevel >= 3 ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                <span>3. الحسم</span>
              </button>
            </div>
          </div>

          <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-right backdrop-blur-md transition-all flex flex-col gap-2">
          {/* Level 1 Content */}
          <div className="flex items-start gap-2">
            <span className="text-amber-400 font-bold text-xs mt-0.5">●</span>
            <p className="text-xs sm:text-sm font-medium leading-relaxed text-white/90">
              {hint.hint}
            </p>
          </div>

          {/* Level 2 Content */}
          {currentLevel >= 2 ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-teal-500/15 border border-teal-400/30 text-xs font-bold text-teal-200 animate-tile-pop">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>الحرف الأول: "{hint.firstLetter}"</span>
              </div>
              <span className="text-[10px] text-teal-300/70 font-normal">تم فتح تلميح البداية</span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-white/40">
              <span>تلميح المستوى 2 يُفتح تلقائياً بعد محاولتين</span>
              <button
                type="button"
                onClick={() => setUnlockedLevel(2)}
                className="text-amber-300 hover:underline font-bold cursor-pointer"
              >
                كشف الآن
              </button>
            </div>
          )}

          {/* Level 3 Content */}
          {currentLevel >= 3 ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-xs font-bold text-emerald-200 animate-tile-pop">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-emerald-300" />
                <span>
                  الحرف الأخير: "{hint.lastLetter || hint.hint.slice(-1)}" (يبدأ بـ {hint.firstLetter})
                </span>
              </div>
              <span className="text-[10px] text-emerald-300/70 font-normal">تلميح الإنقاذ الحاسم</span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-white/40">
              <span>تلميح المستوى 3 يُفتح تلقائياً بعد 4 محاولات</span>
              <button
                type="button"
                onClick={() => setUnlockedLevel(3)}
                className="text-emerald-300 hover:underline font-bold cursor-pointer"
              >
                كشف الآن
              </button>
            </div>
          )}
        </div>
      </>
    )}
  </div>
);
};
