import { toHiragana, toKatakana, toRomaji, isRomaji, isHiragana, isKatakana, isKanji, isJapanese } from 'wanakana';

export {
  toHiragana,
  toKatakana,
  toRomaji,
  isRomaji,
  isHiragana,
  isKatakana,
  isKanji,
  isJapanese,
};

/**
 * Convert romaji input to hiragana for dictionary search
 * @param input - User input string
 * @returns Converted string (hiragana if romaji, original otherwise)
 */
export function normalizeSearchInput(input: string): string {
  if (isRomaji(input)) {
    return toHiragana(input);
  }
  return input;
}

/**
 * Detect the type of Japanese input
 * @param input - Input string
 * @returns 'romaji' | 'hiragana' | 'katakana' | 'kanji' | 'mixed'
 */
export function detectInputType(input: string): 'romaji' | 'hiragana' | 'katakana' | 'kanji' | 'mixed' {
  if (isRomaji(input)) return 'romaji';
  if (isHiragana(input)) return 'hiragana';
  if (isKatakana(input)) return 'katakana';
  if (isKanji(input)) return 'kanji';
  return 'mixed';
}
