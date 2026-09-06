import React, { useState, useEffect, useCallback } from 'react';
import { GameBoard } from './GameBoard';
import { ArabicKeyboard } from './ArabicKeyboard';
import { HintCard } from './HintCard';
import { getDailyWord } from '../game-engine/words-data';
import { validateGuessWord } from '../game-engine/word-validator';
import { evaluateGuess, isWordSolved } from '../game-engine/guess-evaluator';
import { TileState, WordHint } from '../shared/types';
import { ARABIC_LETTERS_SET } from '../shared/constants';
import { soundManager } from '../lib/audio';
import { fireWinConfetti } from '../lib/confetti';
import { X, Flame, Trophy, Calendar, Share2, Check, RotateCcw } from 'lucide-react';

interface DailyStats {
  lastPlayedDate: string;
  lastSolvedDate: string;
  currentStreak: number;
  maxStreak: number;
  totalPlayed: number;
  totalWon: number;
}

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  colorBlindMode: boolean;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  isOpen,
  onClose,
  colorBlindMode,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const dailyItem = getDailyWord(todayStr);

  const [targetWord] = useState<string>(dailyItem.word);
  const [currentHint] = useState<WordHint>({
    category: dailyItem.category,
    hint: dailyItem.hint,
    icon: dailyItem.icon,
    firstLetter: dailyItem.word[0],
    lastLetter: dailyItem.word[dailyItem.word.length - 1],
    level2Hint: `تبدأ بحرف "${dailyItem.word[0]}" وتنتمي لمجال ${dailyItem.category}`,
    level3Hint: `تبدأ بحرف "${dailyItem.word[0]}" وتنتهي بحرف "${dailyItem.word[dailyItem.word.length - 1]}" (${dailyItem.hint})`,
  });

  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<TileState[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, TileState>>({});
  const [jokersRemaining, setJokersRemaining] = useState<number>(1);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Load / Save Stats
  const [stats, setStats] = useState<DailyStats>(() => {
    try {
      const stored = localStorage.getItem('alwird_daily_stats');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      lastPlayedDate: '',
      lastSolvedDate: '',
      currentStreak: 0,
      maxStreak: 0,
      totalPlayed: 0,
      totalWon: 0,
    };
  });

  // Check if today was already played / solved
  useEffect(() => {
    try {
      const savedToday = localStorage.getItem(`alwird_daily_${todayStr}`);
      if (savedToday) {
        const parsed = JSON.parse(savedToday);
        setGuesses(parsed.guesses || []);
        setEvaluations(parsed.evaluations || []);
        setIsSolved(parsed.isSolved || false);
        setIsGameOver(parsed.isGameOver || false);
        setLetterStatuses(parsed.letterStatuses || {});
      }
    } catch {}
  }, [todayStr]);

  if (!isOpen) return null;

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

  const handleChar = (char: string) => {
    if (isGameOver || isSolved) return;
    if (currentGuess.length >= 5) return;
    setCurrentGuess((prev) => prev + char);
    setErrorMessage(null);
  };

  const handleDelete = () => {
    if (isGameOver || isSolved) return;
    setCurrentGuess((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const saveDailyProgress = (
    newGuesses: string[],
    newEvals: TileState[][],
    solved: boolean,
    gameOver: boolean,
    updatedKeyboard: Record<string, TileState>
  ) => {
    localStorage.setItem(
      `alwird_daily_${todayStr}`,
      JSON.stringify({
        guesses: newGuesses,
        evaluations: newEvals,
        isSolved: solved,
        isGameOver: gameOver,
        letterStatuses: updatedKeyboard,
      })
    );

    if (gameOver) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const isConsecutive = stats.lastSolvedDate === yesterday;
      const newStreak = solved ? (isConsecutive ? stats.currentStreak + 1 : 1) : 0;
      const newMax = Math.max(stats.maxStreak, newStreak);

      const updatedStats: DailyStats = {
        lastPlayedDate: todayStr,
        lastSolvedDate: solved ? todayStr : stats.lastSolvedDate,
        currentStreak: newStreak,
        maxStreak: newMax,
        totalPlayed: stats.totalPlayed + 1,
        totalWon: stats.totalWon + (solved ? 1 : 0),
      };

      setStats(updatedStats);
      localStorage.setItem('alwird_daily_stats', JSON.stringify(updatedStats));
    }
  };

  const handleEnter = () => {
    if (isGameOver || isSolved) return;

    if (currentGuess.length < 5) {
      setErrorMessage('يجب إكمال 5 أحرف أولاً');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    const validation = validateGuessWord(currentGuess, true);
    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage || 'الكلمة غير صالحة');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
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

    const gameOver = solved || newGuesses.length >= 8;

    if (solved) {
      setIsSolved(true);
      setIsGameOver(true);
      soundManager.playGuessEvaluation(evalResult);
      setTimeout(() => soundManager.playRoundWin(), 500);
      fireWinConfetti();
    } else if (newGuesses.length >= 8) {
      setIsGameOver(true);
      soundManager.playGuessEvaluation(evalResult);
      setTimeout(() => soundManager.playRoundLoss(), 600);
    } else {
      soundManager.playGuessEvaluation(evalResult);
    }

    saveDailyProgress(newGuesses, newEvals, solved, gameOver, letterStatuses);
  };

  const handleCopyShare = () => {
    const emojis = evaluations
      .map((row) =>
        row
          .map((tile) => (tile === 'CORRECT' ? '🟩' : tile === 'PRESENT' ? '🟨' : '⬛'))
          .join('')
      )
      .join('\n');

    const shareText = `ووردل الوِرد 🌟 - لغز اليوم (${todayStr})\nالمحاولات: ${
      isSolved ? guesses.length : 'X'
    }/8\nالسلسلة الحالية: 🔥 ${stats.currentStreak}\n\n${emojis}\n\nالعب الآن في تطبيق الوِرد!`;

    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in text-right">
      <div
        id="daily-challenge-modal"
        className="relative flex flex-col w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-neutral-900/95 border border-white/15 p-4 sm:p-5 shadow-2xl text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-300">
                لغز اليوم (Daily Challenge)
              </h2>
              <p className="text-xs text-white/60 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>{todayStr} - كلمة موحدة للجميع يومياً</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Streak & Stats banner */}
        <div className="grid grid-cols-4 gap-2 my-3 p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
          <div className="flex flex-col items-center">
            <span className="text-sm sm:text-base font-black text-amber-400 flex items-center gap-1">
              <Flame className="w-4 h-4" />
              {stats.currentStreak}
            </span>
            <span className="text-[10px] text-white/60">السلسلة الحالية</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm sm:text-base font-black text-emerald-400 flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              {stats.maxStreak}
            </span>
            <span className="text-[10px] text-white/60">أطول سلسلة</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm sm:text-base font-black text-teal-300">
              {stats.totalWon}
            </span>
            <span className="text-[10px] text-white/60">الألغاز المحلولة</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm sm:text-base font-black text-cyan-300">
              {stats.totalPlayed > 0 ? Math.round((stats.totalWon / stats.totalPlayed) * 100) : 0}%
            </span>
            <span className="text-[10px] text-white/60">نسبة الفوز</span>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-rose-500/80 text-white text-xs font-bold py-1.5 px-3 rounded-xl mx-auto my-1 animate-bounce">
            {errorMessage}
          </div>
        )}

        {/* Hint Card */}
        <div className="my-1.5">
          <HintCard
            hint={currentHint}
            attemptsCount={guesses.length}
            initialExpanded={true}
          />
        </div>

        {/* Game Board */}
        <div className="my-2 flex justify-center">
          <GameBoard
            guesses={guesses}
            evaluations={evaluations}
            currentGuess={currentGuess}
            maxAttempts={8}
            wordLength={5}
            isShaking={isShaking}
            colorBlindMode={colorBlindMode}
          />
        </div>

        {/* Result banner if game is finished */}
        {isGameOver && (
          <div className="my-2 p-3 rounded-2xl bg-white/[0.06] border border-white/15 text-center flex flex-col items-center gap-2">
            {isSolved ? (
              <div className="text-emerald-300 font-black text-sm">
                🎉 رائع! تم حل لغز اليوم بنجاح في {guesses.length} محاولات!
              </div>
            ) : (
              <div className="text-rose-300 font-bold text-sm">
                انتهت المحاولات! الكلمة السرية كانت:{' '}
                <strong className="text-white text-base">{targetWord}</strong>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyShare}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold text-xs shadow-lg hover:from-emerald-400 hover:to-teal-300 transition-all cursor-pointer"
            >
              {copiedShare ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedShare ? 'تم نسخ شبكة النتيجة!' : 'مشاركة نتيجتك مع أصدقائك'}</span>
            </button>
          </div>
        )}

        {/* Keyboard */}
        <div className="mt-auto pt-2">
          <ArabicKeyboard
            onChar={handleChar}
            onDelete={handleDelete}
            onEnter={handleEnter}
            letterStatuses={letterStatuses}
            disabled={isGameOver}
            onUseJoker={handleUseJoker}
            jokersRemaining={jokersRemaining}
          />
        </div>
      </div>
    </div>
  );
};
