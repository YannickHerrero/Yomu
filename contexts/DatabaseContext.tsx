import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SQLite from 'expo-sqlite';
import { Paths, File, Directory } from 'expo-file-system';
import { Asset } from 'expo-asset';
import { initializeDatabase } from '@/database/schema';

type LoadingStatus = 
  | 'initializing'
  | 'copying_dictionary'
  | 'attaching_database'
  | 'ready'
  | 'error';

type DatabaseContextType = {
  db: SQLite.SQLiteDatabase | null;
  isLoading: boolean;
  loadingStatus: LoadingStatus;
  loadingMessage: string;
  error: string | null;
  retry: () => void;
};

const LOADING_MESSAGES: Record<LoadingStatus, string> = {
  initializing: 'Initializing...',
  copying_dictionary: 'Setting up dictionary...',
  attaching_database: 'Preparing database...',
  ready: 'Ready',
  error: 'An error occurred',
};

const DatabaseContext = createContext<DatabaseContextType>({
  db: null,
  isLoading: true,
  loadingStatus: 'initializing',
  loadingMessage: LOADING_MESSAGES.initializing,
  error: null,
  retry: () => {},
});

export function useDatabase(): DatabaseContextType {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

type DatabaseProviderProps = {
  children: React.ReactNode;
};

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('initializing');
  const [error, setError] = useState<string | null>(null);

  const initDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setLoadingStatus('initializing');

      // First, open/create the app database for user data (deck, sessions, etc.)
      const appDb = await SQLite.openDatabaseAsync('yomu.db');
      
      // Initialize schema for user data tables
      await initializeDatabase(appDb);

      // Check if dictionary database exists in document directory
      const sqliteDir = new Directory(Paths.document, 'SQLite');
      const dictDbFile = new File(sqliteDir, 'jmdict.db');
      
      if (!dictDbFile.exists) {
        setLoadingStatus('copying_dictionary');
        console.log('Copying dictionary database from assets...');
        
        // Ensure SQLite directory exists
        if (!sqliteDir.exists) {
          sqliteDir.create();
        }

        // Load the asset
        const asset = Asset.fromModule(require('@/assets/jmdict.db'));
        await asset.downloadAsync();

        if (asset.localUri) {
          // Copy from asset to document directory
          const assetFile = new File(asset.localUri);
          assetFile.copy(dictDbFile);
          console.log('Dictionary database copied successfully');
        } else {
          throw new Error('Failed to load dictionary asset');
        }
      }

      // Attach the dictionary database to the main database
      setLoadingStatus('attaching_database');
      // Convert file:// URI to plain path for SQLite
      const dictDbPath = decodeURIComponent(dictDbFile.uri.replace('file://', ''));
      await appDb.execAsync(`ATTACH DATABASE '${dictDbPath}' AS dict`);
      
      console.log('Database initialized successfully');
      setLoadingStatus('ready');
      setDb(appDb);
    } catch (err) {
      console.error('Database initialization error:', err);
      setLoadingStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown database error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    initDatabase();
  }, [initDatabase]);

  useEffect(() => {
    initDatabase();
  }, [initDatabase]);

  const loadingMessage = LOADING_MESSAGES[loadingStatus];

  return (
    <DatabaseContext.Provider value={{ db, isLoading, loadingStatus, loadingMessage, error, retry }}>
      {children}
    </DatabaseContext.Provider>
  );
}
