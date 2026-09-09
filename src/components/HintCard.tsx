import React, { useState, useEffect } from 'react';
import { WordHint } from '../shared/types';
import { Lightbulb, Sparkles, RefreshCw, X, Tag, Lock, Unlock, BookOpen, Compass, Zap } from 'lucide-react';
import { soundManager } from '../lib/audio';

interface HintCardProps {
  hint?: WordHint | null;
  allowNewWord?: boolean;
  onNewWord?: () => void;
  className?: string;
  attemptsCount?: number;
  initialExpanded?: boolean;
  isOpenControlled?: boolean;
  onToggleControlled?: (open: boolean) => void;
  showTriggerButton?: boolean;
}

export const HintCard: React.FC<HintCardProps> = ({
  hint,
  allowNewWord = false,
  onNewWord,
  className = '',
  attemptsCount = 0,
  initialExpanded = false,
  isOpenControlled,
  onToggleControlled,
  showTriggerButton = true,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(initialExpanded);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);

  const isControlled = isOpenControlled !== undefined;
  const isOpen = isControlled ? isOpenControlled : internalIsOpen;

  const setIsOpen = (val: boolean) => {
    if (val) {
      soundManager.playHintReveal();
    }
    if (isControlled && onToggleControlled) {
      onToggleControlled(val);
    } else {
      setInternalIsOpen(val);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!hint) {
    return null;
  }

  // Calculate current accessible progressive level based on attempts count or manual unlocks
  const autoLevel = attemptsCount >= 4 ? 3 : attemptsCount >= 2 ? 2 : 1;
  const currentLevel = Math.max(unlockedLevel, autoLevel);

  const meaningText = hint.dictionaryMeaning || hint.hint;

  return (
    <>
      {/* Floating Aesthetic Competitive Trigger Pill */}
      {showTriggerButton && (
        <div id="word-hint-floating-trigger" className={`flex items-center justify-center ${className}`}>
          <button
            id="btn-dictionary-hint-trigger"
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/25 via-white/[0.06] to-orange-500/25 backdrop-blur-xl border border-amber-400/40 text-amber-200 hover:text-white font-bold text-xs shadow-lg shadow-amber-500/15 hover:shadow-amber-500/30 hover:border-amber-400/70 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="إظهار معنى الكلمة من القاموس (مساعدة تنافسية)"
            aria-label="إظهار معنى الكلمة من القاموس"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/30 text-amber-300 text-xs ring-1 ring-amber-400/50 group-hover:rotate-12 transition-transform">
              <BookOpen className="w-3 h-3 text-amber-200" />
            </span>
            <span className="font-extrabold tracking-tight">تلميح القاموس: معنى الكلمة</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
              <Tag className="h-2.5 w-2.5" />
              {hint.category}
            </span>
            <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.5 rounded-full font-bold">
              مساعدة تنافسية
            </span>
          </button>
        </div>
      )}

      {/* Floating Glassmorphism Modal / Drawer Card */}
      {isOpen && (
        <div
          id="hint-floating-backdrop"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            id="hint-floating-modal"
            className="relative w-full max-w-lg bg-[#0a0d1d]/95 backdrop-blur-2xl border border-amber-400/40 rounded-3xl p-5 shadow-2xl shadow-black/90 ring-1 ring-amber-400/20 text-right flex flex-col gap-4 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-600/20 text-amber-300 shadow-inner ring-1 ring-amber-400/40">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex flex-col text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-amber-300">
                      معجم الكلمات وتلميح المعنى
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-400/30">
                      <Zap className="h-3 w-3" />
                      مساعدة تنافسية
                    </span>
                  </div>
                  <span className="text-[11px] text-white/60">
                    تعريف لغوي مبسط من القاموس لمساعدتك في استنتاج الكلمة
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

            {/* Main Featured Dictionary Definition Card */}
            <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-b from-amber-500/[0.12] to-white/[0.03] p-4 text-right backdrop-blur-md flex flex-col gap-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Compass className="w-4 h-4" />
                  <span>المعنى في المعجم والقاموس العربي:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-200 border border-amber-400/30">
                    <span>{hint.icon || '🏷️'}</span>
                    <span>المجال: {hint.category}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white/80 text-xs font-mono font-bold">
                    5 أحرف
                  </span>
                </div>
              </div>

              {/* The Dictionary Definition Quote Box */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-amber-400/20 shadow-inner">
                <p className="text-sm sm:text-base font-bold leading-relaxed text-amber-100/95 tracking-wide">
                  "{meaningText}"
                </p>
              </div>

              <div className="text-[11px] text-white/50 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>استعن بهذا التعريف لمعرفة دلالة الكلمة وتخمين حروفها في اللوحة.</span>
              </div>
            </div>

            {/* Progressive Competitive Letters Clues */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-white/70 px-1">
                <span>المساعدات التنافسية الإضافية (كشف الحروف):</span>
                <span className="text-[11px] text-teal-300 font-mono">المستوى {currentLevel} من 3</span>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1.5 w-full text-[11px]">
                {/* Tab 1: Meaning */}
                <div className="flex-1 py-1.5 px-2 rounded-xl text-center font-bold bg-amber-500/25 text-amber-200 border border-amber-400/40 shadow-xs">
                  1. معنى المعجم
                </div>

                {/* Tab 2: First letter */}
                <button
                  id="btn-hint-unlock-first-letter"
                  type="button"
                  onClick={() => setUnlockedLevel(Math.max(unlockedLevel, 2))}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-center font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    currentLevel >= 2
                      ? 'bg-teal-500/25 text-teal-200 border border-teal-400/40 shadow-xs'
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {currentLevel >= 2 ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                  <span>2. الحرف الأول</span>
                </button>

                {/* Tab 3: Last letter */}
                <button
                  id="btn-hint-unlock-last-letter"
                  type="button"
                  onClick={() => setUnlockedLevel(Math.max(unlockedLevel, 3))}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-center font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    currentLevel >= 3
                      ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-xs'
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {currentLevel >= 3 ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                  <span>3. الحرف الأخير</span>
                </button>
              </div>

              {/* Extra Details Box for Level 2 & 3 */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 flex flex-col gap-2 text-right">
                {currentLevel >= 2 ? (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-teal-500/20 border border-teal-400/30 text-xs font-bold text-teal-200 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-300" />
                      <span>الحرف الأول من الكلمة هو: <strong className="text-white text-sm bg-teal-600/50 px-2 py-0.5 rounded-md">"{hint.firstLetter}"</strong></span>
                    </div>
                    <span className="text-[10px] text-teal-300/80">تلميح البداية</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] text-[11px] text-white/50">
                    <span>يُكشف الحرف الأول تلقائياً بعد محاولتين</span>
                    <button
                      type="button"
                      onClick={() => setUnlockedLevel(2)}
                      className="text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer"
                    >
                      كشف الآن 🔓
                    </button>
                  </div>
                )}

                {currentLevel >= 3 ? (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-200 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-emerald-300" />
                      <span>الحرف الأخير من الكلمة هو: <strong className="text-white text-sm bg-emerald-600/50 px-2 py-0.5 rounded-md">"{hint.lastLetter || hint.hint.slice(-1)}"</strong></span>
                    </div>
                    <span className="text-[10px] text-emerald-300/80">تلميح الحسم</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] text-[11px] text-white/50">
                    <span>يُكشف الحرف الأخير تلقائياً بعد 4 محاولات</span>
                    <button
                      type="button"
                      onClick={() => setUnlockedLevel(3)}
                      className="text-emerald-300 hover:text-emerald-200 font-bold underline cursor-pointer"
                    >
                      كشف الآن 🔓
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end pt-1">
              <button
                id="btn-confirm-return-board"
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-98 text-white font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <span>فهمت المعنى، العودة إلى اللوحة للتخمين 🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
