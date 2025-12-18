import type { SQLiteDatabase } from 'expo-sqlite';
import { toHiragana, isRomaji } from '@/utils/wanakana';
import { getDictionaryForms } from '@/utils/deinflect';

export type DictionaryEntry = {
  id: number;
  kanji: string | null;
  reading: string;
  readingRomaji: string | null;
  definitions: string[];
  partOfSpeech: string[];
  common: boolean;
  frequencyScore: number;
};

type DictionaryRow = {
  id: number;
  kanji: string | null;
  reading: string;
  reading_romaji: string | null;
  definitions: string;
  part_of_speech: string | null;
  frequency_score: number;
  common: number;
};

/**
 * Search dictionary entries with deinflection support
 * @param db - SQLite database instance
 * @param query - Search query (can be romaji, hiragana, katakana, kanji, or mixed)
 * @param limit - Maximum number of results
 * @param offset - Offset for pagination
 * @returns Array of dictionary entries
 */
export async function searchDictionary(
  db: SQLiteDatabase,
  query: string,
  limit: number = 20,
  offset: number = 0
): Promise<DictionaryEntry[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  // Convert romaji to hiragana for searching
  let searchQuery = trimmedQuery;
  if (isRomaji(trimmedQuery)) {
    searchQuery = toHiragana(trimmedQuery);
  }

  // Get deinflected forms for the search query
  const deinflectedForms = getDictionaryForms(searchQuery);
  
  // Also add the original query if different
  const searchTerms = new Set<string>([trimmedQuery, searchQuery, ...deinflectedForms]);
  
  // Build the query with multiple search conditions
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  for (const term of searchTerms) {
    // Exact match conditions (higher priority)
    conditions.push('(kanji = ? OR reading = ? OR reading_romaji = ?)');
    params.push(term, term, term);
  }

  // Also add prefix search for partial matches
  const prefixPattern = `${searchQuery}%`;
  conditions.push('(kanji LIKE ? OR reading LIKE ? OR reading_romaji LIKE ?)');
  params.push(prefixPattern, prefixPattern, prefixPattern);

  params.push(limit, offset);

  // Query with scoring for better relevance
  // Exact matches score higher, then common words, then by frequency
  const sql = `
    SELECT 
      id, kanji, reading, reading_romaji, definitions, part_of_speech, frequency_score, common,
      CASE 
        WHEN kanji = ? OR reading = ? THEN 1000
        WHEN reading_romaji = ? THEN 900
        WHEN kanji LIKE ? OR reading LIKE ? THEN 500
        ELSE 0
      END as match_score
    FROM dict.dictionary
    WHERE ${conditions.join(' OR ')}
    ORDER BY 
      match_score DESC,
      common DESC,
      frequency_score DESC,
      LENGTH(reading) ASC
    LIMIT ? OFFSET ?
  `;

  // Add match score params at the beginning
  const matchParams = [searchQuery, searchQuery, searchQuery, `${searchQuery}%`, `${searchQuery}%`, ...params];

  const rows = await db.getAllAsync<DictionaryRow & { match_score: number }>(sql, matchParams);

  return rows.map(mapRowToEntry);
}

/**
 * Get a single dictionary entry by ID
 */
export async function getDictionaryEntry(
  db: SQLiteDatabase,
  id: number
): Promise<DictionaryEntry | null> {
  const row = await db.getFirstAsync<DictionaryRow>(
    `SELECT * FROM dict.dictionary WHERE id = ?`,
    [id]
  );

  return row ? mapRowToEntry(row) : null;
}

/**
 * Check if a dictionary entry is already in the deck
 */
export async function isInDeck(
  db: SQLiteDatabase,
  dictionaryId: number
): Promise<boolean> {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM deck_cards WHERE dictionary_id = ?`,
    [dictionaryId]
  );

  return (result?.count ?? 0) > 0;
}

/**
 * Get multiple deck status at once (for performance)
 */
export async function getInDeckStatus(
  db: SQLiteDatabase,
  dictionaryIds: number[]
): Promise<Set<number>> {
  if (dictionaryIds.length === 0) return new Set();

  const placeholders = dictionaryIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<{ dictionary_id: number }>(
    `SELECT dictionary_id FROM deck_cards WHERE dictionary_id IN (${placeholders})`,
    dictionaryIds
  );

  return new Set(rows.map((r) => r.dictionary_id));
}

function mapRowToEntry(row: DictionaryRow): DictionaryEntry {
  return {
    id: row.id,
    kanji: row.kanji,
    reading: row.reading,
    readingRomaji: row.reading_romaji,
    definitions: JSON.parse(row.definitions),
    partOfSpeech: row.part_of_speech ? JSON.parse(row.part_of_speech) : [],
    frequencyScore: row.frequency_score ?? 0,
    common: row.common === 1,
  };
}
