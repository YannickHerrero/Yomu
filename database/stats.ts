import type { SQLiteDatabase } from 'expo-sqlite';
import { SRS_STAGES } from '@/constants/srs';

export type HeatmapData = {
  date: string;
  count: number;
};

export type ForecastData = {
  date: string;
  count: number;
};

/**
 * Get total number of reviews (all time)
 */
export async function getTotalReviews(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM review_history`
  );
  return result?.total ?? 0;
}

/**
 * Get number of reviews done today
 */
export async function getReviewsToday(db: SQLiteDatabase): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT reviews_count as count FROM daily_stats WHERE date = ?`,
    [today]
  );
  return result?.count ?? 0;
}

/**
 * Get number of days with at least one review
 */
export async function getStudyDays(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM daily_stats WHERE reviews_count > 0`
  );
  return result?.count ?? 0;
}

/**
 * Get success rate for a period
 */
export async function getSuccessRate(
  db: SQLiteDatabase,
  days: number | null = null
): Promise<number> {
  let query = `SELECT 
    CASE WHEN COUNT(*) > 0 
      THEN ROUND(100.0 * SUM(is_correct) / COUNT(*), 1) 
      ELSE 0 
    END as rate
    FROM review_history`;

  if (days !== null) {
    query += ` WHERE reviewed_at >= datetime('now', '-${days} days')`;
  }

  const result = await db.getFirstAsync<{ rate: number }>(query);
  return result?.rate ?? 0;
}

/**
 * Get current streak (consecutive days with reviews)
 */
export async function getCurrentStreak(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ streak: number }>(`
    WITH RECURSIVE dates AS (
      SELECT DATE('now') as date, 0 as day_num
      UNION ALL
      SELECT DATE(date, '-1 day'), day_num + 1
      FROM dates
      WHERE day_num < 365
        AND EXISTS (
          SELECT 1 FROM daily_stats 
          WHERE daily_stats.date = DATE(dates.date, '-1 day')
          AND reviews_count > 0
        )
    )
    SELECT MAX(day_num) as streak FROM dates
    WHERE EXISTS (
      SELECT 1 FROM daily_stats 
      WHERE daily_stats.date = dates.date
      AND reviews_count > 0
    )
  `);
  return result?.streak ?? 0;
}

/**
 * Get best streak (record consecutive days)
 */
export async function getBestStreak(db: SQLiteDatabase): Promise<number> {
  // This is a simplified version - full implementation would need a more complex query
  const result = await db.getFirstAsync<{ max_streak: number }>(`
    WITH date_groups AS (
      SELECT 
        date,
        DATE(date, '-' || ROW_NUMBER() OVER (ORDER BY date) || ' days') as grp
      FROM daily_stats
      WHERE reviews_count > 0
    )
    SELECT MAX(streak_count) as max_streak
    FROM (
      SELECT grp, COUNT(*) as streak_count
      FROM date_groups
      GROUP BY grp
    )
  `);
  return result?.max_streak ?? 0;
}

/**
 * Get heatmap data for the year
 */
export async function getHeatmapData(
  db: SQLiteDatabase,
  year: number = new Date().getFullYear()
): Promise<HeatmapData[]> {
  const rows = await db.getAllAsync<{ date: string; count: number }>(
    `SELECT date, reviews_count as count
     FROM daily_stats
     WHERE date >= ? AND date <= ?
     ORDER BY date`,
    [`${year}-01-01`, `${year}-12-31`]
  );

  return rows;
}

/**
 * Get forecast data (reviews due in the next N days)
 */
export async function getForecastData(
  db: SQLiteDatabase,
  days: number = 30
): Promise<ForecastData[]> {
  const rows = await db.getAllAsync<{ date: string; count: number }>(
    `SELECT 
      DATE(due_date) as date,
      COUNT(*) as count
     FROM deck_cards
     WHERE stage < ? 
       AND due_date BETWEEN datetime('now') AND datetime('now', '+${days} days')
     GROUP BY DATE(due_date)
     ORDER BY date`,
    [SRS_STAGES.BURNED]
  );

  return rows;
}

/**
 * Get all overview statistics at once
 */
export async function getAllStats(db: SQLiteDatabase): Promise<{
  totalReviews: number;
  reviewsToday: number;
  studyDays: number;
  currentStreak: number;
  bestStreak: number;
  successRateAllTime: number;
  successRate7Days: number;
  successRate30Days: number;
}> {
  const [
    totalReviews,
    reviewsToday,
    studyDays,
    currentStreak,
    bestStreak,
    successRateAllTime,
    successRate7Days,
    successRate30Days,
  ] = await Promise.all([
    getTotalReviews(db),
    getReviewsToday(db),
    getStudyDays(db),
    getCurrentStreak(db),
    getBestStreak(db),
    getSuccessRate(db),
    getSuccessRate(db, 7),
    getSuccessRate(db, 30),
  ]);

  return {
    totalReviews,
    reviewsToday,
    studyDays,
    currentStreak,
    bestStreak,
    successRateAllTime,
    successRate7Days,
    successRate30Days,
  };
}
