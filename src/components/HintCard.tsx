import React, { useState, useEffect } from 'react';
import { WordHint } from '../shared/types';
import { DifficultyLevel, DIFFICULTY_LABELS } from '../game-engine/training-dataset';
import { Lightbulb, Sparkles, RefreshCw, X, Tag, Lock, Unlock, BookOpen, Compass, Zap, Copy, Check, Eye } from 'lucide-react';
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
  wordLength?: number;
  difficulty?: DifficultyLevel;
  targetWord?: string;
  onRevealAnswer?: () => void;
  onCopyHintOnly?: () => void;
  onCopyHintWithHelpers?: () => void;
  onCopyHintWithAnswer?: () => void;
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
  wordLength,
  difficulty,
  targetWord,
  onRevealAnswer,
  onCopyHintOnly,
  onCopyHintWithHelpers,
  onCopyHintWithAnswer,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(initialExpanded);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

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

  const handleCopy = (type: 'hint' | 'helpers' | 'answer', callback?: () => void) => {
    if (callback) {
      callback();
    }
    setCopiedAction(type);
    setTimeout(() => setCopiedAction(null), 2500);
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

  // During active guessing, NEVER spoil the word! Use hint.hint which is purely descriptive.
  const clueText = hint.hint;

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
            <span className="font-extrabold tracking-tight">تلميح اللغز: تقريب المعنى</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
              <Tag className="h-2.5 w-2.5" />
              {hint.category}
            </span>
            <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.5 rounded-full font-bold">
              تلميح ذكي
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
                      لغز الكلمة وتلميح التقريب
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-400/30">
                      <Zap className="h-3 w-3" />
                      تلميح ذكي
                    </span>
                  </div>
                  <span className="text-[11px] text-white/60">
                    تلميح لغوي وفكري يقرب لك المعنى دون كشف الإجابة، استعن به لتخمين الحروف
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
                  <span>تلميح اللغز الذكي (يقرب المعنى دون حرق الكلمة):</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-200 border border-amber-400/30">
                    <span>{hint.icon || '🏷️'}</span>
                    <span>المجال: {hint.category}</span>
                  </span>
                  {difficulty && DIFFICULTY_LABELS[difficulty] && (
                    <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs font-bold">
                      {DIFFICULTY_LABELS[difficulty].badge}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white/80 text-xs font-mono font-bold">
                    {wordLength || 5} أحرف
                  </span>
                </div>
              </div>

              {/* The Dictionary Definition Quote Box */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-amber-400/20 shadow-inner">
                <p className="text-sm sm:text-base font-bold leading-relaxed text-amber-100/95 tracking-wide">
                  "{clueText}"
                </p>
              </div>

              <div className="text-[11px] text-white/50 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>لغز دلالي وتلميح فكري يقرب الحل، استعن به وبكشف الحروف المساعدة لمعرفة الكلمة.</span>
              </div>
            </div>

            {/* Quick Copy & Reveal Actions Bar */}
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between text-xs font-bold text-white/70">
                <span className="flex items-center gap-1">
                  <Copy className="w-3.5 h-3.5 text-teal-400" />
                  <span>خيارات النسخ والمشاركة:</span>
                </span>
                {copiedAction && (
                  <span className="text-[11px] text-emerald-300 font-bold flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>تم النسخ للحافظة بنجاح!</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {onCopyHintOnly && (
                  <button
                    type="button"
                    onClick={() => handleCopy('hint', onCopyHintOnly)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white/90 font-bold text-xs cursor-pointer transition-all active:scale-95"
                    title="نسخ التلميح والمجال والمعنى فقط"
                  >
                    <Copy className="w-3 h-3 text-amber-300" />
                    <span>نسخ التلميح</span>
                  </button>
                )}

                {onCopyHintWithHelpers && (
                  <button
                    type="button"
                    onClick={() => handleCopy('helpers', onCopyHintWithHelpers)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/30 text-teal-200 font-bold text-xs cursor-pointer transition-all active:scale-95"
                    title="نسخ التلميح مع الحرف الأول والأخير وعدد الحروف"
                  >
                    <Sparkles className="w-3 h-3 text-teal-300" />
                    <span>نسخ + الحروف المساعدة</span>
                  </button>
                )}

                {onCopyHintWithAnswer && (
                  <button
                    type="button"
                    onClick={() => handleCopy('answer', onCopyHintWithAnswer)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-200 font-bold text-xs cursor-pointer transition-all active:scale-95"
                    title="نسخ التلميح مع الإجابة والحل الكامل"
                  >
                    <Check className="w-3 h-3 text-purple-300" />
                    <span>نسخ + الإجابة</span>
                  </button>
                )}
              </div>

              {onRevealAnswer && (
                <div className="pt-1 border-t border-white/10 mt-1 flex items-center justify-between">
                  <span className="text-[11px] text-white/50">هل استعصت عليك الكلمة وتريد معرفة الحل؟</span>
                  <button
                    type="button"
                    onClick={() => {
                      onRevealAnswer();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-300 hover:text-white text-xs font-bold cursor-pointer transition-all active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>كشف الإجابة</span>
                  </button>
                </div>
              )}
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
                      <span>الحرف الأخير من الكلمة هو: <strong className="text-white text-sm bg-emerald-600/50 px-2 py-0.5 rounded-md">"{hint.lastLetter || (targetWord ? targetWord[targetWord.length - 1] : '')}"</strong></span>
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
