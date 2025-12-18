import type { SQLiteDatabase } from 'expo-sqlite';

export type ReadingSession = {
  id: number;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
};

type SessionRow = {
  id: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
};

/**
 * Start a new reading session
 */
export async function startSession(db: SQLiteDatabase): Promise<number> {
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `INSERT INTO reading_sessions (started_at) VALUES (?)`,
    [now]
  );

  return result.lastInsertRowId;
}

/**
 * End a reading session
 */
export async function endSession(
  db: SQLiteDatabase,
  sessionId: number,
  durationSeconds: number
): Promise<void> {
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE reading_sessions 
     SET ended_at = ?, duration_seconds = ?
     WHERE id = ?`,
    [now, durationSeconds, sessionId]
  );
}

/**
 * Get all reading sessions
 */
export async function getAllSessions(db: SQLiteDatabase): Promise<ReadingSession[]> {
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM reading_sessions ORDER BY started_at DESC`
  );

  return rows.map(mapRowToSession);
}

/**
 * Get sessions for a specific date range
 */
export async function getSessionsInRange(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<ReadingSession[]> {
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM reading_sessions 
     WHERE started_at >= ? AND started_at <= ?
     ORDER BY started_at DESC`,
    [startDate, endDate]
  );

  return rows.map(mapRowToSession);
}

/**
 * Get total reading time statistics
 */
export async function getReadingStats(db: SQLiteDatabase): Promise<{
  totalSeconds: number;
  todaySeconds: number;
  weekSeconds: number;
  monthSeconds: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString();

  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthStr = monthAgo.toISOString();

  const [total, todayTotal, weekTotal, monthTotal] = await Promise.all([
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(duration_seconds), 0) as total FROM reading_sessions`
    ),
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(duration_seconds), 0) as total 
       FROM reading_sessions WHERE started_at >= ?`,
      [todayStr]
    ),
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(duration_seconds), 0) as total 
       FROM reading_sessions WHERE started_at >= ?`,
      [weekStr]
    ),
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(duration_seconds), 0) as total 
       FROM reading_sessions WHERE started_at >= ?`,
      [monthStr]
    ),
  ]);

  return {
    totalSeconds: total?.total ?? 0,
    todaySeconds: todayTotal?.total ?? 0,
    weekSeconds: weekTotal?.total ?? 0,
    monthSeconds: monthTotal?.total ?? 0,
  };
}

/**
 * Get incomplete session (for resuming after app restart)
 */
export async function getIncompleteSession(
  db: SQLiteDatabase
): Promise<ReadingSession | null> {
  const row = await db.getFirstAsync<SessionRow>(
    `SELECT * FROM reading_sessions WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1`
  );

  return row ? mapRowToSession(row) : null;
}

/**
 * Delete a session
 */
export async function deleteSession(
  db: SQLiteDatabase,
  sessionId: number
): Promise<void> {
  await db.runAsync(`DELETE FROM reading_sessions WHERE id = ?`, [sessionId]);
}

function mapRowToSession(row: SessionRow): ReadingSession {
  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
  };
}
