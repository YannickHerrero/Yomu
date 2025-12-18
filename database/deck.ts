import type { SQLiteDatabase } from 'expo-sqlite';
import { calculateDueDate } from '@/utils/srs';
import { SRS_STAGES } from '@/constants/srs';

export type DeckCard = {
  id: number;
  dictionaryId: number;
  addedAt: string;
  dueDate: string | null;
  stage: number;
  currentIncorrectCount: number;
  // Joined from dictionary
  kanji: string | null;
  reading: string;
  definitions: string[];
};

type DeckCardRow = {
  id: number;
  dictionary_id: number;
  added_at: string;
  due_date: string | null;
  stage: number;
  current_incorrect_count: number;
  kanji: string | null;
  reading: string;
  definitions: string;
};

/**
 * Add a new card to the deck from dictionary
 */
export async function addCardToDeck(
  db: SQLiteDatabase,
  dictionaryId: number
): Promise<number> {
  const now = new Date().toISOString();
  const dueDate = calculateDueDate(SRS_STAGES.APPRENTICE_1);

  const result = await db.runAsync(
    `INSERT INTO deck_cards (dictionary_id, added_at, due_date, stage, current_incorrect_count)
     VALUES (?, ?, ?, ?, ?)`,
    [dictionaryId, now, dueDate, SRS_STAGES.APPRENTICE_1, 0]
  );

  return result.lastInsertRowId;
}

/**
 * Remove a card from the deck by card ID
 */
export async function removeCardFromDeck(
  db: SQLiteDatabase,
  cardId: number
): Promise<void> {
  await db.runAsync(`DELETE FROM deck_cards WHERE id = ?`, [cardId]);
}

/**
 * Remove a card from the deck by dictionary ID
 */
export async function removeCardByDictionaryId(
  db: SQLiteDatabase,
  dictionaryId: number
): Promise<void> {
  await db.runAsync(`DELETE FROM deck_cards WHERE dictionary_id = ?`, [dictionaryId]);
}

/**
 * Get all cards due for review
 */
export async function getDueCards(db: SQLiteDatabase): Promise<DeckCard[]> {
  const now = new Date().toISOString();

  const rows = await db.getAllAsync<DeckCardRow>(
    `SELECT dc.*, d.kanji, d.reading, d.definitions
     FROM deck_cards dc
     JOIN dictionary d ON dc.dictionary_id = d.id
     WHERE dc.stage < ? AND dc.due_date <= ?
     ORDER BY dc.due_date ASC`,
    [SRS_STAGES.BURNED, now]
  );

  return rows.map(mapRowToCard);
}

/**
 * Get all cards in the deck
 */
export async function getAllCards(db: SQLiteDatabase): Promise<DeckCard[]> {
  const rows = await db.getAllAsync<DeckCardRow>(
    `SELECT dc.*, d.kanji, d.reading, d.definitions
     FROM deck_cards dc
     JOIN dictionary d ON dc.dictionary_id = d.id
     WHERE dc.stage < ?
     ORDER BY dc.added_at DESC`,
    [SRS_STAGES.BURNED]
  );

  return rows.map(mapRowToCard);
}

/**
 * Get all burned cards
 */
export async function getBurnedCards(db: SQLiteDatabase): Promise<DeckCard[]> {
  const rows = await db.getAllAsync<DeckCardRow>(
    `SELECT dc.*, d.kanji, d.reading, d.definitions
     FROM deck_cards dc
     JOIN dictionary d ON dc.dictionary_id = d.id
     WHERE dc.stage = ?
     ORDER BY dc.added_at DESC`,
    [SRS_STAGES.BURNED]
  );

  return rows.map(mapRowToCard);
}

/**
 * Update card after review
 */
export async function updateCardAfterReview(
  db: SQLiteDatabase,
  cardId: number,
  newStage: number,
  incorrectCount: number
): Promise<void> {
  const dueDate = calculateDueDate(newStage);

  await db.runAsync(
    `UPDATE deck_cards 
     SET stage = ?, due_date = ?, current_incorrect_count = ?
     WHERE id = ?`,
    [newStage, dueDate, incorrectCount, cardId]
  );
}

/**
 * Unburn a card (reset to Apprentice 1)
 */
export async function unburnCard(
  db: SQLiteDatabase,
  cardId: number
): Promise<void> {
  const dueDate = calculateDueDate(SRS_STAGES.APPRENTICE_1);

  await db.runAsync(
    `UPDATE deck_cards 
     SET stage = ?, due_date = ?, current_incorrect_count = 0
     WHERE id = ?`,
    [SRS_STAGES.APPRENTICE_1, dueDate, cardId]
  );
}

/**
 * Get deck statistics
 */
export async function getDeckStats(db: SQLiteDatabase): Promise<{
  totalCards: number;
  activeCards: number;
  burnedCards: number;
  dueNow: number;
  apprentice: number;
  guru: number;
  master: number;
  enlightened: number;
}> {
  const now = new Date().toISOString();

  const [total, active, burned, due, distribution] = await Promise.all([
    db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM deck_cards`),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM deck_cards WHERE stage < ?`,
      [SRS_STAGES.BURNED]
    ),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM deck_cards WHERE stage = ?`,
      [SRS_STAGES.BURNED]
    ),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM deck_cards WHERE stage < ? AND due_date <= ?`,
      [SRS_STAGES.BURNED, now]
    ),
    db.getAllAsync<{ group_name: string; count: number }>(
      `SELECT 
        CASE 
          WHEN stage BETWEEN 1 AND 4 THEN 'apprentice'
          WHEN stage BETWEEN 5 AND 6 THEN 'guru'
          WHEN stage = 7 THEN 'master'
          WHEN stage = 8 THEN 'enlightened'
        END as group_name,
        COUNT(*) as count
       FROM deck_cards
       WHERE stage < ?
       GROUP BY group_name`,
      [SRS_STAGES.BURNED]
    ),
  ]);

  const distMap = Object.fromEntries(distribution.map((d) => [d.group_name, d.count]));

  return {
    totalCards: total?.count ?? 0,
    activeCards: active?.count ?? 0,
    burnedCards: burned?.count ?? 0,
    dueNow: due?.count ?? 0,
    apprentice: distMap['apprentice'] ?? 0,
    guru: distMap['guru'] ?? 0,
    master: distMap['master'] ?? 0,
    enlightened: distMap['enlightened'] ?? 0,
  };
}

function mapRowToCard(row: DeckCardRow): DeckCard {
  return {
    id: row.id,
    dictionaryId: row.dictionary_id,
    addedAt: row.added_at,
    dueDate: row.due_date,
    stage: row.stage,
    currentIncorrectCount: row.current_incorrect_count,
    kanji: row.kanji,
    reading: row.reading,
    definitions: JSON.parse(row.definitions),
  };
}
