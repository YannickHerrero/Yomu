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
  // Card-specific content
  exampleSentence: string | null;
  translatedSentence: string | null;
  imagePath: string | null;
};

export type AddCardData = {
  dictionaryId: number;
  exampleSentence?: string | null;
  translatedSentence?: string | null;
  imagePath?: string | null;
  sessionId?: number;
};

export type UpdateCardData = {
  exampleSentence?: string | null;
  translatedSentence?: string | null;
  imagePath?: string | null;
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
  example_sentence: string | null;
  translated_sentence: string | null;
  image_path: string | null;
};

/**
 * Add a new card to the deck from dictionary
 */
export async function addCardToDeck(
  db: SQLiteDatabase,
  data: AddCardData
): Promise<number> {
  const now = new Date().toISOString();
  // New cards are immediately due (stage 0 has interval of 0)
  const dueDate = calculateDueDate(SRS_STAGES.NEW);

  const result = await db.runAsync(
    `INSERT INTO deck_cards (
      dictionary_id, added_at, due_date, stage, current_incorrect_count, 
      session_id, example_sentence, translated_sentence, image_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.dictionaryId,
      now,
      dueDate,
      SRS_STAGES.NEW,
      0,
      data.sessionId ?? null,
      data.exampleSentence ?? null,
      data.translatedSentence ?? null,
      data.imagePath ?? null,
    ]
  );

  return result.lastInsertRowId;
}

/**
 * Update a card's content (sentence, translation, image)
 */
export async function updateCardContent(
  db: SQLiteDatabase,
  cardId: number,
  data: UpdateCardData
): Promise<void> {
  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (data.exampleSentence !== undefined) {
    updates.push('example_sentence = ?');
    values.push(data.exampleSentence);
  }
  if (data.translatedSentence !== undefined) {
    updates.push('translated_sentence = ?');
    values.push(data.translatedSentence);
  }
  if (data.imagePath !== undefined) {
    updates.push('image_path = ?');
    values.push(data.imagePath);
  }

  if (updates.length === 0) return;

  values.push(cardId.toString());
  await db.runAsync(
    `UPDATE deck_cards SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * Get a single card by ID
 */
export async function getCardById(
  db: SQLiteDatabase,
  cardId: number
): Promise<DeckCard | null> {
  const row = await db.getFirstAsync<DeckCardRow>(
    `SELECT dc.*, d.kanji, d.reading, d.definitions
     FROM deck_cards dc
     JOIN dict.dictionary d ON dc.dictionary_id = d.id
     WHERE dc.id = ?`,
    [cardId]
  );

  return row ? mapRowToCard(row) : null;
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
 * Get all cards due for review (excludes new cards - stage 0)
 */
export async function getDueCards(db: SQLiteDatabase): Promise<DeckCard[]> {
  const now = new Date().toISOString();

  const rows = await db.getAllAsync<DeckCardRow>(
    `SELECT dc.id, dc.dictionary_id, dc.added_at, dc.due_date, dc.stage, 
            dc.current_incorrect_count, dc.example_sentence, dc.translated_sentence, 
            dc.image_path, d.kanji, d.reading, d.definitions
     FROM deck_cards dc
     JOIN dict.dictionary d ON dc.dictionary_id = d.id
     WHERE dc.stage > ? AND dc.stage < ? AND dc.due_date <= ?
     ORDER BY dc.due_date ASC`,
    [SRS_STAGES.NEW, SRS_STAGES.BURNED, now]
  );

  return rows.map(mapRowToCard);
}

/**
 * Get new cards (stage 0) - ordered by added date
 */
export async function getNewCards(db: SQLiteDatabase): Promise<DeckCard[]> {
  const rows = await db.getAllAsync<DeckCardRow>(
    `SELECT dc.id, dc.dictionary_id, dc.added_at, dc.due_date, dc.stage, 
            dc.current_incorrect_count, dc.example_sentence, dc.translated_sentence, 
            dc.image_path, d.kanji, d.reading, d.definitions
     FROM deck_cards dc
     JOIN dict.dictionary d ON dc.dictionary_id = d.id
     WHERE dc.stage = ?
     ORDER BY dc.added_at ASC`,
    [SRS_STAGES.NEW]
  );

  return rows.map(mapRowToCard);
}

/**
 * Get all cards in the deck
 */
export async function getAllCards(db: SQLiteDatabase): Promise<DeckCard[]> {
  const rows = await db.getAllAsync<DeckCardRow>(
    `SELECT dc.id, dc.dictionary_id, dc.added_at, dc.due_date, dc.stage, 
            dc.current_incorrect_count, dc.example_sentence, dc.translated_sentence, 
            dc.image_path, d.kanji, d.reading, d.definitions
     FROM deck_cards dc
     JOIN dict.dictionary d ON dc.dictionary_id = d.id
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
    `SELECT dc.id, dc.dictionary_id, dc.added_at, dc.due_date, dc.stage, 
            dc.current_incorrect_count, dc.example_sentence, dc.translated_sentence, 
            dc.image_path, d.kanji, d.reading, d.definitions
     FROM deck_cards dc
     JOIN dict.dictionary d ON dc.dictionary_id = d.id
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
 * Add mock cards for testing/development
 * Clears existing deck and adds cards across all SRS stages
 */
export async function addMockCards(db: SQLiteDatabase): Promise<number> {
  try {
    // First, clear the existing deck
    await db.execAsync(`
      DELETE FROM review_history;
      DELETE FROM deck_cards;
    `);

    // Get common words from dictionary
    const words = await db.getAllAsync<{ id: number }>(
      `SELECT id FROM dict.dictionary 
       WHERE common = 1 
       ORDER BY frequency_score DESC 
       LIMIT 20`
    );

    if (words.length < 18) {
      throw new Error('Not enough dictionary entries found');
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const addedAt = now.toISOString();

    // Helper to calculate due date
    const getMockDueDate = (stage: number, isDueNow: boolean): string | null => {
      if (stage === SRS_STAGES.BURNED) return null;
      if (isDueNow) return oneHourAgo;
      return calculateDueDate(stage);
    };

    // Insert cards with different stages and due dates
    let cardIndex = 0;
    const stages = [
      { stage: SRS_STAGES.APPRENTICE_1, count: 2 },
      { stage: SRS_STAGES.APPRENTICE_2, count: 2 },
      { stage: SRS_STAGES.APPRENTICE_3, count: 2 },
      { stage: SRS_STAGES.APPRENTICE_4, count: 2 },
      { stage: SRS_STAGES.GURU_1, count: 2 },
      { stage: SRS_STAGES.GURU_2, count: 2 },
      { stage: SRS_STAGES.MASTER, count: 2 },
      { stage: SRS_STAGES.ENLIGHTENED, count: 2 },
      { stage: SRS_STAGES.BURNED, count: 2 },
    ];

    for (const { stage, count } of stages) {
      for (let i = 0; i < count; i++) {
        const isDueNow = i === 0; // First card of each stage is due now
        const dueDate = getMockDueDate(stage, isDueNow);

        await db.runAsync(
          `INSERT INTO deck_cards (dictionary_id, added_at, due_date, stage, current_incorrect_count)
           VALUES (?, ?, ?, ?, ?)`,
          [words[cardIndex].id, addedAt, dueDate, stage, 0]
        );

        cardIndex++;
      }
    }

    return cardIndex;
  } catch (error) {
    console.error('Failed to add mock cards:', error);
    throw error;
  }
}

/**
 * Get deck statistics
 */
export async function getDeckStats(db: SQLiteDatabase): Promise<{
  totalCards: number;
  activeCards: number;
  burnedCards: number;
  dueNow: number;
  dueReviews: number;
  newCards: number;
  apprentice: number;
  guru: number;
  master: number;
  enlightened: number;
}> {
  const now = new Date().toISOString();

  const [total, active, burned, dueAll, dueReviews, distribution] = await Promise.all([
    db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM deck_cards`),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM deck_cards WHERE stage < ?`,
      [SRS_STAGES.BURNED]
    ),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM deck_cards WHERE stage = ?`,
      [SRS_STAGES.BURNED]
    ),
    // All due cards (including new)
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM deck_cards WHERE stage < ? AND due_date <= ?`,
      [SRS_STAGES.BURNED, now]
    ),
    // Due reviews only (excluding new cards)
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM deck_cards WHERE stage > ? AND stage < ? AND due_date <= ?`,
      [SRS_STAGES.NEW, SRS_STAGES.BURNED, now]
    ),
    db.getAllAsync<{ group_name: string; count: number }>(
      `SELECT 
        CASE 
          WHEN stage = 0 THEN 'new'
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
    dueNow: dueAll?.count ?? 0,
    dueReviews: dueReviews?.count ?? 0,
    newCards: distMap['new'] ?? 0,
    apprentice: distMap['apprentice'] ?? 0,
    guru: distMap['guru'] ?? 0,
    master: distMap['master'] ?? 0,
    enlightened: distMap['enlightened'] ?? 0,
  };
}

/**
 * Get just the count of due cards (lightweight for badge updates)
 */
export async function getDueCardCount(db: SQLiteDatabase): Promise<number> {
  const now = new Date().toISOString();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM deck_cards WHERE stage < ? AND due_date <= ?`,
    [SRS_STAGES.BURNED, now]
  );
  return result?.count ?? 0;
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
    exampleSentence: row.example_sentence,
    translatedSentence: row.translated_sentence,
    imagePath: row.image_path,
  };
}
