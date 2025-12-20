import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { zip, unzip } from 'react-native-zip-archive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SQLiteDatabase } from 'expo-sqlite';

// Backup format version - increment when schema changes
const BACKUP_VERSION = 1;

// Directory names
const BACKUP_DIR = 'backups/';
const IMAGES_DIR = 'card_images/';

// AsyncStorage keys
const DEEPL_API_KEY_STORAGE_KEY = 'deepl_api_key';
const NEW_CARDS_PER_BATCH_KEY = 'new_cards_per_batch';
const THEME_STORAGE_KEY = 'yomu-theme';

// Types for database rows
type DeckCard = {
  id: number;
  dictionary_id: number;
  added_at: string;
  due_date: string | null;
  stage: number;
  current_incorrect_count: number;
  session_id: number | null;
  example_sentence: string | null;
  translated_sentence: string | null;
  image_path: string | null;
};

type ReviewHistory = {
  id: number;
  card_id: number;
  reviewed_at: string;
  stage_before: number;
  stage_after: number;
  is_correct: number;
  incorrect_count: number | null;
};

type DailyStats = {
  date: string;
  reviews_count: number;
  correct_count: number;
  incorrect_count: number;
};

type ReadingSession = {
  id: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  cards_added_count: number;
};

type BackupSettings = {
  new_cards_per_batch: number;
  theme_mode: string;
  deepl_api_key: string | null;
};

type BackupData = {
  version: number;
  app_version: string;
  exported_at: string;
  data: {
    deck_cards: DeckCard[];
    review_history: ReviewHistory[];
    daily_stats: DailyStats[];
    reading_sessions: ReadingSession[];
  };
  settings: BackupSettings;
  image_files: string[]; // List of image filenames included in backup
};

/**
 * Get the backup working directory
 */
function getBackupDirectory(): string {
  return `${FileSystem.cacheDirectory}${BACKUP_DIR}`;
}

/**
 * Get the card images directory
 */
function getImagesDirectory(): string {
  return `${FileSystem.documentDirectory}${IMAGES_DIR}`;
}

/**
 * Ensure backup directory exists
 */
