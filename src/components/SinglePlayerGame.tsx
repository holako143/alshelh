import React, { useState, useEffect, useCallback } from 'react';
import { GameBoard } from './GameBoard';
import { ArabicKeyboard } from './ArabicKeyboard';
import { HintCard } from './HintCard';
import { getRandomWordClue, getWordsForTheme, THEME_DEFINITIONS } from '../game-engine/words-data';
import { validateGuessWord } from '../game-engine/word-validator';
import { evaluateGuess, isWordSolved } from '../game-engine/guess-evaluator';
import { TileState, WordHint } from '../shared/types';
import { ARABIC_LETTERS_SET } from '../shared/constants';
import { soundManager } from '../lib/audio';
import { fireWinConfetti } from '../lib/confetti';
import { RotateCcw, Home, Sparkles, CheckCircle2, XCircle } from 'lucide-react';

interface SinglePlayerGameProps {
  onBackToLobby: () => void;
  colorBlindMode: boolean;
}

export const SinglePlayerGame: React.FC<SinglePlayerGameProps> = ({
  onBackToLobby,
  colorBlindMode,
}) => {
  const [targetWord, setTargetWord] = useState<string>('');
  const [currentHint, setCurrentHint] = useState<WordHint | null>(null);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<TileState[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, TileState>>({});
  const [jokersRemaining, setJokersRemaining] = useState<number>(1);
  const [selectedTheme, setSelectedTheme] = useState<string>('ALL');
  const [isHintModalOpen, setIsHintModalOpen] = useState<boolean>(false);

  const startNewGame = useCallback((theme?: string) => {
    const activeTheme = theme || selectedTheme;
    const themeWords = getWordsForTheme(activeTheme);
    const clue = themeWords[Math.floor(Math.random() * themeWords.length)] || getRandomWordClue();
    setTargetWord(clue.word);
    setCurrentHint({
      category: clue.category,
      hint: clue.hint,
      dictionaryMeaning: clue.hint,
      icon: clue.icon,
      firstLetter: clue.word[0],
      lastLetter: clue.word[clue.word.length - 1],
    });
    setGuesses([]);
    setEvaluations([]);
    setCurrentGuess('');
    setIsSolved(false);
    setIsGameOver(false);
    setIsShaking(false);
    setErrorMessage(null);
    setLetterStatuses({});
    setJokersRemaining(1);
    setIsHintModalOpen(false);
  }, [selectedTheme]);

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

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

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
    if (currentGuess.length >= 5) return;
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

    if (currentGuess.length < 5) {
      setErrorMessage('يجب إكمال 5 أحرف أولاً');
      triggerShake();
      return;
    }

    const validation = validateGuessWord(currentGuess, false);
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

  return (
    <div id="single-player-container" className="flex flex-col flex-1 min-h-0 max-w-lg mx-auto w-full px-1.5 sm:px-2 py-1.5 sm:py-3 justify-between">
      {/* Top bar info & Theme Selector */}
      <div className="flex flex-col gap-1.5 px-3 py-2 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-white/70">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>وضع التدريب الفردي</span>
          </span>
          <span>المحاولات: {guesses.length} / 8</span>
        </div>

        {/* Theme Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
          <span className="text-white/40 shrink-0 text-[10px]">المجال:</span>
          {THEME_DEFINITIONS.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  setSelectedTheme(theme.id);
                  startNewGame(theme.id);
                }}
                className={`px-2 py-0.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-teal-500/30 text-teal-300 border border-teal-400/40 shadow-xs'
                    : 'bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                <span>{theme.icon}</span>
                <span>{theme.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-500/80 backdrop-blur-md border border-rose-300/40 text-white text-xs font-bold py-1 px-4 rounded-full mx-auto shadow-lg animate-bounce mt-2">
          {errorMessage}
        </div>
      )}

      {/* Semantic Clue Card with Category & First-letter help */}
      {currentHint && (
        <div className="my-1 sm:my-2">
          <HintCard
            hint={currentHint}
            allowNewWord={true}
            onNewWord={startNewGame}
            attemptsCount={guesses.length}
            initialExpanded={false}
            isOpenControlled={isHintModalOpen}
            onToggleControlled={setIsHintModalOpen}
          />
        </div>
      )}

      {/* Wordle Board */}
      <div className="flex items-center justify-center my-auto">
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

      {/* Game Over / Win Banner */}
      {isGameOver && (
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-2xl text-center flex flex-col gap-3.5 my-2 animate-in zoom-in-95 text-white">
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
              onClick={startNewGame}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/25 border border-white/20 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>كلمة جديدة</span>
            </button>
            <button
              id="btn-exit-solo"
              type="button"
              onClick={onBackToLobby}
              className="flex-1 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer backdrop-blur-md transition-all"
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>
          </div>
        </div>
      )}

      {/* Keyboard with comfortable bottom elevation */}
      <div className="w-full pb-4 sm:pb-6 md:pb-8">
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
