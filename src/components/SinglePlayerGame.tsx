import React, { useState, useEffect, useCallback } from 'react';
import { GameBoard } from './GameBoard';
import { ArabicKeyboard } from './ArabicKeyboard';
import { HintCard } from './HintCard';
import { THEME_DEFINITIONS } from '../game-engine/words-data';
import {
  TrainingWordItem,
  DifficultyLevel,
  DIFFICULTY_LABELS,
  getRandomTrainingWord,
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
  HelpCircle,
  Award,
  ChevronDown,
  BookOpen,
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

const DIFFICULTY_OPTIONS: { id: DifficultyLevel | 'ALL'; label: string; icon: string; color: string }[] = [
  { id: 'ALL', label: 'كل المستويات', icon: '🌟', color: 'from-amber-500/20 to-teal-500/20' },
  { id: 'easy', label: 'سهل', icon: '🟢', color: 'from-emerald-500/20 to-teal-500/20' },
  { id: 'medium', label: 'متوسط', icon: '🟡', color: 'from-amber-500/20 to-orange-500/20' },
  { id: 'hard', label: 'صعب', icon: '🔴', color: 'from-rose-500/20 to-red-500/20' },
  { id: 'expert', label: 'خبير / فائق', icon: '🟣', color: 'from-purple-500/20 to-indigo-500/20' },
];

export const SinglePlayerGame: React.FC<SinglePlayerGameProps> = ({
  onBackToLobby,
  colorBlindMode,
}) => {
  // Settings & Filter states
  const [selectedTheme, setSelectedTheme] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'ALL'>('ALL');
  const [selectedLength, setSelectedLength] = useState<number>(5); // default 5 letters

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
    }, 3000);
  };

  // Safe clipboard copy
  const copyToClipboard = async (text: string, successMsg: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
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

  // Start new question with strict parameter enforcement
  const startNewGame = useCallback((override?: { theme?: string; difficulty?: DifficultyLevel | 'ALL'; length?: number }) => {
    const activeTheme = override?.theme !== undefined ? override.theme : selectedTheme;
    const activeDifficulty = override?.difficulty !== undefined ? override.difficulty : selectedDifficulty;
    const activeLength = override?.length !== undefined ? override.length : selectedLength;

    const item = getRandomTrainingWord({
      length: activeLength > 0 ? activeLength : undefined,
      difficulty: activeDifficulty,
      themeId: activeTheme,
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
  }, [selectedTheme, selectedDifficulty, selectedLength]);

  // Initial load
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Reveal Answer action
  const handleRevealAnswer = () => {
    if (isGameOver && isAnswerRevealed) return;
    setIsAnswerRevealed(true);
    setIsGameOver(true);
    setShowRevealConfirm(false);
    soundManager.playHintReveal();
    triggerCopyToast(`تم كشف الكلمة السرية: "${targetWord}" 👁️`);
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

  return (
    <div id="single-player-container" className="flex flex-col flex-1 min-h-0 max-w-lg mx-auto w-full px-1.5 sm:px-2 py-1.5 sm:py-2.5 justify-between">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600/95 backdrop-blur-md text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-2xl shadow-2xl border border-emerald-300/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Top Filter Controls: Difficulty & Letter Count & Themes */}
      <div className="flex flex-col gap-2 px-3 py-2 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-white/80">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-extrabold text-white">قسم التدريب الفردي المتطور</span>
            {currentDiffBadge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/25 border border-purple-400/40 text-purple-200">
                {currentDiffBadge.badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-[11px]">المحاولات: {guesses.length} / 8</span>
            <span className="text-teal-300 font-mono text-[11px] bg-teal-500/20 px-2 py-0.5 rounded-md border border-teal-400/30">
              {wordLength} أحرف
            </span>
          </div>
        </div>

        {/* 1. Difficulty Selector Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
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
                className={`px-2.5 py-1 rounded-xl font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-purple-600/40 text-purple-200 border border-purple-400/50 shadow-xs scale-102'
                    : 'bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                <span>{diff.icon}</span>
                <span>{diff.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Word Length Selector Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
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
                className={`px-2.5 py-1 rounded-xl font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-teal-500/35 text-teal-200 border border-teal-400/50 shadow-xs scale-102'
                    : 'bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Theme Category Selector Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
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
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40 shadow-xs'
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

      {/* Quick Action Control Bar (Hint, Reveal Answer, Copy Options, New Word) */}
      <div className="flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md text-xs">
        {/* Trigger Hint Modal */}
        <button
          type="button"
          onClick={() => setIsHintModalOpen(true)}
          className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
          title="معجم وتلميح الكلمة"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>التلميح والمعجم</span>
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

        {/* Copy Options Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCopyDropdownOpen((prev) => !prev)}
            className="py-1.5 px-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white/90 font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
            title="خيارات نسخ التلميح والمساعدات"
          >
            <Copy className="w-3.5 h-3.5 text-teal-300" />
            <span>نسخ</span>
            <ChevronDown className="w-3 h-3 text-white/50" />
          </button>

          {isCopyDropdownOpen && (
            <div className="absolute left-0 mt-1 z-40 w-56 rounded-2xl bg-[#0c1022]/95 backdrop-blur-2xl border border-white/20 p-1.5 shadow-2xl flex flex-col gap-1 text-right animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={handleCopyHintOnly}
                className="w-full text-right px-3 py-2 rounded-xl hover:bg-white/10 text-white text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>📄 نسخ التلميح فقط</span>
              </button>
              <button
                type="button"
                onClick={handleCopyHintWithHelpers}
                className="w-full text-right px-3 py-2 rounded-xl hover:bg-teal-500/20 text-teal-200 text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>🔤 نسخ + الحروف المساعدة</span>
              </button>
              <button
                type="button"
                onClick={handleCopyHintWithAnswer}
                className="w-full text-right px-3 py-2 rounded-xl hover:bg-purple-500/20 text-purple-200 text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>🎯 نسخ + الإجابة والشرح</span>
              </button>
            </div>
          )}
        </div>

        {/* New Question Button */}
        <button
          type="button"
          onClick={() => startNewGame()}
          className="py-1.5 px-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white/90 font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
          title="تغيير الكلمة وسؤال جديد"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>جديدة</span>
        </button>
      </div>

      {/* Confirmation Modal to Reveal Answer */}
      {showRevealConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0e122b] border border-rose-400/40 rounded-3xl p-5 max-w-sm w-full text-center flex flex-col gap-3 shadow-2xl animate-in zoom-in-95 text-white">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center mx-auto border border-rose-400/30">
              <Eye className="w-6 h-6" />
            </div>
            <div className="text-base font-black text-rose-200">هل ترغب في كشف الإجابة السرية؟</div>
            <p className="text-xs text-white/70 leading-relaxed">
              سيتم إنهاء جولة التخمين الحالية وعرض الكلمة الصحيحة ومعناها الكامل في المعجم العربي.
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
        <div className="bg-rose-500/80 backdrop-blur-md border border-rose-300/40 text-white text-xs font-bold py-1 px-4 rounded-full mx-auto shadow-lg animate-bounce mt-1">
          {errorMessage}
        </div>
      )}

      {/* Semantic Clue Banner */}
      {currentHint && (
        <div className="my-0.5">
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
        </div>
      )}

      {/* Revealed Answer Box (shown on demand or loss) */}
      {isAnswerRevealed && (
        <div className="bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-slate-900/60 backdrop-blur-xl border border-rose-400/40 rounded-2xl p-3 shadow-xl my-1 text-right flex flex-col gap-2 animate-in zoom-in-95">
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
            <div className="text-xl sm:text-2xl font-black text-emerald-300 tracking-wider bg-black/40 px-4 py-1.5 rounded-xl border border-emerald-400/30 shadow-inner">
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
                title="سؤال جديد"
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
      <div className="flex items-center justify-center my-auto py-1">
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
              <span>كلمة جديدة</span>
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

      {/* Keyboard with comfortable mobile bottom elevation */}
      <div
        className="w-full pt-1 pb-4 sm:pb-6 md:pb-8 px-1 sm:px-2 transition-all"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.25rem))' }}
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
    </div>
  );
};