async function ensureBackupDirectory(): Promise<string> {
  const dir = getBackupDirectory();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/**
 * Clean up backup directory
 */
async function cleanupBackupDirectory(): Promise<void> {
  const dir = getBackupDirectory();
  const info = await FileSystem.getInfoAsync(dir);
  if (info.exists) {
    await FileSystem.deleteAsync(dir, { idempotent: true });
  }
}

/**
 * Export all user data to a ZIP file
 */
export async function exportBackup(
  db: SQLiteDatabase,
  appVersion: string,
  includeApiKey: boolean = false
): Promise<string> {
  const backupDir = await ensureBackupDirectory();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const workDir = `${backupDir}yomu_backup_${timestamp}/`;
  const imagesWorkDir = `${workDir}images/`;

  try {
    // Create working directories
    await FileSystem.makeDirectoryAsync(workDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(imagesWorkDir, { intermediates: true });

    // Fetch all data from database
    const [deckCards, reviewHistory, dailyStats, readingSessions] = await Promise.all([
      db.getAllAsync<DeckCard>('SELECT * FROM deck_cards'),
      db.getAllAsync<ReviewHistory>('SELECT * FROM review_history'),
      db.getAllAsync<DailyStats>('SELECT * FROM daily_stats'),
      db.getAllAsync<ReadingSession>('SELECT * FROM reading_sessions'),
    ]);

    // Fetch settings from AsyncStorage
    const [newCardsPerBatch, themeData, deeplApiKey] = await Promise.all([
      AsyncStorage.getItem(NEW_CARDS_PER_BATCH_KEY),
      AsyncStorage.getItem(THEME_STORAGE_KEY),
      includeApiKey ? AsyncStorage.getItem(DEEPL_API_KEY_STORAGE_KEY) : Promise.resolve(null),
    ]);

    // Parse theme data (stored as JSON by zustand persist)
    let themeMode = 'system';
    if (themeData) {
      try {
        const parsed = JSON.parse(themeData);
        themeMode = parsed.state?.mode || 'system';
      } catch {
        // Ignore parse errors
      }
    }

    // Copy images to backup
    const imageFiles: string[] = [];
    const imagesDir = getImagesDirectory();
    const imagesInfo = await FileSystem.getInfoAsync(imagesDir);

    if (imagesInfo.exists) {
      const files = await FileSystem.readDirectoryAsync(imagesDir);
      for (const file of files) {
        // Only copy images that are referenced by cards
        const isReferenced = deckCards.some((card) => card.image_path === file);
        if (isReferenced) {
          try {
            await FileSystem.copyAsync({
              from: `${imagesDir}${file}`,
              to: `${imagesWorkDir}${file}`,
            });
            imageFiles.push(file);
          } catch (err) {
            console.warn(`Failed to copy image ${file}:`, err);
          }
        }
      }
    }

    // Create backup data object
    const backupData: BackupData = {
      version: BACKUP_VERSION,
      app_version: appVersion,
      exported_at: new Date().toISOString(),
      data: {
        deck_cards: deckCards,
        review_history: reviewHistory,
        daily_stats: dailyStats,
        reading_sessions: readingSessions,
      },
      settings: {
        new_cards_per_batch: newCardsPerBatch ? parseInt(newCardsPerBatch, 10) : 10,
        theme_mode: themeMode,
        deepl_api_key: includeApiKey ? deeplApiKey : null,
      },
      image_files: imageFiles,
    };

    // Write backup.json
    const jsonPath = `${workDir}backup.json`;
    await FileSystem.writeAsStringAsync(jsonPath, JSON.stringify(backupData, null, 2));

    // Create ZIP file
    const zipPath = `${backupDir}yomu_backup_${timestamp}.zip`;
    await zip(workDir, zipPath);

    // Clean up working directory
    await FileSystem.deleteAsync(workDir, { idempotent: true });

    return zipPath;
  } catch (error) {
    // Clean up on error
    await cleanupBackupDirectory();
    throw error;
  }
}

/**
 * Share a backup file using the system share sheet
 */
export async function shareBackup(zipPath: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(zipPath, {
    mimeType: 'application/zip',
    dialogTitle: 'Export Yomu Backup',
    UTI: 'public.zip-archive',
  });
}

/**
 * Pick a backup file using the document picker
 */
export async function pickBackupFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/x-zip-compressed'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0].uri;
}

/**
 * Validate a backup file and return its metadata
 */
export async function validateBackup(zipPath: string): Promise<{
  isValid: boolean;
  error?: string;
  data?: BackupData;
}> {
  const backupDir = await ensureBackupDirectory();
  const extractDir = `${backupDir}validate_${Date.now()}/`;

  try {
    // Extract ZIP
    await unzip(zipPath, extractDir);

    // Read and parse backup.json
    const jsonPath = `${extractDir}backup.json`;
    const jsonInfo = await FileSystem.getInfoAsync(jsonPath);

    if (!jsonInfo.exists) {
      return { isValid: false, error: 'Invalid backup: missing backup.json' };
    }

    const jsonContent = await FileSystem.readAsStringAsync(jsonPath);
    const data = JSON.parse(jsonContent) as BackupData;

    // Validate version
    if (!data.version || data.version > BACKUP_VERSION) {
      return {
        isValid: false,
        error: `Backup version ${data.version} is not supported. Please update the app.`,
      };
    }

    // Validate required fields
    if (!data.data || !data.data.deck_cards || !data.data.review_history) {
      return { isValid: false, error: 'Invalid backup: missing required data' };
    }

    // Clean up
    await FileSystem.deleteAsync(extractDir, { idempotent: true });

    return { isValid: true, data };
  } catch (error) {
    // Clean up on error
    try {
      await FileSystem.deleteAsync(extractDir, { idempotent: true });
    } catch {
      // Ignore cleanup errors
    }

    if (error instanceof SyntaxError) {
      return { isValid: false, error: 'Invalid backup: corrupted JSON data' };
    }

    return { isValid: false, error: `Failed to validate backup: ${error}` };
  }
}

/**
 * Import a backup file, replacing all existing data
 */
export async function importBackup(
  db: SQLiteDatabase,
  zipPath: string,
  importApiKey: boolean = false
): Promise<{
  success: boolean;
  error?: string;
  stats?: {
    cards: number;
    reviews: number;
    sessions: number;
  };
}> {
  const backupDir = await ensureBackupDirectory();
  const extractDir = `${backupDir}import_${Date.now()}/`;
  const imagesDir = getImagesDirectory();

  try {
    // Extract ZIP
    await unzip(zipPath, extractDir);

    // Read backup.json
    const jsonPath = `${extractDir}backup.json`;
    const jsonContent = await FileSystem.readAsStringAsync(jsonPath);
    const data = JSON.parse(jsonContent) as BackupData;

    // Begin transaction - clear existing data and insert new
    await db.execAsync(`
      DELETE FROM review_history;
      DELETE FROM deck_cards;
      DELETE FROM reading_sessions;
      DELETE FROM daily_stats;
    `);

    // Insert reading_sessions first (referenced by deck_cards)
    for (const session of data.data.reading_sessions) {
      await db.runAsync(
        `INSERT INTO reading_sessions (id, started_at, ended_at, duration_seconds, cards_added_count)
         VALUES (?, ?, ?, ?, ?)`,
        [
          session.id,
          session.started_at,
          session.ended_at,
          session.duration_seconds,
          session.cards_added_count,
        ]
      );
    }

    // Insert deck_cards
    for (const card of data.data.deck_cards) {
      await db.runAsync(
        `INSERT INTO deck_cards (id, dictionary_id, added_at, due_date, stage, current_incorrect_count, session_id, example_sentence, translated_sentence, image_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          card.id,
          card.dictionary_id,
          card.added_at,
          card.due_date,
          card.stage,
          card.current_incorrect_count,
          card.session_id,
          card.example_sentence,
          card.translated_sentence,
          card.image_path,
        ]
      );
    }

    // Insert review_history
    for (const review of data.data.review_history) {
      await db.runAsync(
        `INSERT INTO review_history (id, card_id, reviewed_at, stage_before, stage_after, is_correct, incorrect_count)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          review.id,
          review.card_id,
          review.reviewed_at,
          review.stage_before,
          review.stage_after,
          review.is_correct,
          review.incorrect_count,
        ]
      );
    }

    // Insert daily_stats
    for (const stat of data.data.daily_stats) {
      await db.runAsync(
        `INSERT INTO daily_stats (date, reviews_count, correct_count, incorrect_count)
         VALUES (?, ?, ?, ?)`,
        [stat.date, stat.reviews_count, stat.correct_count, stat.incorrect_count]
      );
    }

    // Import images
    const importedImagesDir = `${extractDir}images/`;
    const imagesInfo = await FileSystem.getInfoAsync(importedImagesDir);

    if (imagesInfo.exists) {
      // Ensure images directory exists
      const destInfo = await FileSystem.getInfoAsync(imagesDir);
      if (!destInfo.exists) {
        await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
      }

      // Copy each image
      const imageFiles = await FileSystem.readDirectoryAsync(importedImagesDir);
      for (const file of imageFiles) {
        try {
          // Delete existing file if it exists
          const destPath = `${imagesDir}${file}`;
          const existingInfo = await FileSystem.getInfoAsync(destPath);
          if (existingInfo.exists) {
            await FileSystem.deleteAsync(destPath, { idempotent: true });
          }

          await FileSystem.copyAsync({
            from: `${importedImagesDir}${file}`,
            to: destPath,
          });
        } catch (err) {
          console.warn(`Failed to import image ${file}:`, err);
        }
      }
    }

    // Import settings
    if (data.settings.new_cards_per_batch) {
      await AsyncStorage.setItem(
        NEW_CARDS_PER_BATCH_KEY,
        data.settings.new_cards_per_batch.toString()
      );
    }

    if (data.settings.theme_mode) {
      // Store in zustand persist format
      const themeData = JSON.stringify({
        state: { mode: data.settings.theme_mode },
        version: 0,
      });
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeData);
    }

    if (importApiKey && data.settings.deepl_api_key) {
      await AsyncStorage.setItem(DEEPL_API_KEY_STORAGE_KEY, data.settings.deepl_api_key);
    }

    // Clean up
    await FileSystem.deleteAsync(extractDir, { idempotent: true });

    return {
      success: true,
      stats: {
        cards: data.data.deck_cards.length,
        reviews: data.data.review_history.length,
        sessions: data.data.reading_sessions.length,
      },
    };
  } catch (error) {
    // Clean up on error
    try {
      await FileSystem.deleteAsync(extractDir, { idempotent: true });
    } catch {
      // Ignore cleanup errors
    }

    console.error('Import error:', error);
    return {
      success: false,
      error: `Failed to import backup: ${error}`,
    };
  }
}

/**
 * Get backup file size in human-readable format
 */
export async function getBackupSize(zipPath: string): Promise<string> {
  const info = await FileSystem.getInfoAsync(zipPath);
  if (!info.exists || !('size' in info)) {
    return 'Unknown';
  }

  const bytes = info.size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Clean up old backup files from cache
 */
export async function cleanupOldBackups(): Promise<void> {
  await cleanupBackupDirectory();
}
