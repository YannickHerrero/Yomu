import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Check if a column exists in a table
 */
async function columnExists(
  db: SQLiteDatabase,
  tableName: string,
  columnName: string
): Promise<boolean> {
  try {
    const result = await db.getFirstAsync<{ name: string }>(
      `SELECT name FROM pragma_table_info('${tableName}') WHERE name = ?`,
      [columnName]
    );
    return result !== null;
  } catch {
    return false;
  }
}

/**
 * Check if a table exists
 */
async function tableExists(db: SQLiteDatabase, tableName: string): Promise<boolean> {
  const result = await db.getFirstAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [tableName]
  );
  return result !== null;
}

/**
 * Step 1: Create all tables (without indexes that depend on new columns)
 */
async function createTables(db: SQLiteDatabase): Promise<void> {
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
  `);

  // Reading sessions table (must be created before deck_cards due to foreign key)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reading_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration_seconds INTEGER,
      cards_added_count INTEGER DEFAULT 0
    );
  `);

  // Deck cards table (SRS cards)
  // Note: session_id column is included for new installs
  // For existing installs, it will be added by migration
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS deck_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dictionary_id INTEGER NOT NULL UNIQUE,
      added_at TEXT NOT NULL,
      due_date TEXT,
      stage INTEGER DEFAULT 1,
      current_incorrect_count INTEGER DEFAULT 0,
      session_id INTEGER,
      example_sentence TEXT,
      translated_sentence TEXT,
      image_path TEXT,
      FOREIGN KEY (dictionary_id) REFERENCES dictionary(id),
      FOREIGN KEY (session_id) REFERENCES reading_sessions(id)
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
 * Step 2: Migrate existing databases to add new columns
 */
async function migrateSchema(db: SQLiteDatabase): Promise<void> {
  // Add session_id to deck_cards if it doesn't exist
  if (await tableExists(db, 'deck_cards')) {
    if (!(await columnExists(db, 'deck_cards', 'session_id'))) {
      console.log('Migrating deck_cards: adding session_id column');
      await db.execAsync(`ALTER TABLE deck_cards ADD COLUMN session_id INTEGER`);
    }
  }

  // Add cards_added_count to reading_sessions if it doesn't exist
  if (await tableExists(db, 'reading_sessions')) {
    if (!(await columnExists(db, 'reading_sessions', 'cards_added_count'))) {
      console.log('Migrating reading_sessions: adding cards_added_count column');
      await db.execAsync(`ALTER TABLE reading_sessions ADD COLUMN cards_added_count INTEGER DEFAULT 0`);
    }
  }

  // Add example_sentence, translated_sentence, and image_path to deck_cards
  if (await tableExists(db, 'deck_cards')) {
    if (!(await columnExists(db, 'deck_cards', 'example_sentence'))) {
      console.log('Migrating deck_cards: adding example_sentence column');
      await db.execAsync(`ALTER TABLE deck_cards ADD COLUMN example_sentence TEXT`);
    }
    if (!(await columnExists(db, 'deck_cards', 'translated_sentence'))) {
      console.log('Migrating deck_cards: adding translated_sentence column');
      await db.execAsync(`ALTER TABLE deck_cards ADD COLUMN translated_sentence TEXT`);
    }
    if (!(await columnExists(db, 'deck_cards', 'image_path'))) {
      console.log('Migrating deck_cards: adding image_path column');
      await db.execAsync(`ALTER TABLE deck_cards ADD COLUMN image_path TEXT`);
    }
  }
}

/**
 * Step 3: Create all indexes (safe to run after migrations)
 */
async function createIndexes(db: SQLiteDatabase): Promise<void> {
  // Dictionary indexes
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_kanji ON dictionary(kanji)`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_reading ON dictionary(reading)`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_romaji ON dictionary(reading_romaji)`);

  // Deck cards indexes
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_due_date ON deck_cards(due_date)`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_stage ON deck_cards(stage)`);
  
  // Only create session_id index if the column exists (it should after migration)
  if (await columnExists(db, 'deck_cards', 'session_id')) {
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_session_id ON deck_cards(session_id)`);
  }

  // Review history indexes
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_reviewed_at ON review_history(reviewed_at)`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_card_id ON review_history(card_id)`);
}

/**
 * Initialize all database tables
 */
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  // Step 1: Create all tables
  await createTables(db);

  // Step 2: Run migrations for existing databases (adds new columns)
  await migrateSchema(db);

  // Step 3: Create all indexes (safe now because columns exist)
  await createIndexes(db);
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
