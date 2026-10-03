import React from 'react';
import { TileState } from '../shared/types';
import { Check, Waves, X } from 'lucide-react';

interface GameBoardProps {
  guesses: string[];
  evaluations: TileState[][];
  currentGuess: string;
  maxAttempts?: number;
  wordLength?: number;
  isShaking?: boolean;
  colorBlindMode?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  guesses,
  evaluations,
  currentGuess,
  maxAttempts = 8,
  wordLength = 5,
  isShaking = false,
  colorBlindMode = false,
}) => {
  const rows = [];

  for (let rowIndex = 0; rowIndex < maxAttempts; rowIndex++) {
    const isSubmitted = rowIndex < guesses.length;
    const isCurrent = rowIndex === guesses.length;

    let rowLetters: string[] = [];
    let rowEvaluations: TileState[] = [];

    if (isSubmitted) {
      rowLetters = guesses[rowIndex].split('');
      rowEvaluations = evaluations[rowIndex] || new Array(wordLength).fill('ABSENT');
    } else if (isCurrent) {
      rowLetters = currentGuess.split('');
      rowEvaluations = new Array(wordLength).fill('ACTIVE');
    } else {
      rowLetters = [];
      rowEvaluations = new Array(wordLength).fill('EMPTY');
    }

    const isRowSolved =
      isSubmitted &&
      rowEvaluations.length === wordLength &&
      rowEvaluations.every((s) => s === 'CORRECT');

    let tileSizeClass = 'w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 text-base xs:text-lg sm:text-2xl';
    if (wordLength <= 3) {
      tileSizeClass = 'w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 text-xl xs:text-2xl sm:text-3xl';
    } else if (wordLength === 4) {
      tileSizeClass = 'w-10 h-10 xs:w-11 xs:h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 text-lg xs:text-xl sm:text-2xl';
    } else if (wordLength === 6) {
      tileSizeClass = 'w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 text-sm xs:text-base sm:text-xl';
    } else if (wordLength >= 7) {
      tileSizeClass = 'w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-xs xs:text-sm sm:text-lg';
    }

    const tiles = [];
    for (let colIndex = 0; colIndex < wordLength; colIndex++) {
      const char = rowLetters[colIndex] || '';
      const state = rowEvaluations[colIndex] || 'EMPTY';

      let bgClass = 'bg-white/[0.04] backdrop-blur-md border border-white/10 text-white/90';
      let animClass = '';
      let animStyle: React.CSSProperties = {};
      let icon = null;
      let hasSweep = false;

      if (isSubmitted) {
        const staggerDelay = `${colIndex * 120}ms`;

        if (isRowSolved) {
          bgClass =
            'bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-600 border-2 border-emerald-200 text-white font-black shadow-xl shadow-emerald-500/50 animate-glow-pulse';
          animClass = 'animate-winner-wave';
          animStyle = { animationDelay: `${colIndex * 100}ms` };
          hasSweep = true;
          if (colorBlindMode) icon = <Check className="w-3.5 h-3.5 absolute top-1.5 left-1.5 text-white opacity-95" />;
        } else if (state === 'CORRECT') {
          bgClass =
            'bg-gradient-to-b from-emerald-500 via-emerald-600 to-teal-700 border-2 border-emerald-300/80 text-white font-black shadow-lg shadow-emerald-500/40 ring-1 ring-emerald-300/30';
          animClass = 'animate-correct-bounce';
          animStyle = { animationDelay: staggerDelay };
          hasSweep = true;
          if (colorBlindMode) icon = <Check className="w-3 h-3 absolute top-1.5 left-1.5 opacity-80" />;
        } else if (state === 'PRESENT') {
          bgClass =
            'bg-gradient-to-b from-amber-500 via-amber-600 to-orange-600 border-2 border-amber-300/70 text-white font-black shadow-lg shadow-amber-500/30';
          animClass = 'animate-tile-pop';
          animStyle = { animationDelay: staggerDelay };
          if (colorBlindMode) icon = <Waves className="w-3 h-3 absolute top-1.5 left-1.5 opacity-80" />;
        } else {
          bgClass = 'bg-white/[0.03] backdrop-blur-md border border-white/5 text-white/30 font-medium';
          if (colorBlindMode) icon = <X className="w-3 h-3 absolute top-1.5 left-1.5 opacity-40" />;
        }
      } else if (isCurrent && char) {
        bgClass =
          'bg-white/[0.14] backdrop-blur-md border-2 border-emerald-400/80 text-white font-black scale-105 shadow-lg shadow-emerald-500/20';
        animClass = 'animate-tile-pop';
      }

      tiles.push(
        <div
          key={colIndex}
          id={`tile-r${rowIndex}-c${colIndex}`}
          style={animStyle}
          className={`relative overflow-hidden ${tileSizeClass} rounded-lg sm:rounded-xl flex items-center justify-center font-bold select-none transition-colors duration-200 ${bgClass} ${animClass}`}
        >
          {hasSweep && <span className="light-sweep-beam" />}
          {icon}
          <span className="relative z-10">{char}</span>
        </div>
      );
    }

    rows.push(
      <div
        key={rowIndex}
        id={`row-${rowIndex}`}
        className={`flex justify-center gap-1 sm:gap-1.5 ${
          isCurrent && isShaking ? 'animate-shake' : ''
        }`}
      >
        {tiles}
      </div>
    );
  }

  return (
    <div id="game-board-container" className="flex flex-col gap-1 sm:gap-1.5 justify-center my-auto py-1">
      {rows}
    </div>
  );
};
