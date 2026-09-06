/**
 * Arabic Text Normalization Utility
 * Handles diacritics, tatweel, Alef variants, Hamza variants, Yaa/Alef Maksura, and zero-width characters.
 */

export interface NormalizationOptions {
  removeTashkeel?: boolean;      // Remove diacritics (fatha, damma, kasra, etc.)
  removeTatweel?: boolean;       // Remove tatweel/kashida (ـ)
  normalizeAlef?: boolean;       // Convert أ, إ, آ, ٱ to ا
  normalizeYaa?: boolean;        // Convert ى to ي
  normalizeTaaMarbuta?: boolean; // Convert ة to ه (default false to keep distinct)
  normalizeHamza?: boolean;      // Convert ئ, ؤ to ء (default false)
  trimWhitespace?: boolean;
}

const DEFAULT_OPTIONS: NormalizationOptions = {
  removeTashkeel: true,
  removeTatweel: true,
  normalizeAlef: true,
  normalizeYaa: true,
  normalizeTaaMarbuta: false,
  normalizeHamza: false,
  trimWhitespace: true,
};

// Arabic diacritics unicode range (Tashkeel)
const TASHKEEL_REGEX = /[\u064B-\u065F\u0670\u0671]/g;
// Tatweel (ـ)
const TATWEEL_REGEX = /\u0640/g;
// Zero-width characters
const ZERO_WIDTH_REGEX = /[\u200B-\u200F\uFEFF]/g;

export function normalizeArabic(text: string, options: NormalizationOptions = {}): string {
  if (!text) return '';

  const opts = { ...DEFAULT_OPTIONS, ...options };
  let result = text;

  if (opts.trimWhitespace) {
    result = result.trim();
  }

  // Remove zero-width characters
  result = result.replace(ZERO_WIDTH_REGEX, '');

  // Remove diacritics (Tashkeel)
  if (opts.removeTashkeel) {
    result = result.replace(TASHKEEL_REGEX, '');
  }

  // Remove Tatweel
  if (opts.removeTatweel) {
    result = result.replace(TATWEEL_REGEX, '');
  }

  // Normalize Alef forms: أ, إ, آ, ٱ -> ا
  if (opts.normalizeAlef) {
    result = result.replace(/[أإآٱ]/g, 'ا');
  }

  // Normalize Alef Maksura: ى -> ي
  if (opts.normalizeYaa) {
    result = result.replace(/ى/g, 'ي');
  }

  // Normalize Taa Marbuta if configured
  if (opts.normalizeTaaMarbuta) {
    result = result.replace(/ة/g, 'ه');
  }

  // Normalize Hamzas if configured
  if (opts.normalizeHamza) {
    result = result.replace(/[ئؤ]/g, 'ء');
  }

  return result;
}

/**
 * Checks if a string contains strictly Arabic alphabetical characters
 */
export function isArabicOnly(text: string): boolean {
  if (!text) return false;
  // Arabic Unicode ranges including basic letters, hamzas, etc.
  const arabicLetterRegex = /^[\u0621-\u064A\u0671-\u06D3]+$/;
  return arabicLetterRegex.test(text);
}
