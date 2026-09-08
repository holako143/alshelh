import React, { useEffect, useCallback } from 'react';
import { ARABIC_KEYBOARD_LAYOUT, ARABIC_LETTERS_SET } from '../shared/constants';
import { TileState } from '../shared/types';
import { soundManager } from '../lib/audio';
import { Delete, CornerDownLeft, Wand2 } from 'lucide-react';

interface ArabicKeyboardProps {
  onChar: (char: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  letterStatuses: Record<string, TileState>;
  disabled?: boolean;
  onUseJoker?: () => void;
  jokersAvailable?: number;
  jokersRemaining?: number;
  jokerDisabled?: boolean;
}

export const ArabicKeyboard: React.FC<ArabicKeyboardProps> = ({
  onChar,
  onDelete,
  onEnter,
  letterStatuses,
  disabled = false,
  onUseJoker,
  jokersAvailable = 0,
  jokersRemaining,
  jokerDisabled = false,
}) => {
  const actualJokers = jokersRemaining !== undefined ? jokersRemaining : jokersAvailable;
  // Physical keyboard listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        soundManager.playKeypress();
        onEnter();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        soundManager.playBackspace();
        onDelete();
      } else if (ARABIC_LETTERS_SET.has(e.key)) {
        e.preventDefault();
        soundManager.playKeypress();
        onChar(e.key);
      }
    },
    [disabled, onChar, onDelete, onEnter]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getKeyColor = (char: string): string => {
    const status = letterStatuses[char];
    if (status === 'CORRECT') {
      return 'bg-gradient-to-b from-emerald-400 to-emerald-600 backdrop-blur-md text-white border-emerald-300 shadow-md shadow-emerald-500/40 ring-2 ring-emerald-300/40 font-black scale-102';
    }
    if (status === 'PRESENT') {
      return 'bg-gradient-to-b from-amber-400 to-orange-500 backdrop-blur-md text-white border-amber-300 shadow-md shadow-amber-500/30 ring-1 ring-amber-300/30 font-black scale-102';
    }
    if (status === 'ABSENT') {
      return 'bg-white/[0.02] backdrop-blur-xs text-white/20 border-white/5 opacity-50 line-through';
    }
    return 'bg-white/[0.08] backdrop-blur-md text-white/90 hover:bg-white/[0.16] border-white/10 hover:border-white/25 shadow-xs';
  };

  return (
    <div id="arabic-keyboard" className="w-full max-w-2xl mx-auto px-1 select-none touch-manipulation">
      {/* Optional Joker power-up toolbar */}
      {onUseJoker && (
        <div className="flex items-center justify-between pb-1.5 px-2">
          <button
            id="btn-use-joker-powerup"
            type="button"
            disabled={disabled || jokerDisabled || actualJokers <= 0}
            onClick={onUseJoker}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500/80 via-pink-500/80 to-purple-600/80 text-white border border-purple-300/40 shadow-md shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            title="حذف 3 أحرف خاطئة من اللوحة للمساعدة"
          >
            <Wand2 className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>الجوكر 🃏 ({actualJokers} متبقي)</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-md">حذف 3 أحرف</span>
          </button>
          <span className="text-[10px] text-white/50">لوحة المفاتيح التفاعلية</span>
        </div>
      )}

      <div className="flex flex-col gap-1 sm:gap-1.5" dir="ltr">
        {ARABIC_KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center items-center gap-0.5 xs:gap-1 sm:gap-1.5 w-full">
            {row.map((key) => {
              const isEnter = key === 'ENTER';
              const isBackspace = key === 'BACKSPACE';

              if (isEnter) {
                return (
                  <button
                    id="btn-enter"
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      soundManager.playKeypress();
                      onEnter();
                    }}
                    className="flex-[1.2] sm:flex-[1.4] max-w-[3.4rem] sm:max-w-[4.2rem] h-9 xs:h-10 sm:h-11 md:h-12 px-1 rounded-lg sm:rounded-xl font-bold text-[10px] xs:text-[11px] sm:text-xs bg-emerald-500/90 hover:bg-emerald-400 active:scale-95 text-white flex items-center justify-center gap-0.5 sm:gap-1 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-emerald-500/25 border border-emerald-300/30 backdrop-blur-md cursor-pointer select-none shrink-0"
                    aria-label="إدخال التخمين"
                  >
                    <span>إدخال</span>
                    <CornerDownLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                );
              }

              if (isBackspace) {
                return (
                  <button
                    id="btn-backspace"
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      soundManager.playBackspace();
                      onDelete();
                    }}
                    className="flex-[1.0] sm:flex-[1.1] max-w-[2.8rem] sm:max-w-[3.6rem] h-9 xs:h-10 sm:h-11 md:h-12 px-1 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm bg-white/[0.08] hover:bg-white/[0.16] active:scale-95 text-white/90 flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none shadow-xs border border-white/10 backdrop-blur-md cursor-pointer select-none shrink-0"
                    aria-label="حذف الحرف"
                  >
                    <Delete className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                  </button>
                );
              }

              return (
                <button
                  id={`key-${key}`}
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    soundManager.playKeypress();
                    onChar(key);
                  }}
                  className={`flex-1 min-w-0 h-9 xs:h-10 sm:h-11 md:h-12 px-0.5 rounded-lg sm:rounded-xl font-bold text-xs xs:text-sm sm:text-base md:text-lg border flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none ${getKeyColor(
                    key
                  )}`}
                  aria-label={`حرف ${key}`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
