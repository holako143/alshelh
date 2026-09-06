import { TileState } from '../shared/types';
import { normalizeArabic } from './arabic-normalizer';

/**
 * Evaluates a guess against a target word using standard Wordle two-pass duplicate algorithm.
 *
 * Pass 1: Identifies CORRECT letters (exact position match) and counts remaining letters.
 * Pass 2: Identifies PRESENT letters (wrong position) if letter remains available, otherwise ABSENT.
 */
export function evaluateGuess(
  targetWord: string,
  guessWord: string,
  normalize: boolean = true
): TileState[] {
  const target = normalize ? normalizeArabic(targetWord) : targetWord;
  const guess = normalize ? normalizeArabic(guessWord) : guessWord;

  const length = target.length;
  if (guess.length !== length) {
    throw new Error(`Target length (${length}) does not match guess length (${guess.length})`);
  }

  const result: TileState[] = new Array(length).fill('ABSENT');
  const targetLetterCounts: Record<string, number> = {};

  // Count occurrences of each letter in target
  for (let i = 0; i < length; i++) {
    const letter = target[i];
    targetLetterCounts[letter] = (targetLetterCounts[letter] || 0) + 1;
  }

  // Pass 1: Mark CORRECT (exact matches)
  for (let i = 0; i < length; i++) {
    if (guess[i] === target[i]) {
      result[i] = 'CORRECT';
      targetLetterCounts[guess[i]]--;
    }
  }

  // Pass 2: Mark PRESENT (exists elsewhere in word)
  for (let i = 0; i < length; i++) {
    if (result[i] === 'CORRECT') {
      continue;
    }
    const letter = guess[i];
    if (targetLetterCounts[letter] && targetLetterCounts[letter] > 0) {
      result[i] = 'PRESENT';
      targetLetterCounts[letter]--;
    } else {
      result[i] = 'ABSENT';
    }
  }

  return result;
}

/**
 * Checks if all tiles in evaluation are CORRECT
 */
export function isWordSolved(evaluation: TileState[]): boolean {
  return evaluation.length > 0 && evaluation.every((state) => state === 'CORRECT');
}
