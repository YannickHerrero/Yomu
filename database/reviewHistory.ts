import type { SQLiteDatabase } from 'expo-sqlite';

export type ReviewRecord = {
  id: number;
  cardId: number;
  reviewedAt: string;
  stageBefore: number;
  stageAfter: number;
  isCorrect: boolean;
  incorrectCount: number | null;
};

type ReviewRow = {
  id: number;
  card_id: number;
  reviewed_at: string;
  stage_before: number;
  stage_after: number;
  is_correct: number;
  incorrect_count: number | null;
};

/**
 * Record a review in history
 */
export async function recordReview(
  db: SQLiteDatabase,
  cardId: number,
  stageBefore: number,
  stageAfter: number,
  isCorrect: boolean,
  incorrectCount: number
): Promise<number> {
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  // Insert review record
  const result = await db.runAsync(
    `INSERT INTO review_history (card_id, reviewed_at, stage_before, stage_after, is_correct, incorrect_count)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [cardId, now, stageBefore, stageAfter, isCorrect ? 1 : 0, incorrectCount]
  );

  // Update daily stats cache
  await db.runAsync(
    `INSERT INTO daily_stats (date, reviews_count, correct_count, incorrect_count)
     VALUES (?, 1, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       reviews_count = reviews_count + 1,
       correct_count = correct_count + ?,
       incorrect_count = incorrect_count + ?`,
    [today, isCorrect ? 1 : 0, isCorrect ? 0 : 1, isCorrect ? 1 : 0, isCorrect ? 0 : 1]
  );

  return result.lastInsertRowId;
}

/**
 * Get review history for a specific card
 */
export async function getCardReviewHistory(
  db: SQLiteDatabase,
  cardId: number
): Promise<ReviewRecord[]> {
  const rows = await db.getAllAsync<ReviewRow>(
    `SELECT * FROM review_history 
     WHERE card_id = ? 
     ORDER BY reviewed_at DESC`,
    [cardId]
  );

  return rows.map(mapRowToRecord);
}

/**
 * Get recent reviews
 */
export async function getRecentReviews(
  db: SQLiteDatabase,
  limit: number = 100
): Promise<ReviewRecord[]> {
  const rows = await db.getAllAsync<ReviewRow>(
    `SELECT * FROM review_history 
     ORDER BY reviewed_at DESC 
     LIMIT ?`,
    [limit]
  );

  return rows.map(mapRowToRecord);
}

function mapRowToRecord(row: ReviewRow): ReviewRecord {
  return {
    id: row.id,
    cardId: row.card_id,
    reviewedAt: row.reviewed_at,
    stageBefore: row.stage_before,
    stageAfter: row.stage_after,
    isCorrect: row.is_correct === 1,
    incorrectCount: row.incorrect_count,
  };
}
