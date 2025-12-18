/**
 * Japanese deinflection system
 * Based on Yomitan's approach but simplified for our use case
 *
 * This module provides functions to deinflect Japanese words back to their
 * dictionary forms. For example: 食べたい → 食べる
 */

export type DeinflectionResult = {
  /** The deinflected (dictionary) form */
  text: string;
  /** Chain of transformations applied */
  rules: string[];
};

type DeinflectionRule = {
  /** Suffix to look for in inflected form */
  inflectedSuffix: string;
  /** Suffix to replace with (dictionary form) */
  dictionarySuffix: string;
  /** Human-readable name of this inflection */
  name: string;
};

/**
 * Deinflection rules for Japanese verbs and adjectives
 * Organized by inflection type
 */
const DEINFLECTION_RULES: DeinflectionRule[] = [
  // ============================================
  // Ichidan (一段) verbs - る verbs
  // Base: 食べる, 見る, etc.
  // ============================================

  // -たい (want to)
  { inflectedSuffix: 'たい', dictionarySuffix: 'る', name: '-たい' },
  { inflectedSuffix: 'たかった', dictionarySuffix: 'る', name: '-たかった' },
  { inflectedSuffix: 'たくない', dictionarySuffix: 'る', name: '-たくない' },
  { inflectedSuffix: 'たくなかった', dictionarySuffix: 'る', name: '-たくなかった' },

  // -て form
  { inflectedSuffix: 'て', dictionarySuffix: 'る', name: '-て' },
  { inflectedSuffix: 'ている', dictionarySuffix: 'る', name: '-ている' },
  { inflectedSuffix: 'てる', dictionarySuffix: 'る', name: '-てる' },
  { inflectedSuffix: 'ていた', dictionarySuffix: 'る', name: '-ていた' },
  { inflectedSuffix: 'てた', dictionarySuffix: 'る', name: '-てた' },

  // -た (past)
  { inflectedSuffix: 'た', dictionarySuffix: 'る', name: '-た' },

  // -ない (negative)
  { inflectedSuffix: 'ない', dictionarySuffix: 'る', name: '-ない' },
  { inflectedSuffix: 'なかった', dictionarySuffix: 'る', name: '-なかった' },
  { inflectedSuffix: 'なくて', dictionarySuffix: 'る', name: '-なくて' },

  // -ます (polite)
  { inflectedSuffix: 'ます', dictionarySuffix: 'る', name: '-ます' },
  { inflectedSuffix: 'ました', dictionarySuffix: 'る', name: '-ました' },
  { inflectedSuffix: 'ません', dictionarySuffix: 'る', name: '-ません' },
  { inflectedSuffix: 'ませんでした', dictionarySuffix: 'る', name: '-ませんでした' },

  // -られる (potential/passive)
  { inflectedSuffix: 'られる', dictionarySuffix: 'る', name: '-られる' },
  { inflectedSuffix: 'られない', dictionarySuffix: 'る', name: '-られない' },
  { inflectedSuffix: 'れる', dictionarySuffix: 'る', name: '-れる (potential)' },
  { inflectedSuffix: 'れない', dictionarySuffix: 'る', name: '-れない (potential)' },

  // -させる (causative)
  { inflectedSuffix: 'させる', dictionarySuffix: 'る', name: '-させる' },
  { inflectedSuffix: 'させない', dictionarySuffix: 'る', name: '-させない' },

  // Volitional
  { inflectedSuffix: 'よう', dictionarySuffix: 'る', name: '-よう' },

  // Imperative
  { inflectedSuffix: 'ろ', dictionarySuffix: 'る', name: '-ろ (imperative)' },

  // -ば (conditional)
  { inflectedSuffix: 'れば', dictionarySuffix: 'る', name: '-れば' },

  // -たら (conditional)
  { inflectedSuffix: 'たら', dictionarySuffix: 'る', name: '-たら' },

  // -たり
  { inflectedSuffix: 'たり', dictionarySuffix: 'る', name: '-たり' },

  // -すぎる (too much)
  { inflectedSuffix: 'すぎる', dictionarySuffix: 'る', name: '-すぎる' },
  { inflectedSuffix: 'すぎ', dictionarySuffix: 'る', name: '-すぎ' },

  // -そう (looks like)
  { inflectedSuffix: 'そう', dictionarySuffix: 'る', name: '-そう' },

  // ============================================
  // Godan (五段) verbs - う verbs
  // ============================================

  // う verbs (買う, 会う, etc.)
  { inflectedSuffix: 'わない', dictionarySuffix: 'う', name: '-ない (う)' },
  { inflectedSuffix: 'わなかった', dictionarySuffix: 'う', name: '-なかった (う)' },
  { inflectedSuffix: 'いたい', dictionarySuffix: 'う', name: '-たい (う)' },
  { inflectedSuffix: 'いたかった', dictionarySuffix: 'う', name: '-たかった (う)' },
  { inflectedSuffix: 'いたくない', dictionarySuffix: 'う', name: '-たくない (う)' },
  { inflectedSuffix: 'って', dictionarySuffix: 'う', name: '-て (う)' },
  { inflectedSuffix: 'っている', dictionarySuffix: 'う', name: '-ている (う)' },
  { inflectedSuffix: 'ってる', dictionarySuffix: 'う', name: '-てる (う)' },
  { inflectedSuffix: 'った', dictionarySuffix: 'う', name: '-た (う)' },
  { inflectedSuffix: 'います', dictionarySuffix: 'う', name: '-ます (う)' },
  { inflectedSuffix: 'いました', dictionarySuffix: 'う', name: '-ました (う)' },
  { inflectedSuffix: 'いません', dictionarySuffix: 'う', name: '-ません (う)' },
  { inflectedSuffix: 'おう', dictionarySuffix: 'う', name: '-よう (う)' },
  { inflectedSuffix: 'える', dictionarySuffix: 'う', name: 'potential (う)' },
  { inflectedSuffix: 'えない', dictionarySuffix: 'う', name: 'potential neg (う)' },
  { inflectedSuffix: 'われる', dictionarySuffix: 'う', name: 'passive (う)' },
  { inflectedSuffix: 'わせる', dictionarySuffix: 'う', name: 'causative (う)' },
  { inflectedSuffix: 'えば', dictionarySuffix: 'う', name: '-ば (う)' },
  { inflectedSuffix: 'ったら', dictionarySuffix: 'う', name: '-たら (う)' },
  { inflectedSuffix: 'ったり', dictionarySuffix: 'う', name: '-たり (う)' },
  { inflectedSuffix: 'いすぎる', dictionarySuffix: 'う', name: '-すぎる (う)' },
  { inflectedSuffix: 'いそう', dictionarySuffix: 'う', name: '-そう (う)' },

  // く verbs (書く, 聞く, etc.)
  { inflectedSuffix: 'かない', dictionarySuffix: 'く', name: '-ない (く)' },
  { inflectedSuffix: 'かなかった', dictionarySuffix: 'く', name: '-なかった (く)' },
  { inflectedSuffix: 'きたい', dictionarySuffix: 'く', name: '-たい (く)' },
  { inflectedSuffix: 'きたかった', dictionarySuffix: 'く', name: '-たかった (く)' },
  { inflectedSuffix: 'きたくない', dictionarySuffix: 'く', name: '-たくない (く)' },
  { inflectedSuffix: 'いて', dictionarySuffix: 'く', name: '-て (く)' },
  { inflectedSuffix: 'いている', dictionarySuffix: 'く', name: '-ている (く)' },
  { inflectedSuffix: 'いてる', dictionarySuffix: 'く', name: '-てる (く)' },
  { inflectedSuffix: 'いた', dictionarySuffix: 'く', name: '-た (く)' },
  { inflectedSuffix: 'きます', dictionarySuffix: 'く', name: '-ます (く)' },
  { inflectedSuffix: 'きました', dictionarySuffix: 'く', name: '-ました (く)' },
  { inflectedSuffix: 'きません', dictionarySuffix: 'く', name: '-ません (く)' },
  { inflectedSuffix: 'こう', dictionarySuffix: 'く', name: '-よう (く)' },
  { inflectedSuffix: 'ける', dictionarySuffix: 'く', name: 'potential (く)' },
  { inflectedSuffix: 'けない', dictionarySuffix: 'く', name: 'potential neg (く)' },
  { inflectedSuffix: 'かれる', dictionarySuffix: 'く', name: 'passive (く)' },
  { inflectedSuffix: 'かせる', dictionarySuffix: 'く', name: 'causative (く)' },
  { inflectedSuffix: 'けば', dictionarySuffix: 'く', name: '-ば (く)' },
  { inflectedSuffix: 'いたら', dictionarySuffix: 'く', name: '-たら (く)' },
  { inflectedSuffix: 'いたり', dictionarySuffix: 'く', name: '-たり (く)' },
  { inflectedSuffix: 'きすぎる', dictionarySuffix: 'く', name: '-すぎる (く)' },
  { inflectedSuffix: 'きそう', dictionarySuffix: 'く', name: '-そう (く)' },

  // ぐ verbs (泳ぐ, 急ぐ, etc.)
  { inflectedSuffix: 'がない', dictionarySuffix: 'ぐ', name: '-ない (ぐ)' },
  { inflectedSuffix: 'がなかった', dictionarySuffix: 'ぐ', name: '-なかった (ぐ)' },
  { inflectedSuffix: 'ぎたい', dictionarySuffix: 'ぐ', name: '-たい (ぐ)' },
  { inflectedSuffix: 'ぎたかった', dictionarySuffix: 'ぐ', name: '-たかった (ぐ)' },
  { inflectedSuffix: 'ぎたくない', dictionarySuffix: 'ぐ', name: '-たくない (ぐ)' },
  { inflectedSuffix: 'いで', dictionarySuffix: 'ぐ', name: '-て (ぐ)' },
  { inflectedSuffix: 'いでいる', dictionarySuffix: 'ぐ', name: '-ている (ぐ)' },
  { inflectedSuffix: 'いでる', dictionarySuffix: 'ぐ', name: '-てる (ぐ)' },
  { inflectedSuffix: 'いだ', dictionarySuffix: 'ぐ', name: '-た (ぐ)' },
  { inflectedSuffix: 'ぎます', dictionarySuffix: 'ぐ', name: '-ます (ぐ)' },
  { inflectedSuffix: 'ぎました', dictionarySuffix: 'ぐ', name: '-ました (ぐ)' },
  { inflectedSuffix: 'ぎません', dictionarySuffix: 'ぐ', name: '-ません (ぐ)' },
  { inflectedSuffix: 'ごう', dictionarySuffix: 'ぐ', name: '-よう (ぐ)' },
  { inflectedSuffix: 'げる', dictionarySuffix: 'ぐ', name: 'potential (ぐ)' },
  { inflectedSuffix: 'げない', dictionarySuffix: 'ぐ', name: 'potential neg (ぐ)' },
  { inflectedSuffix: 'がれる', dictionarySuffix: 'ぐ', name: 'passive (ぐ)' },
  { inflectedSuffix: 'がせる', dictionarySuffix: 'ぐ', name: 'causative (ぐ)' },
  { inflectedSuffix: 'げば', dictionarySuffix: 'ぐ', name: '-ば (ぐ)' },
  { inflectedSuffix: 'いだら', dictionarySuffix: 'ぐ', name: '-たら (ぐ)' },
  { inflectedSuffix: 'いだり', dictionarySuffix: 'ぐ', name: '-たり (ぐ)' },
  { inflectedSuffix: 'ぎすぎる', dictionarySuffix: 'ぐ', name: '-すぎる (ぐ)' },
  { inflectedSuffix: 'ぎそう', dictionarySuffix: 'ぐ', name: '-そう (ぐ)' },

  // す verbs (話す, 出す, etc.)
  { inflectedSuffix: 'さない', dictionarySuffix: 'す', name: '-ない (す)' },
  { inflectedSuffix: 'さなかった', dictionarySuffix: 'す', name: '-なかった (す)' },
  { inflectedSuffix: 'したい', dictionarySuffix: 'す', name: '-たい (す)' },
  { inflectedSuffix: 'したかった', dictionarySuffix: 'す', name: '-たかった (す)' },
  { inflectedSuffix: 'したくない', dictionarySuffix: 'す', name: '-たくない (す)' },
  { inflectedSuffix: 'して', dictionarySuffix: 'す', name: '-て (す)' },
  { inflectedSuffix: 'している', dictionarySuffix: 'す', name: '-ている (す)' },
  { inflectedSuffix: 'してる', dictionarySuffix: 'す', name: '-てる (す)' },
  { inflectedSuffix: 'した', dictionarySuffix: 'す', name: '-た (す)' },
  { inflectedSuffix: 'します', dictionarySuffix: 'す', name: '-ます (す)' },
  { inflectedSuffix: 'しました', dictionarySuffix: 'す', name: '-ました (す)' },
  { inflectedSuffix: 'しません', dictionarySuffix: 'す', name: '-ません (す)' },
  { inflectedSuffix: 'そう', dictionarySuffix: 'す', name: '-よう (す)' },
  { inflectedSuffix: 'せる', dictionarySuffix: 'す', name: 'potential (す)' },
  { inflectedSuffix: 'せない', dictionarySuffix: 'す', name: 'potential neg (す)' },
  { inflectedSuffix: 'される', dictionarySuffix: 'す', name: 'passive (す)' },
  { inflectedSuffix: 'させる', dictionarySuffix: 'す', name: 'causative (す)' },
  { inflectedSuffix: 'せば', dictionarySuffix: 'す', name: '-ば (す)' },
  { inflectedSuffix: 'したら', dictionarySuffix: 'す', name: '-たら (す)' },
  { inflectedSuffix: 'したり', dictionarySuffix: 'す', name: '-たり (す)' },
  { inflectedSuffix: 'しすぎる', dictionarySuffix: 'す', name: '-すぎる (す)' },
  { inflectedSuffix: 'しそう', dictionarySuffix: 'す', name: '-そう (す)' },

  // つ verbs (待つ, 持つ, etc.)
  { inflectedSuffix: 'たない', dictionarySuffix: 'つ', name: '-ない (つ)' },
  { inflectedSuffix: 'たなかった', dictionarySuffix: 'つ', name: '-なかった (つ)' },
  { inflectedSuffix: 'ちたい', dictionarySuffix: 'つ', name: '-たい (つ)' },
  { inflectedSuffix: 'ちたかった', dictionarySuffix: 'つ', name: '-たかった (つ)' },
  { inflectedSuffix: 'ちたくない', dictionarySuffix: 'つ', name: '-たくない (つ)' },
  { inflectedSuffix: 'って', dictionarySuffix: 'つ', name: '-て (つ)' },
  { inflectedSuffix: 'っている', dictionarySuffix: 'つ', name: '-ている (つ)' },
  { inflectedSuffix: 'ってる', dictionarySuffix: 'つ', name: '-てる (つ)' },
  { inflectedSuffix: 'った', dictionarySuffix: 'つ', name: '-た (つ)' },
  { inflectedSuffix: 'ちます', dictionarySuffix: 'つ', name: '-ます (つ)' },
  { inflectedSuffix: 'ちました', dictionarySuffix: 'つ', name: '-ました (つ)' },
  { inflectedSuffix: 'ちません', dictionarySuffix: 'つ', name: '-ません (つ)' },
  { inflectedSuffix: 'とう', dictionarySuffix: 'つ', name: '-よう (つ)' },
  { inflectedSuffix: 'てる', dictionarySuffix: 'つ', name: 'potential (つ)' },
  { inflectedSuffix: 'てない', dictionarySuffix: 'つ', name: 'potential neg (つ)' },
  { inflectedSuffix: 'たれる', dictionarySuffix: 'つ', name: 'passive (つ)' },
  { inflectedSuffix: 'たせる', dictionarySuffix: 'つ', name: 'causative (つ)' },
  { inflectedSuffix: 'てば', dictionarySuffix: 'つ', name: '-ば (つ)' },
  { inflectedSuffix: 'ったら', dictionarySuffix: 'つ', name: '-たら (つ)' },
  { inflectedSuffix: 'ったり', dictionarySuffix: 'つ', name: '-たり (つ)' },
  { inflectedSuffix: 'ちすぎる', dictionarySuffix: 'つ', name: '-すぎる (つ)' },
  { inflectedSuffix: 'ちそう', dictionarySuffix: 'つ', name: '-そう (つ)' },

  // ぬ verbs (死ぬ) - rare
  { inflectedSuffix: 'なない', dictionarySuffix: 'ぬ', name: '-ない (ぬ)' },
  { inflectedSuffix: 'ななかった', dictionarySuffix: 'ぬ', name: '-なかった (ぬ)' },
  { inflectedSuffix: 'にたい', dictionarySuffix: 'ぬ', name: '-たい (ぬ)' },
  { inflectedSuffix: 'んで', dictionarySuffix: 'ぬ', name: '-て (ぬ)' },
  { inflectedSuffix: 'んでいる', dictionarySuffix: 'ぬ', name: '-ている (ぬ)' },
  { inflectedSuffix: 'んでる', dictionarySuffix: 'ぬ', name: '-てる (ぬ)' },
  { inflectedSuffix: 'んだ', dictionarySuffix: 'ぬ', name: '-た (ぬ)' },
  { inflectedSuffix: 'にます', dictionarySuffix: 'ぬ', name: '-ます (ぬ)' },
  { inflectedSuffix: 'のう', dictionarySuffix: 'ぬ', name: '-よう (ぬ)' },
  { inflectedSuffix: 'ねる', dictionarySuffix: 'ぬ', name: 'potential (ぬ)' },
  { inflectedSuffix: 'ねば', dictionarySuffix: 'ぬ', name: '-ば (ぬ)' },
  { inflectedSuffix: 'んだら', dictionarySuffix: 'ぬ', name: '-たら (ぬ)' },
  { inflectedSuffix: 'んだり', dictionarySuffix: 'ぬ', name: '-たり (ぬ)' },

  // ぶ verbs (飛ぶ, 呼ぶ, etc.)
  { inflectedSuffix: 'ばない', dictionarySuffix: 'ぶ', name: '-ない (ぶ)' },
  { inflectedSuffix: 'ばなかった', dictionarySuffix: 'ぶ', name: '-なかった (ぶ)' },
  { inflectedSuffix: 'びたい', dictionarySuffix: 'ぶ', name: '-たい (ぶ)' },
  { inflectedSuffix: 'びたかった', dictionarySuffix: 'ぶ', name: '-たかった (ぶ)' },
  { inflectedSuffix: 'びたくない', dictionarySuffix: 'ぶ', name: '-たくない (ぶ)' },
  { inflectedSuffix: 'んで', dictionarySuffix: 'ぶ', name: '-て (ぶ)' },
  { inflectedSuffix: 'んでいる', dictionarySuffix: 'ぶ', name: '-ている (ぶ)' },
  { inflectedSuffix: 'んでる', dictionarySuffix: 'ぶ', name: '-てる (ぶ)' },
  { inflectedSuffix: 'んだ', dictionarySuffix: 'ぶ', name: '-た (ぶ)' },
  { inflectedSuffix: 'びます', dictionarySuffix: 'ぶ', name: '-ます (ぶ)' },
  { inflectedSuffix: 'びました', dictionarySuffix: 'ぶ', name: '-ました (ぶ)' },
  { inflectedSuffix: 'びません', dictionarySuffix: 'ぶ', name: '-ません (ぶ)' },
  { inflectedSuffix: 'ぼう', dictionarySuffix: 'ぶ', name: '-よう (ぶ)' },
  { inflectedSuffix: 'べる', dictionarySuffix: 'ぶ', name: 'potential (ぶ)' },
  { inflectedSuffix: 'べない', dictionarySuffix: 'ぶ', name: 'potential neg (ぶ)' },
  { inflectedSuffix: 'ばれる', dictionarySuffix: 'ぶ', name: 'passive (ぶ)' },
  { inflectedSuffix: 'ばせる', dictionarySuffix: 'ぶ', name: 'causative (ぶ)' },
  { inflectedSuffix: 'べば', dictionarySuffix: 'ぶ', name: '-ば (ぶ)' },
  { inflectedSuffix: 'んだら', dictionarySuffix: 'ぶ', name: '-たら (ぶ)' },
  { inflectedSuffix: 'んだり', dictionarySuffix: 'ぶ', name: '-たり (ぶ)' },
  { inflectedSuffix: 'びすぎる', dictionarySuffix: 'ぶ', name: '-すぎる (ぶ)' },
  { inflectedSuffix: 'びそう', dictionarySuffix: 'ぶ', name: '-そう (ぶ)' },

  // む verbs (読む, 飲む, etc.)
  { inflectedSuffix: 'まない', dictionarySuffix: 'む', name: '-ない (む)' },
  { inflectedSuffix: 'まなかった', dictionarySuffix: 'む', name: '-なかった (む)' },
  { inflectedSuffix: 'みたい', dictionarySuffix: 'む', name: '-たい (む)' },
  { inflectedSuffix: 'みたかった', dictionarySuffix: 'む', name: '-たかった (む)' },
  { inflectedSuffix: 'みたくない', dictionarySuffix: 'む', name: '-たくない (む)' },
  { inflectedSuffix: 'んで', dictionarySuffix: 'む', name: '-て (む)' },
  { inflectedSuffix: 'んでいる', dictionarySuffix: 'む', name: '-ている (む)' },
  { inflectedSuffix: 'んでる', dictionarySuffix: 'む', name: '-てる (む)' },
  { inflectedSuffix: 'んだ', dictionarySuffix: 'む', name: '-た (む)' },
  { inflectedSuffix: 'みます', dictionarySuffix: 'む', name: '-ます (む)' },
  { inflectedSuffix: 'みました', dictionarySuffix: 'む', name: '-ました (む)' },
  { inflectedSuffix: 'みません', dictionarySuffix: 'む', name: '-ません (む)' },
  { inflectedSuffix: 'もう', dictionarySuffix: 'む', name: '-よう (む)' },
  { inflectedSuffix: 'める', dictionarySuffix: 'む', name: 'potential (む)' },
  { inflectedSuffix: 'めない', dictionarySuffix: 'む', name: 'potential neg (む)' },
  { inflectedSuffix: 'まれる', dictionarySuffix: 'む', name: 'passive (む)' },
  { inflectedSuffix: 'ませる', dictionarySuffix: 'む', name: 'causative (む)' },
  { inflectedSuffix: 'めば', dictionarySuffix: 'む', name: '-ば (む)' },
  { inflectedSuffix: 'んだら', dictionarySuffix: 'む', name: '-たら (む)' },
  { inflectedSuffix: 'んだり', dictionarySuffix: 'む', name: '-たり (む)' },
  { inflectedSuffix: 'みすぎる', dictionarySuffix: 'む', name: '-すぎる (む)' },
  { inflectedSuffix: 'みそう', dictionarySuffix: 'む', name: '-そう (む)' },

  // る verbs (godan: 帰る, 走る, etc.) - note: different from ichidan る
  { inflectedSuffix: 'らない', dictionarySuffix: 'る', name: '-ない (godan る)' },
  { inflectedSuffix: 'らなかった', dictionarySuffix: 'る', name: '-なかった (godan る)' },
  { inflectedSuffix: 'りたい', dictionarySuffix: 'る', name: '-たい (godan る)' },
  { inflectedSuffix: 'りたかった', dictionarySuffix: 'る', name: '-たかった (godan る)' },
  { inflectedSuffix: 'りたくない', dictionarySuffix: 'る', name: '-たくない (godan る)' },
  { inflectedSuffix: 'って', dictionarySuffix: 'る', name: '-て (godan る)' },
  { inflectedSuffix: 'っている', dictionarySuffix: 'る', name: '-ている (godan る)' },
  { inflectedSuffix: 'ってる', dictionarySuffix: 'る', name: '-てる (godan る)' },
  { inflectedSuffix: 'った', dictionarySuffix: 'る', name: '-た (godan る)' },
  { inflectedSuffix: 'ります', dictionarySuffix: 'る', name: '-ます (godan る)' },
  { inflectedSuffix: 'りました', dictionarySuffix: 'る', name: '-ました (godan る)' },
  { inflectedSuffix: 'りません', dictionarySuffix: 'る', name: '-ません (godan る)' },
  { inflectedSuffix: 'ろう', dictionarySuffix: 'る', name: '-よう (godan る)' },
  { inflectedSuffix: 'れる', dictionarySuffix: 'る', name: 'potential (godan る)' },
  { inflectedSuffix: 'れない', dictionarySuffix: 'る', name: 'potential neg (godan る)' },
  { inflectedSuffix: 'られる', dictionarySuffix: 'る', name: 'passive (godan る)' },
  { inflectedSuffix: 'らせる', dictionarySuffix: 'る', name: 'causative (godan る)' },
  { inflectedSuffix: 'れば', dictionarySuffix: 'る', name: '-ば (godan る)' },
  { inflectedSuffix: 'ったら', dictionarySuffix: 'る', name: '-たら (godan る)' },
  { inflectedSuffix: 'ったり', dictionarySuffix: 'る', name: '-たり (godan る)' },
  { inflectedSuffix: 'りすぎる', dictionarySuffix: 'る', name: '-すぎる (godan る)' },
  { inflectedSuffix: 'りそう', dictionarySuffix: 'る', name: '-そう (godan る)' },

  // ============================================
  // Irregular verbs
  // ============================================

  // する (to do)
  { inflectedSuffix: 'しない', dictionarySuffix: 'する', name: '-ない (する)' },
  { inflectedSuffix: 'しなかった', dictionarySuffix: 'する', name: '-なかった (する)' },
  { inflectedSuffix: 'したい', dictionarySuffix: 'する', name: '-たい (する)' },
  { inflectedSuffix: 'したかった', dictionarySuffix: 'する', name: '-たかった (する)' },
  { inflectedSuffix: 'したくない', dictionarySuffix: 'する', name: '-たくない (する)' },
  { inflectedSuffix: 'して', dictionarySuffix: 'する', name: '-て (する)' },
  { inflectedSuffix: 'している', dictionarySuffix: 'する', name: '-ている (する)' },
  { inflectedSuffix: 'してる', dictionarySuffix: 'する', name: '-てる (する)' },
  { inflectedSuffix: 'した', dictionarySuffix: 'する', name: '-た (する)' },
  { inflectedSuffix: 'します', dictionarySuffix: 'する', name: '-ます (する)' },
  { inflectedSuffix: 'しました', dictionarySuffix: 'する', name: '-ました (する)' },
  { inflectedSuffix: 'しません', dictionarySuffix: 'する', name: '-ません (する)' },
  { inflectedSuffix: 'しよう', dictionarySuffix: 'する', name: '-よう (する)' },
  { inflectedSuffix: 'できる', dictionarySuffix: 'する', name: 'potential (する)' },
  { inflectedSuffix: 'できない', dictionarySuffix: 'する', name: 'potential neg (する)' },
  { inflectedSuffix: 'される', dictionarySuffix: 'する', name: 'passive (する)' },
  { inflectedSuffix: 'させる', dictionarySuffix: 'する', name: 'causative (する)' },
  { inflectedSuffix: 'すれば', dictionarySuffix: 'する', name: '-ば (する)' },
  { inflectedSuffix: 'したら', dictionarySuffix: 'する', name: '-たら (する)' },
  { inflectedSuffix: 'したり', dictionarySuffix: 'する', name: '-たり (する)' },
  { inflectedSuffix: 'しすぎる', dictionarySuffix: 'する', name: '-すぎる (する)' },
  { inflectedSuffix: 'しそう', dictionarySuffix: 'する', name: '-そう (する)' },

  // くる (to come)
  { inflectedSuffix: 'こない', dictionarySuffix: 'くる', name: '-ない (くる)' },
  { inflectedSuffix: 'こなかった', dictionarySuffix: 'くる', name: '-なかった (くる)' },
  { inflectedSuffix: 'きたい', dictionarySuffix: 'くる', name: '-たい (くる)' },
  { inflectedSuffix: 'きたかった', dictionarySuffix: 'くる', name: '-たかった (くる)' },
  { inflectedSuffix: 'きたくない', dictionarySuffix: 'くる', name: '-たくない (くる)' },
  { inflectedSuffix: 'きて', dictionarySuffix: 'くる', name: '-て (くる)' },
  { inflectedSuffix: 'きている', dictionarySuffix: 'くる', name: '-ている (くる)' },
  { inflectedSuffix: 'きてる', dictionarySuffix: 'くる', name: '-てる (くる)' },
  { inflectedSuffix: 'きた', dictionarySuffix: 'くる', name: '-た (くる)' },
  { inflectedSuffix: 'きます', dictionarySuffix: 'くる', name: '-ます (くる)' },
  { inflectedSuffix: 'きました', dictionarySuffix: 'くる', name: '-ました (くる)' },
  { inflectedSuffix: 'きません', dictionarySuffix: 'くる', name: '-ません (くる)' },
  { inflectedSuffix: 'こよう', dictionarySuffix: 'くる', name: '-よう (くる)' },
  { inflectedSuffix: 'こられる', dictionarySuffix: 'くる', name: 'potential (くる)' },
  { inflectedSuffix: 'こられない', dictionarySuffix: 'くる', name: 'potential neg (くる)' },
  { inflectedSuffix: 'これる', dictionarySuffix: 'くる', name: 'potential colloquial (くる)' },
  { inflectedSuffix: 'これない', dictionarySuffix: 'くる', name: 'potential neg colloquial (くる)' },
  { inflectedSuffix: 'こさせる', dictionarySuffix: 'くる', name: 'causative (くる)' },
  { inflectedSuffix: 'くれば', dictionarySuffix: 'くる', name: '-ば (くる)' },
  { inflectedSuffix: 'きたら', dictionarySuffix: 'くる', name: '-たら (くる)' },
  { inflectedSuffix: 'きたり', dictionarySuffix: 'くる', name: '-たり (くる)' },
  { inflectedSuffix: 'きすぎる', dictionarySuffix: 'くる', name: '-すぎる (くる)' },
  { inflectedSuffix: 'きそう', dictionarySuffix: 'くる', name: '-そう (くる)' },

  // 来る (kanji version)
  { inflectedSuffix: '来ない', dictionarySuffix: '来る', name: '-ない (来る)' },
  { inflectedSuffix: '来なかった', dictionarySuffix: '来る', name: '-なかった (来る)' },
  { inflectedSuffix: '来たい', dictionarySuffix: '来る', name: '-たい (来る)' },
  { inflectedSuffix: '来て', dictionarySuffix: '来る', name: '-て (来る)' },
  { inflectedSuffix: '来ている', dictionarySuffix: '来る', name: '-ている (来る)' },
  { inflectedSuffix: '来た', dictionarySuffix: '来る', name: '-た (来る)' },
  { inflectedSuffix: '来ます', dictionarySuffix: '来る', name: '-ます (来る)' },
  { inflectedSuffix: '来ました', dictionarySuffix: '来る', name: '-ました (来る)' },
  { inflectedSuffix: '来ません', dictionarySuffix: '来る', name: '-ません (来る)' },

  // 行く (to go) - special て form
  { inflectedSuffix: 'いかない', dictionarySuffix: 'いく', name: '-ない (いく)' },
  { inflectedSuffix: 'いかなかった', dictionarySuffix: 'いく', name: '-なかった (いく)' },
  { inflectedSuffix: 'いきたい', dictionarySuffix: 'いく', name: '-たい (いく)' },
  { inflectedSuffix: 'いって', dictionarySuffix: 'いく', name: '-て (いく)' },
  { inflectedSuffix: 'いっている', dictionarySuffix: 'いく', name: '-ている (いく)' },
  { inflectedSuffix: 'いってる', dictionarySuffix: 'いく', name: '-てる (いく)' },
  { inflectedSuffix: 'いった', dictionarySuffix: 'いく', name: '-た (いく)' },
  { inflectedSuffix: 'いきます', dictionarySuffix: 'いく', name: '-ます (いく)' },
  { inflectedSuffix: 'いきました', dictionarySuffix: 'いく', name: '-ました (いく)' },
  { inflectedSuffix: 'いきません', dictionarySuffix: 'いく', name: '-ません (いく)' },
  { inflectedSuffix: 'いこう', dictionarySuffix: 'いく', name: '-よう (いく)' },
  { inflectedSuffix: 'いける', dictionarySuffix: 'いく', name: 'potential (いく)' },
  { inflectedSuffix: 'いけない', dictionarySuffix: 'いく', name: 'potential neg (いく)' },
  { inflectedSuffix: 'いけば', dictionarySuffix: 'いく', name: '-ば (いく)' },
  { inflectedSuffix: 'いったら', dictionarySuffix: 'いく', name: '-たら (いく)' },
  { inflectedSuffix: 'いったり', dictionarySuffix: 'いく', name: '-たり (いく)' },

  // 行く (kanji version)
  { inflectedSuffix: '行かない', dictionarySuffix: '行く', name: '-ない (行く)' },
  { inflectedSuffix: '行かなかった', dictionarySuffix: '行く', name: '-なかった (行く)' },
  { inflectedSuffix: '行きたい', dictionarySuffix: '行く', name: '-たい (行く)' },
  { inflectedSuffix: '行って', dictionarySuffix: '行く', name: '-て (行く)' },
  { inflectedSuffix: '行っている', dictionarySuffix: '行く', name: '-ている (行く)' },
  { inflectedSuffix: '行った', dictionarySuffix: '行く', name: '-た (行く)' },
  { inflectedSuffix: '行きます', dictionarySuffix: '行く', name: '-ます (行く)' },
  { inflectedSuffix: '行きました', dictionarySuffix: '行く', name: '-ました (行く)' },
  { inflectedSuffix: '行きません', dictionarySuffix: '行く', name: '-ません (行く)' },
  { inflectedSuffix: '行こう', dictionarySuffix: '行く', name: '-よう (行く)' },
  { inflectedSuffix: '行ける', dictionarySuffix: '行く', name: 'potential (行く)' },
  { inflectedSuffix: '行けない', dictionarySuffix: '行く', name: 'potential neg (行く)' },
  { inflectedSuffix: '行けば', dictionarySuffix: '行く', name: '-ば (行く)' },
  { inflectedSuffix: '行ったら', dictionarySuffix: '行く', name: '-たら (行く)' },

  // ============================================
  // I-adjectives (形容詞)
  // ============================================
  { inflectedSuffix: 'くない', dictionarySuffix: 'い', name: '-くない' },
  { inflectedSuffix: 'くなかった', dictionarySuffix: 'い', name: '-くなかった' },
  { inflectedSuffix: 'かった', dictionarySuffix: 'い', name: '-かった' },
  { inflectedSuffix: 'くて', dictionarySuffix: 'い', name: '-くて' },
  { inflectedSuffix: 'く', dictionarySuffix: 'い', name: '-く (adverb)' },
  { inflectedSuffix: 'ければ', dictionarySuffix: 'い', name: '-ければ' },
  { inflectedSuffix: 'かったら', dictionarySuffix: 'い', name: '-かったら' },
  { inflectedSuffix: 'かったり', dictionarySuffix: 'い', name: '-かったり' },
  { inflectedSuffix: 'さ', dictionarySuffix: 'い', name: '-さ (noun)' },
  { inflectedSuffix: 'すぎる', dictionarySuffix: 'い', name: '-すぎる (adj)' },
  { inflectedSuffix: 'そう', dictionarySuffix: 'い', name: '-そう (adj)' },

  // ============================================
  // Additional common patterns
  // ============================================

  // -ちゃう/-じゃう (casual -てしまう)
  { inflectedSuffix: 'ちゃう', dictionarySuffix: 'る', name: '-ちゃう' },
  { inflectedSuffix: 'ちゃった', dictionarySuffix: 'る', name: '-ちゃった' },
  { inflectedSuffix: 'じゃう', dictionarySuffix: 'る', name: '-じゃう' },
  { inflectedSuffix: 'じゃった', dictionarySuffix: 'る', name: '-じゃった' },

  // -ておく/-とく (preparation)
  { inflectedSuffix: 'ておく', dictionarySuffix: 'る', name: '-ておく' },
  { inflectedSuffix: 'とく', dictionarySuffix: 'る', name: '-とく' },
  { inflectedSuffix: 'といた', dictionarySuffix: 'る', name: '-といた' },

  // -なきゃ/-なくちゃ (must do)
  { inflectedSuffix: 'なきゃ', dictionarySuffix: 'る', name: '-なきゃ' },
  { inflectedSuffix: 'なくちゃ', dictionarySuffix: 'る', name: '-なくちゃ' },
];

