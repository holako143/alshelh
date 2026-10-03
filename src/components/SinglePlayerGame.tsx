import React, { useState, useEffect, useCallback } from 'react';
import { GameBoard } from './GameBoard';
import { ArabicKeyboard } from './ArabicKeyboard';
import { HintCard } from './HintCard';
import { THEME_DEFINITIONS } from '../game-engine/words-data';
import {
  TrainingWordItem,
  DifficultyLevel,
  DIFFICULTY_LABELS,
  getFilteredTrainingWords,
  formatCopyHintOnly,
  formatCopyHintWithHelperLetters,
  formatCopyHintWithAnswer,
} from '../game-engine/training-dataset';
import { validateGuessWord } from '../game-engine/word-validator';
import { evaluateGuess, isWordSolved } from '../game-engine/guess-evaluator';
import { TileState, WordHint } from '../shared/types';
import { ARABIC_LETTERS_SET } from '../shared/constants';
import { soundManager } from '../lib/audio';
import { fireWinConfetti } from '../lib/confetti';
import {
  RotateCcw,
  Home,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  SlidersHorizontal,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface SinglePlayerGameProps {
  onBackToLobby: () => void;
  colorBlindMode: boolean;
}

const LETTER_COUNT_OPTIONS = [
  { value: 0, label: 'الكل (عشوائي)' },
  { value: 3, label: '3 أحرف' },
  { value: 4, label: '4 أحرف' },
  { value: 5, label: '5 أحرف' },
  { value: 6, label: '6 أحرف' },
  { value: 7, label: '7 أحرف' },
];

const DIFFICULTY_OPTIONS: { id: DifficultyLevel | 'ALL'; label: string; icon: string }[] = [
  { id: 'ALL', label: 'كل المستويات', icon: '🌟' },
  { id: 'easy', label: 'سهل', icon: '🟢' },
  { id: 'medium', label: 'متوسط', icon: '🟡' },
  { id: 'hard', label: 'صعب', icon: '🔴' },
  { id: 'expert', label: 'خبير / فائق', icon: '🟣' },
];

export const SinglePlayerGame: React.FC<SinglePlayerGameProps> = ({
  onBackToLobby,
  colorBlindMode,
}) => {
  // Settings & Filter states
  const [selectedTheme, setSelectedTheme] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'ALL'>('ALL');
  const [selectedLength, setSelectedLength] = useState<number>(5); // default 5 letters
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

  // Solved counter & anti-repetition memory
  const [seenWords, setSeenWords] = useState<Set<string>>(new Set());
  const [questionsCount, setQuestionsCount] = useState<number>(1);
  const [solvedCount, setSolvedCount] = useState<number>(0);

  // Game state
  const [targetWord, setTargetWord] = useState<string>('');
  const [wordLength, setWordLength] = useState<number>(5);
  const [trainingItem, setTrainingItem] = useState<TrainingWordItem | null>(null);
  const [currentHint, setCurrentHint] = useState<WordHint | null>(null);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<TileState[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [showRevealConfirm, setShowRevealConfirm] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, TileState>>({});
  const [jokersRemaining, setJokersRemaining] = useState<number>(1);
  const [isHintModalOpen, setIsHintModalOpen] = useState<boolean>(false);
  const [isCopyDropdownOpen, setIsCopyDropdownOpen] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Helper to show temporary toast
  const triggerCopyToast = (message: string) => {
    setCopyToast(message);
    setTimeout(() => {
      setCopyToast(null);
    }, 2800);
  };

  // Safe clipboard copy
  const copyToClipboard = async (text: string, successMsg: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      triggerCopyToast(successMsg);
      soundManager.playKeypress();
      setIsCopyDropdownOpen(false);
    } catch {
      triggerCopyToast('تعذر النسخ إلى الحافظة تلقائياً');
    }
  };

  const handleCopyHintOnly = () => {
    if (!trainingItem) return;
    const text = formatCopyHintOnly(trainingItem);
    copyToClipboard(text, 'تم نسخ التلميح بنجاح! 📋');
  };

  const handleCopyHintWithHelpers = () => {
    if (!trainingItem) return;
    const text = formatCopyHintWithHelperLetters(trainingItem);
    copyToClipboard(text, 'تم نسخ التلميح مع الأحرف المساعدة! 🔤');
  };

  const handleCopyHintWithAnswer = () => {
    if (!trainingItem) return;
    const text = formatCopyHintWithAnswer(trainingItem);
    copyToClipboard(text, 'تم نسخ التلميح مع الإجابة والشرح! 🎯');
  };

  // Start new question with strict anti-repetition filter
  const startNewGame = useCallback((override?: { theme?: string; difficulty?: DifficultyLevel | 'ALL'; length?: number }) => {
    const activeTheme = override?.theme !== undefined ? override.theme : selectedTheme;
    const activeDifficulty = override?.difficulty !== undefined ? override.difficulty : selectedDifficulty;
    const activeLength = override?.length !== undefined ? override.length : selectedLength;

    const pool = getFilteredTrainingWords({
      length: activeLength > 0 ? activeLength : undefined,
      difficulty: activeDifficulty,
      themeId: activeTheme,
    });

    // Ensure zero duplicate repetition: filter out words already seen in current session
    let available = pool.filter((item) => !seenWords.has(item.word));
    if (available.length === 0) {
      // If all words in this filter were explored, reset the seen cache for fresh repetition
      available = pool;
      setSeenWords(new Set());
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    const item = available[randomIndex] || pool[0];

    setSeenWords((prev) => {
      const next = new Set(prev);
      next.add(item.word);
      return next;
    });

    setTrainingItem(item);
    setTargetWord(item.word);
    setWordLength(item.word.length);

    setCurrentHint({
      category: item.category,
      hint: item.hint,
      dictionaryMeaning: item.dictionaryMeaning || item.hint,
      icon: item.icon,
      firstLetter: item.word[0],
      lastLetter: item.word[item.word.length - 1],
    });

    setGuesses([]);
    setEvaluations([]);
    setCurrentGuess('');
    setIsSolved(false);
    setIsGameOver(false);
    setIsAnswerRevealed(false);
    setShowRevealConfirm(false);
    setIsShaking(false);
    setErrorMessage(null);
    setLetterStatuses({});
    setJokersRemaining(1);
    setIsHintModalOpen(false);
    setIsCopyDropdownOpen(false);
    setQuestionsCount((prev) => prev + 1);
  }, [selectedTheme, selectedDifficulty, selectedLength, seenWords]);

  // Initial load
  useEffect(() => {
    startNewGame();
  }, []);

  // Reveal Answer action
  const handleRevealAnswer = () => {
    setIsAnswerRevealed(true);
    setIsGameOver(true);
    setShowRevealConfirm(false);
    soundManager.playHintReveal();
    triggerCopyToast(`تم كشف الكلمة: "${targetWord}" 👁️`);
  };

  const handleUseJoker = () => {
    if (jokersRemaining <= 0 || isGameOver || isSolved) return;
    const secretLetters = new Set(targetWord.split(''));
    const guessedLetters = new Set(guesses.join('').split(''));
    const candidates = Array.from(ARABIC_LETTERS_SET).filter(
      (ch) => !secretLetters.has(ch) && !guessedLetters.has(ch) && !letterStatuses[ch]
    );

    const shuffled = candidates.sort(() => Math.random() - 0.5);
    const eliminated = shuffled.slice(0, 3);

    const updated = { ...letterStatuses };
    eliminated.forEach((ch) => {
      updated[ch] = 'ABSENT';
    });

    setLetterStatuses(updated);
    setJokersRemaining((prev) => Math.max(0, prev - 1));
    soundManager.playJokerPowerUp();
  };

  const updateKeyboardStatus = (word: string, evalResult: TileState[]) => {
    const updated = { ...letterStatuses };
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const newStatus = evalResult[i];
      const oldStatus = updated[char];

      if (newStatus === 'CORRECT') {
        updated[char] = 'CORRECT';
      } else if (newStatus === 'PRESENT' && oldStatus !== 'CORRECT') {
        updated[char] = 'PRESENT';
      } else if (newStatus === 'ABSENT' && !oldStatus) {
        updated[char] = 'ABSENT';
      }
    }
    setLetterStatuses(updated);
  };

  const handleChar = (char: string) => {
    if (isGameOver || isSolved) return;
    if (currentGuess.length >= wordLength) return;
    setCurrentGuess((prev) => prev + char);
    setErrorMessage(null);
  };

  const handleDelete = () => {
    if (isGameOver || isSolved) return;
    setCurrentGuess((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleEnter = () => {
    if (isGameOver || isSolved) return;

    if (currentGuess.length < wordLength) {
      setErrorMessage(`يجب إكمال ${wordLength} أحرف أولاً`);
      triggerShake();
      return;
    }

    const validation = validateGuessWord(currentGuess, false, wordLength);
    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage || 'الكلمة غير صالحة');
      triggerShake();
      soundManager.playInvalidWord();
      return;
    }

    const evalResult = evaluateGuess(targetWord, validation.normalizedWord);
    const solved = isWordSolved(evalResult);

    const newGuesses = [...guesses, validation.normalizedWord];
    const newEvals = [...evaluations, evalResult];

    setGuesses(newGuesses);
    setEvaluations(newEvals);
    setCurrentGuess('');
    updateKeyboardStatus(validation.normalizedWord, evalResult);

    if (solved) {
      setIsSolved(true);
      setIsGameOver(true);
      setSolvedCount((prev) => prev + 1);
      soundManager.playGuessEvaluation(evalResult);
      setTimeout(() => {
        soundManager.playRoundWin();
      }, 500);
      fireWinConfetti();
    } else if (newGuesses.length >= 8) {
      setIsGameOver(true);
      soundManager.playGuessEvaluation(evalResult);
      setTimeout(() => {
        soundManager.playRoundLoss();
      }, 600);
    } else {
      soundManager.playGuessEvaluation(evalResult);
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const currentDiffBadge = trainingItem?.difficulty
    ? DIFFICULTY_LABELS[trainingItem.difficulty]
    : null;

  const currentThemeObj = THEME_DEFINITIONS.find((t) => t.id === selectedTheme);

  return (
    <div id="single-player-container" className="flex flex-col w-full max-w-lg mx-auto px-2 sm:px-3 py-2 gap-2 text-white">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600/95 backdrop-blur-md text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-2xl shadow-2xl border border-emerald-300/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Main Top Header: Compact Status & Super Easy Question Switcher */}
      <div className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-white/[0.05] backdrop-blur-md border border-white/10 shadow-lg">
        {/* Row 1: Direct "السؤال التالي" Button & Status Badges */}
        <div className="flex items-center justify-between gap-2">
          {/* Quick "السؤال التالي" Button - Always visible, highly accessible */}
          <button
            type="button"
            id="btn-next-question-top"
            onClick={() => startNewGame()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-500/20 border border-emerald-300/30 cursor-pointer transition-all shrink-0"
            title="تخطي الكلمة والانتقال لسؤال تدريب جديد فوراً"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>سؤال جديد ⏭️</span>
          </button>

          {/* Current Question Badges Summary */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span className="text-[11px] px-2 py-1 rounded-lg bg-teal-500/20 text-teal-200 border border-teal-400/30 font-bold font-mono">
              {wordLength} أحرف
            </span>
            {currentDiffBadge && (
              <span className="text-[11px] px-2 py-1 rounded-lg bg-purple-500/25 border border-purple-400/30 text-purple-200 font-bold">
                {currentDiffBadge.badge}
              </span>
            )}
            <span className="text-[11px] px-2 py-1 rounded-lg bg-white/10 text-white/70 font-bold">
              {currentThemeObj?.icon} {currentThemeObj?.name.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Row 2: Secondary Quick Actions & Filter Expand Toggle */}
        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/10 text-xs">
          {/* Hint Modal Button */}
          <button
            type="button"
            onClick={() => setIsHintModalOpen(true)}
            className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
            title="عرض معجم وتلميح الكلمة"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>المعجم والتلميح</span>
          </button>

          {/* Reveal Answer Button */}
          <button
            type="button"
            onClick={() => {
              if (isAnswerRevealed || isGameOver) {
                handleRevealAnswer();
              } else {
                setShowRevealConfirm(true);
              }
            }}
            className={`py-1.5 px-2.5 rounded-xl border font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
              isAnswerRevealed
                ? 'bg-rose-500/30 border-rose-400/50 text-rose-200'
                : 'bg-white/[0.06] hover:bg-rose-500/20 border-white/15 hover:border-rose-400/30 text-white/80 hover:text-rose-200'
            }`}
            title="كشف الكلمة السرية"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>كشف الإجابة</span>
          </button>

          {/* Copy Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCopyDropdownOpen((prev) => !prev)}
              className="py-1.5 px-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white/90 font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
              title="نسخ التلميح والحل"
            >
              <Copy className="w-3.5 h-3.5 text-teal-300" />
              <span>نسخ</span>
              <ChevronDown className="w-3 h-3 text-white/50" />
            </button>

            {isCopyDropdownOpen && (
              <div className="absolute left-0 mt-1 z-40 w-52 rounded-2xl bg-[#0c1022]/95 backdrop-blur-2xl border border-white/20 p-1.5 shadow-2xl flex flex-col gap-1 text-right animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={handleCopyHintOnly}
                  className="w-full text-right px-3 py-1.5 rounded-xl hover:bg-white/10 text-white text-xs font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>📄 نسخ التلميح</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyHintWithHelpers}
                  className="w-full text-right px-3 py-1.5 rounded-xl hover:bg-teal-500/20 text-teal-200 text-xs font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>🔤 نسخ + الحروف</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyHintWithAnswer}
                  className="w-full text-right px-3 py-1.5 rounded-xl hover:bg-purple-500/20 text-purple-200 text-xs font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>🎯 نسخ + الإجابة</span>
                </button>
              </div>
            )}
          </div>

          {/* Expand/Collapse Filters Toggle */}
          <button
            type="button"
            onClick={() => setIsFiltersOpen((prev) => !prev)}
            className={`py-1.5 px-2 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-all ${
              isFiltersOpen
                ? 'bg-purple-600/30 text-purple-200 border border-purple-400/40'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/70 border border-white/15'
            }`}
            title="تخصيص مستويات الصعوبة وعدد الحروف والمجال"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>فلاتر</span>
            {isFiltersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Filter Panel (Saves Screen Space, Smoothly Toggleable) */}
        {isFiltersOpen && (
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
            {/* 1. Difficulty Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] no-scrollbar">
              <span className="text-white/50 shrink-0 text-[10px] font-bold">الصعوبة:</span>
              {DIFFICULTY_OPTIONS.map((diff) => {
                const isSelected = selectedDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => {
                      setSelectedDifficulty(diff.id);
                      startNewGame({ difficulty: diff.id });
                    }}
                    className={`px-2 py-1 rounded-xl font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-purple-600/50 text-white border border-purple-300 shadow-sm'
                        : 'bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/15 border border-transparent'
                    }`}
                  >
                    <span>{diff.icon}</span>
                    <span>{diff.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 2. Letter Count Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] no-scrollbar">
              <span className="text-white/50 shrink-0 text-[10px] font-bold">الحروف:</span>
              {LETTER_COUNT_OPTIONS.map((opt) => {
                const isSelected = selectedLength === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedLength(opt.value);
                      startNewGame({ length: opt.value });
                    }}
                    className={`px-2.5 py-1 rounded-xl font-bold shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/50 text-white border border-teal-300 shadow-sm'
                        : 'bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/15 border border-transparent'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 3. Theme Category Selector */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] no-scrollbar">
              <span className="text-white/50 shrink-0 text-[10px] font-bold">المجال:</span>
              {THEME_DEFINITIONS.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setSelectedTheme(theme.id);
                      startNewGame({ theme: theme.id });
                    }}
                    className={`px-2 py-0.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500/40 text-amber-100 border border-amber-300'
                        : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <span>{theme.icon}</span>
                    <span>{theme.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal to Reveal Answer */}
      {showRevealConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0e122b] border border-rose-400/40 rounded-3xl p-5 max-w-sm w-full text-center flex flex-col gap-3 shadow-2xl animate-in zoom-in-95 text-white">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center mx-auto border border-rose-400/30">
              <Eye className="w-6 h-6" />
            </div>
            <div className="text-base font-black text-rose-200">هل ترغب في كشف الإجابة السرية؟</div>
            <p className="text-xs text-white/70 leading-relaxed">
              سيتم كشف الكلمة الصحيحة فوراً مع شرحها الكامل في المعجم العربي.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleRevealAnswer}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer transition-all"
              >
                نعم، اكشف الإجابة
              </button>
              <button
                type="button"
                onClick={() => setShowRevealConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-all"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="bg-rose-500/90 backdrop-blur-md border border-rose-300/40 text-white text-xs font-bold py-1.5 px-4 rounded-full mx-auto shadow-lg animate-bounce">
          {errorMessage}
        </div>
      )}

      {/* Semantic Clue Banner (Compact, readable, direct) */}
      {currentHint && (
        <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/[0.12] via-white/[0.03] to-orange-500/[0.12] p-3 text-right backdrop-blur-md flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <span>{currentHint.icon || '🏷️'}</span>
              <span>تلميح المعنى ({currentHint.category}):</span>
            </div>
            <span className="text-[11px] text-white/50 font-mono">
              محاولة {guesses.length} / 8
            </span>
          </div>
          <p className="text-sm font-bold text-amber-100/95 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-amber-400/20">
            "{currentHint.dictionaryMeaning || currentHint.hint}"
          </p>
        </div>
      )}

      {/* Revealed Answer Box (shown on demand or loss) */}
      {isAnswerRevealed && (
        <div className="bg-gradient-to-r from-rose-950/50 via-purple-950/50 to-slate-900/70 backdrop-blur-xl border border-rose-400/40 rounded-2xl p-3 shadow-xl text-right flex flex-col gap-2 animate-in zoom-in-95">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-rose-400" />
              <span>الكلمة السرية المكشوفة:</span>
            </span>
            <span className="text-[11px] font-mono bg-rose-500/20 text-rose-200 border border-rose-400/30 px-2 py-0.5 rounded-lg">
              {wordLength} أحرف
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-300 tracking-wider bg-black/50 px-4 py-1.5 rounded-xl border border-emerald-400/40 shadow-inner">
              {targetWord}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyHintWithAnswer}
                className="p-2 rounded-xl bg-purple-500/25 hover:bg-purple-500/40 text-purple-200 border border-purple-400/30 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                title="نسخ التلميح مع الإجابة"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ الحل</span>
              </button>
              <button
                type="button"
                onClick={() => startNewGame()}
                className="p-2 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-400/30 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                title="سؤال تدريب جديد"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>سؤال جديد</span>
              </button>
            </div>
          </div>
          {trainingItem?.dictionaryMeaning && (
            <div className="text-xs text-white/80 leading-relaxed border-t border-white/10 pt-1.5 font-medium">
              📖 <span className="font-bold text-amber-200">الشرح:</span> {trainingItem.dictionaryMeaning}
            </div>
          )}
        </div>
      )}

      {/* Wordle Board with dynamic wordLength */}
      <div className="flex items-center justify-center my-auto py-2">
        <GameBoard
          guesses={guesses}
          evaluations={evaluations}
          currentGuess={currentGuess}
          maxAttempts={8}
          wordLength={wordLength}
          isShaking={isShaking}
          colorBlindMode={colorBlindMode}
        />
      </div>

      {/* Game Over / Win Banner */}
      {isGameOver && !isAnswerRevealed && (
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/15 rounded-3xl p-4 shadow-2xl text-center flex flex-col gap-3 my-1 animate-in zoom-in-95 text-white">
          <div className="flex items-center justify-center gap-2">
            {isSolved ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <span className="text-lg font-black text-emerald-300">أحسنت! تم حل الكلمة بنجاح!</span>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-rose-400" />
                <span className="text-lg font-black text-rose-300">انتهت المحاولات!</span>
              </>
            )}
          </div>

          <div className="text-sm font-bold text-white/80">
            الكلمة السرية هي:{' '}
            <span className="text-emerald-300 font-extrabold text-base bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-xl">
              {targetWord}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              id="btn-play-again"
              type="button"
              onClick={() => startNewGame()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/25 border border-white/20 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>سؤال جديد</span>
            </button>
            <button
              id="btn-exit-solo"
              type="button"
              onClick={onBackToLobby}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer backdrop-blur-md transition-all"
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>
          </div>
        </div>
      )}

      {/* Keyboard with comfortable mobile elevation */}
      <div
        className="w-full pt-1 pb-16 sm:pb-20 transition-all"
        style={{ paddingBottom: 'max(4.5rem, env(safe-area-inset-bottom, 3.5rem))' }}
      >
        <ArabicKeyboard
          onChar={handleChar}
          onDelete={handleDelete}
          onEnter={handleEnter}
          letterStatuses={letterStatuses}
          disabled={isGameOver}
          onUseJoker={handleUseJoker}
          jokersRemaining={jokersRemaining}
          jokerEliminateCount={3}
          onOpenHint={currentHint ? () => setIsHintModalOpen(true) : undefined}
        />
      </div>

      {/* Hint Modal Card when triggered */}
      {currentHint && (
        <HintCard
          hint={currentHint}
          allowNewWord={true}
          onNewWord={() => startNewGame()}
          attemptsCount={guesses.length}
          initialExpanded={false}
          isOpenControlled={isHintModalOpen}
          onToggleControlled={setIsHintModalOpen}
          showTriggerButton={false}
          wordLength={wordLength}
          difficulty={trainingItem?.difficulty}
          targetWord={targetWord}
          onRevealAnswer={handleRevealAnswer}
          onCopyHintOnly={handleCopyHintOnly}
          onCopyHintWithHelpers={handleCopyHintWithHelpers}
          onCopyHintWithAnswer={handleCopyHintWithAnswer}
        />
      )}
    </div>
  );
};
