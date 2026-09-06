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
  jokersRemaining = 0,
  jokerDisabled = false,
}) => {
  // Trigger light haptic vibration on mobile
  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && 'navigator' in window && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(12);
      } catch {}
    }
  }, []);

  // Physical keyboard listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        soundManager.playKeypress();
        triggerHaptic();
        onEnter();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        soundManager.playBackspace();
        triggerHaptic();
        onDelete();
      } else if (ARABIC_LETTERS_SET.has(e.key)) {
        e.preventDefault();
        soundManager.playKeypress();
        triggerHaptic();
        onChar(e.key);
      }
    },
    [disabled, onChar, onDelete, onEnter, triggerHaptic]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getKeyColor = (char: string): string => {
    const status = letterStatuses[char];
    if (status === 'CORRECT') {
      return 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white border-emerald-300 shadow-sm shadow-emerald-500/40 font-black scale-102';
    }
    if (status === 'PRESENT') {
      return 'bg-gradient-to-b from-amber-400 to-orange-500 text-white border-amber-300 shadow-sm shadow-amber-500/30 font-black scale-102';
    }
    if (status === 'ABSENT') {
      return 'bg-white/[0.02] text-white/20 border-white/5 opacity-40 line-through';
    }
    return 'bg-white/[0.08] text-white/90 active:bg-white/[0.22] hover:bg-white/[0.16] border-white/10 shadow-xs';
  };

  return (
    <div id="arabic-keyboard" className="w-full max-w-xl mx-auto px-1 select-none touch-manipulation">
      {/* Joker Power-up Toolbar */}
      {onUseJoker && (
        <div className="flex items-center justify-between pb-1 px-1 text-right">
          <button
            id="btn-use-joker-powerup"
            type="button"
            disabled={disabled || jokerDisabled || jokersRemaining <= 0}
            onClick={() => {
              triggerHaptic();
              onUseJoker();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500/80 via-pink-500/80 to-purple-600/80 text-white border border-purple-300/40 shadow-sm shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            title="حذف 3 أحرف خاطئة من اللوحة للمساعدة"
          >
            <Wand2 className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>الجوكر 🃏 ({jokersRemaining} متبقي)</span>
          </button>
          <span className="text-[10px] text-white/40 font-medium">لوحة مفاتيح الجوال التفاعلية</span>
        </div>
      )}

      <div className="flex flex-col gap-1 sm:gap-1.5">
        {ARABIC_KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center items-center gap-0.5 sm:gap-1 w-full">
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
                      triggerHaptic();
                      onEnter();
                    }}
                    className="flex-1 max-w-[4rem] h-10 sm:h-12 rounded-xl font-bold text-xs bg-emerald-500/90 active:bg-emerald-400 text-white flex items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-emerald-500/20 border border-emerald-300/30 cursor-pointer"
                    aria-label="إدخال التخمين"
                  >
                    <span>إدخال</span>
                    <CornerDownLeft className="w-3 h-3" />
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
                      triggerHaptic();
                      onDelete();
                    }}
                    className="flex-1 max-w-[3.5rem] h-10 sm:h-12 rounded-xl font-bold text-xs bg-white/[0.08] active:bg-white/[0.2] text-white/90 flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none border border-white/10 cursor-pointer"
                    aria-label="حذف الحرف"
                  >
                    <Delete className="w-4 h-4" />
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
                    triggerHaptic();
                    onChar(key);
                  }}
                  className={`flex-1 min-w-[1.65rem] sm:min-w-8 h-10 sm:h-12 rounded-xl font-bold text-sm sm:text-base border flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${getKeyColor(
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