// Sort rules by suffix length (longer first) for greedy matching
const SORTED_RULES = [...DEINFLECTION_RULES].sort(
  (a, b) => b.inflectedSuffix.length - a.inflectedSuffix.length
);

/**
 * Deinflect a Japanese word to find possible dictionary forms
 * @param text - The inflected word to deinflect
 * @returns Array of possible dictionary forms with their transformation rules
 */
export function deinflect(text: string): DeinflectionResult[] {
  const results: DeinflectionResult[] = [];
  const seen = new Set<string>();

  // Always include the original text as a possible result
  results.push({ text, rules: [] });
  seen.add(text);

  // Apply single-level deinflection
  for (const rule of SORTED_RULES) {
    if (text.endsWith(rule.inflectedSuffix)) {
      const base = text.slice(0, -rule.inflectedSuffix.length) + rule.dictionarySuffix;
      if (base.length > 0 && !seen.has(base)) {
        results.push({ text: base, rules: [rule.name] });
        seen.add(base);

        // Apply second level of deinflection for compound inflections
        // e.g., 食べたくなかった → 食べたい → 食べる
        for (const rule2 of SORTED_RULES) {
          if (base.endsWith(rule2.inflectedSuffix)) {
            const base2 = base.slice(0, -rule2.inflectedSuffix.length) + rule2.dictionarySuffix;
            if (base2.length > 0 && !seen.has(base2)) {
              results.push({ text: base2, rules: [rule.name, rule2.name] });
              seen.add(base2);
            }
          }
        }
      }
    }
  }

  return results;
}

/**
 * Get all possible dictionary forms from an inflected word
 * This is a convenience function that returns just the text forms
 * @param text - The inflected word
 * @returns Array of possible dictionary form strings
 */
export function getDictionaryForms(text: string): string[] {
  return deinflect(text).map((r) => r.text);
}
