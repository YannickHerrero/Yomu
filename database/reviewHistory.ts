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

/**
 * Get count of cards learned (moved from stage 0 to stage 1+) within a date range
 * A card is "learned" the first time it successfully moves out of the NEW stage
 */
export async function getLearnedCardsCount(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT card_id) as count 
     FROM review_history 
     WHERE stage_before = 0 
       AND stage_after > 0 
       AND is_correct = 1
       AND reviewed_at >= ? 
       AND reviewed_at < ?`,
    [startDate, endDate]
  );
  return result?.count ?? 0;
}

/**
 * Generate mock review history for testing
 * Creates realistic review patterns over the past 90 days
 */
export async function addMockReviewHistory(db: SQLiteDatabase): Promise<number> {
  try {
    // Get all cards from deck
    const cards = await db.getAllAsync<{ id: number; stage: number }>(
      `SELECT id, stage FROM deck_cards ORDER BY id`
    );

    if (cards.length === 0) {
      throw new Error('No cards in deck. Add mock cards first.');
    }

    let totalReviews = 0;
    const now = new Date();

    // Generate reviews for the past 90 days
    for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
      const reviewDate = new Date(now);
      reviewDate.setDate(reviewDate.getDate() - daysAgo);
      
      // Skip some days randomly (to create gaps in streak)
      if (Math.random() > 0.7) continue;

      // Number of reviews for this day (1-15)
      const reviewsThisDay = Math.floor(Math.random() * 15) + 1;

      for (let i = 0; i < reviewsThisDay; i++) {
        // Pick a random card
        const card = cards[Math.floor(Math.random() * cards.length)];
        
        // Random stage before (1-8, not burned)
        const stageBefore = Math.min(Math.floor(Math.random() * 8) + 1, card.stage);
        
        // 80% success rate
        const isCorrect = Math.random() > 0.2;
        
        // Calculate stage after based on success
        const stageAfter = isCorrect 
          ? Math.min(stageBefore + 1, 9) 
          : Math.max(stageBefore - 1, 1);
        
        const incorrectCount = isCorrect ? 0 : 1;

        // Add some time variation to the review (spread throughout the day)
        const reviewHour = Math.floor(Math.random() * 24);
        const reviewMinute = Math.floor(Math.random() * 60);
        reviewDate.setHours(reviewHour, reviewMinute, 0, 0);

        const reviewedAt = reviewDate.toISOString();
        const dateOnly = reviewedAt.split('T')[0];

        // Insert review record
        await db.runAsync(
          `INSERT INTO review_history (card_id, reviewed_at, stage_before, stage_after, is_correct, incorrect_count)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [card.id, reviewedAt, stageBefore, stageAfter, isCorrect ? 1 : 0, incorrectCount]
        );

        // Update daily stats cache
        await db.runAsync(
          `INSERT INTO daily_stats (date, reviews_count, correct_count, incorrect_count)
           VALUES (?, 1, ?, ?)
           ON CONFLICT(date) DO UPDATE SET
             reviews_count = reviews_count + 1,
             correct_count = correct_count + ?,
             incorrect_count = incorrect_count + ?`,
          [dateOnly, isCorrect ? 1 : 0, isCorrect ? 0 : 1, isCorrect ? 1 : 0, isCorrect ? 0 : 1]
        );

        totalReviews++;
      }
    }

    return totalReviews;
  } catch (error) {
    console.error('Failed to add mock review history:', error);
    throw error;
  }
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
