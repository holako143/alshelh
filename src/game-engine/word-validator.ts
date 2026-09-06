import { normalizeArabic, isArabicOnly } from './arabic-normalizer';
import { isValidArabicWord, TARGET_WORDS, getHintForWord, getWordsForTheme } from './words-data';
import { GAME_CONFIG } from '../shared/constants';
import { WordHint } from '../shared/types';

export interface ValidationResult {
  isValid: boolean;
  normalizedWord: string;
  errorMessage?: string;
}

/**
 * Validates a word for gameplay:
 * 1. Checks length matches GAME_CONFIG.wordLength (5)
 * 2. Checks characters are valid Arabic letters
 * 3. Normalizes diacritics / alefs
 * 4. Checks against authentic Arabic dictionary
 */
export function validateGuessWord(word: string, requireDictionary: boolean = true): ValidationResult {
  if (!word) {
    return { isValid: false, normalizedWord: '', errorMessage: 'الرجاء إدخال الكلمة' };
  }

  const normalized = normalizeArabic(word);

  if (normalized.length !== GAME_CONFIG.wordLength) {
    return {
      isValid: false,
      normalizedWord: normalized,
      errorMessage: `يجب أن تتكون الكلمة من ${GAME_CONFIG.wordLength} أحرف تماماً`,
    };
  }

  if (!isArabicOnly(normalized)) {
    return {
      isValid: false,
      normalizedWord: normalized,
      errorMessage: 'يجب أن تحتوي الكلمة على حروف عربية فقط',
    };
  }

  if (requireDictionary && !isValidArabicWord(normalized)) {
    // Check if the original word or normalized is in the dictionary
    const inDict = isValidArabicWord(word) || isValidArabicWord(normalized);
    if (!inDict) {
      return {
        isValid: false,
        normalizedWord: normalized,
        errorMessage: 'الكلمة غير موجودة في المعجم العربي',
      };
    }
  }

  return {
    isValid: true,
    normalizedWord: normalized,
  };
}

/**
 * Selects a server-authoritative secret word for a round with its hint
 */
export function selectSecretWord(
  roundNumber: number,
  seed?: number,
  themeCategory?: string
): { word: string; wordId: number; hint: WordHint } {
  const wordList = getWordsForTheme(themeCategory);
  let index: number;
  if (seed !== undefined) {
    // Deterministic selection based on seed and round number
    index = Math.abs((seed * 31 + roundNumber * 17) % wordList.length);
  } else {
    index = Math.floor(Math.random() * wordList.length);
  }
  const item = wordList[index] || wordList[0];
  const word = item.word;
  return {
    word,
    wordId: index,
    hint: getHintForWord(word),
  };
}
