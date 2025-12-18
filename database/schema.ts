import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Initialize all database tables
 */
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  // Dictionary table (imported from JMdict)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS dictionary (
      id INTEGER PRIMARY KEY,
      kanji TEXT,
      reading TEXT NOT NULL,
      reading_romaji TEXT,
      definitions TEXT NOT NULL,
      part_of_speech TEXT,
      common INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_kanji ON dictionary(kanji);
    CREATE INDEX IF NOT EXISTS idx_reading ON dictionary(reading);
    CREATE INDEX IF NOT EXISTS idx_romaji ON dictionary(reading_romaji);
  `);

  // Deck cards table (SRS cards)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS deck_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dictionary_id INTEGER NOT NULL UNIQUE,
      added_at TEXT NOT NULL,
      due_date TEXT,
      stage INTEGER DEFAULT 1,
      current_incorrect_count INTEGER DEFAULT 0,
      FOREIGN KEY (dictionary_id) REFERENCES dictionary(id)
    );

    CREATE INDEX IF NOT EXISTS idx_due_date ON deck_cards(due_date);
    CREATE INDEX IF NOT EXISTS idx_stage ON deck_cards(stage);
  `);

  // Reading sessions table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reading_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration_seconds INTEGER
    );
  `);

  // Review history table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS review_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      reviewed_at TEXT NOT NULL,
      stage_before INTEGER NOT NULL,
      stage_after INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      incorrect_count INTEGER,
      FOREIGN KEY (card_id) REFERENCES deck_cards(id)
    );

    CREATE INDEX IF NOT EXISTS idx_reviewed_at ON review_history(reviewed_at);
    CREATE INDEX IF NOT EXISTS idx_card_id ON review_history(card_id);
  `);

  // Daily stats cache table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_stats (
      date TEXT PRIMARY KEY,
      reviews_count INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      incorrect_count INTEGER DEFAULT 0
    );
  `);
}

/**
 * Drop all tables (for development/testing)
 */
export async function resetDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DROP TABLE IF EXISTS daily_stats;
    DROP TABLE IF EXISTS review_history;
    DROP TABLE IF EXISTS reading_sessions;
    DROP TABLE IF EXISTS deck_cards;
    DROP TABLE IF EXISTS dictionary;
  `);
}
