import React, { useState } from 'react';
import { WordHint } from '../shared/types';
import { Lightbulb, Sparkles, RefreshCw, X, Tag, Lock, Unlock, ChevronDown } from 'lucide-react';

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
  initialExpanded = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialExpanded);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);

  if (!hint) {
    return null;
  }

  // Calculate current accessible progressive level based on attempts count or manual unlocks
  const autoLevel = attemptsCount >= 4 ? 3 : attemptsCount >= 2 ? 2 : 1;
  const currentLevel = Math.max(unlockedLevel, autoLevel);

  return (
    <>
      {/* Floating Aesthetic Trigger Pill (Compact, takes minimal space, mobile-optimized) */}
      <div id="word-hint-floating-trigger" className={`flex items-center justify-center ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/25 via-white/[0.06] to-orange-500/25 backdrop-blur-xl border border-amber-400/40 text-amber-200 hover:text-white font-bold text-xs shadow-lg shadow-amber-500/15 hover:shadow-amber-500/30 hover:border-amber-400/70 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="افتح نظام التلميحات التدريجي"
          aria-label="افتح نظام التلميحات"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/30 text-amber-300 text-xs ring-1 ring-amber-400/50 group-hover:rotate-12 transition-transform">
            {hint.icon || '💡'}
          </span>
          <span className="font-extrabold tracking-tight">تلميح الكلمة</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
            <Tag className="h-2.5 w-2.5" />
            {hint.category}
          </span>
          <span className="text-[10px] bg-white/15 text-white/90 px-1.5 py-0.5 rounded-full font-mono">
            {currentLevel}/3
          </span>
        </button>
      </div>

      {/* Floating Glassmorphism Modal / Drawer Card */}
      {isOpen && (
        <div
          id="hint-floating-backdrop"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            id="hint-floating-modal"
            className="relative w-full max-w-md bg-[#0a0d1d]/95 backdrop-blur-2xl border border-amber-400/40 rounded-3xl p-5 shadow-2xl shadow-black/90 ring-1 ring-amber-400/20 text-right flex flex-col gap-3.5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl shadow-inner ring-1 ring-amber-400/40">
                  {hint.icon || '💡'}
                </span>
                <div className="flex flex-col text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-amber-300">
                      نظام التلميحات التدريجي
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-bold text-amber-200 border border-amber-400/30">
                      <Tag className="h-2.5 w-2.5" />
                      {hint.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-white/50">
                    تتطور التلميحات لتسهيل تخمين الكلمة
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {allowNewWord && onNewWord && (
                  <button
                    id="change-word-hint-btn"
                    onClick={() => {
                      onNewWord();
                      setIsOpen(false);
                    }}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                    title="تغيير الكلمة"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>تغيير</span>
                  </button>
                )}

                <button
                  id="close-hint-modal-btn"
                  onClick={() => setIsOpen(false)}
                  type="button"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                  aria-label="إغلاق التلميح"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Level Selector Tabs */}
            <div className="flex items-center gap-1.5 w-full text-[11px]">
              {/* Level 1 Pill */}
              <div
                className={`flex-1 py-1.5 px-2 rounded-xl text-center font-bold transition-all ${
                  currentLevel >= 1
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40 shadow-xs'
                    : 'bg-white/5 text-white/40'
                }`}
              >
                1. الوصف العام
              </div>

              {/* Level 2 Pill */}
              <button
                type="button"
                onClick={() => setUnlockedLevel(Math.max(unlockedLevel, 2))}
                className={`flex-1 py-1.5 px-2 rounded-xl text-center font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  currentLevel >= 2
                    ? 'bg-teal-500/25 text-teal-200 border border-teal-400/40 shadow-xs'
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
                className={`flex-1 py-1.5 px-2 rounded-xl text-center font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  currentLevel >= 3
                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-xs'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {currentLevel >= 3 ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                <span>3. الحسم</span>
              </button>
            </div>

            {/* Hint Details Container */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-right backdrop-blur-md flex flex-col gap-2.5">
              {/* Level 1 Content */}
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-400/20">
                <span className="text-amber-400 font-black text-sm mt-0.5">●</span>
                <p className="text-xs sm:text-sm font-bold leading-relaxed text-white/95">
                  {hint.hint}
                </p>
              </div>

              {/* Level 2 Content */}
              {currentLevel >= 2 ? (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-teal-500/20 border border-teal-400/40 text-xs font-bold text-teal-200 animate-tile-pop">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-300" />
                    <span>الحرف الأول: <strong className="text-white text-sm">"{hint.firstLetter}"</strong></span>
                  </div>
                  <span className="text-[10px] text-teal-300/80 font-normal">تلميح البداية</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white/50">
                  <span>تلميح المستوى 2 يُفتح بعد محاولتين</span>
                  <button
                    type="button"
                    onClick={() => setUnlockedLevel(2)}
                    className="text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer"
                  >
                    كشف الآن
                  </button>
                </div>
              )}

              {/* Level 3 Content */}
              {currentLevel >= 3 ? (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs font-bold text-emerald-200 animate-tile-pop">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-emerald-300" />
                    <span>
                      الحرف الأخير: <strong className="text-white text-sm">"{hint.lastLetter || hint.hint.slice(-1)}"</strong> (يبدأ بـ {hint.firstLetter})
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-300/80 font-normal">تلميح الحسم</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white/50">
                  <span>تلميح المستوى 3 يُفتح بعد 4 محاولات</span>
                  <button
                    type="button"
                    onClick={() => setUnlockedLevel(3)}
                    className="text-emerald-300 hover:text-emerald-200 font-bold underline cursor-pointer"
                  >
                    كشف الآن
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer text-center"
              >
                فهمت، العودة إلى اللوحة للتخمين
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
