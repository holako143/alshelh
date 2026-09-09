import { GameSettings } from './types';

export const GAME_CONFIG = {
  wordLength: 5,
  defaultMaxAttempts: 8,
  minAttempts: 4,
  maxAttempts: 10,
  allowedAttempts: [4, 5, 6, 8, 10],
  defaultRounds: 5,
  allowedRounds: [1, 3, 5, 7, 10],
  defaultRoundDurationSeconds: 60,
  allowedDurations: [15, 30, 45, 60, 90, 120, 180],
  minRoundDurationSeconds: 10,
  maxRoundDurationSeconds: 300,
  defaultTransitionSeconds: 3,
  reconnectGracePeriodMs: 30000,
  maxPlayersPerRoom: 10,
  minPlayersPerRoom: 2,
  allowedMaxPlayers: [2, 3, 4, 5, 6, 8, 10],
  allowedJokerCounts: [0, 1, 2, 3],
  allowedJokerEliminates: [2, 3, 4],
  baseScorePerRound: 1000,
  penaltyPerAttempt: 75,
  maxTimeBonus: 300,
} as const;

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  wordLength: 5,
  maxAttempts: 8,
  totalRounds: 5,
  roundDurationSeconds: 60,
  transitionDurationSeconds: 3,
  showOpponentProgress: true,
  hardMode: false,
  maxPlayers: 10,
  themeCategory: 'ALL',
  jokerCount: 1,
  jokerEliminateCount: 3,
};

// Arabic Keyboard Layout (Standard responsive RTL order)
export const ARABIC_KEYBOARD_LAYOUT = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  ['ENTER', 'ئ', 'ء', 'ؤ', 'ر', 'ى', 'ة', 'و', 'ز', 'ظ', 'ذ', 'BACKSPACE'],
];

export const ARABIC_LETTERS_SET = new Set([
  'ا', 'أ', 'إ', 'آ', 'ٱ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص',
  'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ى', 'ة', 'ء', 'ئ', 'ؤ',
]);
