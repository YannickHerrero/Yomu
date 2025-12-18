import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SQLite from 'expo-sqlite';
import { Paths, File, Directory } from 'expo-file-system';
import { Asset } from 'expo-asset';
import { initializeDatabase } from '@/database/schema';

type DatabaseContextType = {
  db: SQLite.SQLiteDatabase | null;
  isLoading: boolean;
  error: string | null;
};

const DatabaseContext = createContext<DatabaseContextType>({
  db: null,
  isLoading: true,
  error: null,
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
  const [error, setError] = useState<string | null>(null);

  const initDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First, open/create the app database for user data (deck, sessions, etc.)
      const appDb = await SQLite.openDatabaseAsync('yomu.db');
      
      // Initialize schema for user data tables
      await initializeDatabase(appDb);

      // Check if dictionary database exists in document directory
      const sqliteDir = new Directory(Paths.document, 'SQLite');
      const dictDbFile = new File(sqliteDir, 'jmdict.db');
      
      if (!dictDbFile.exists) {
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
      // Convert file:// URI to plain path for SQLite
      const dictDbPath = decodeURIComponent(dictDbFile.uri.replace('file://', ''));
      await appDb.execAsync(`ATTACH DATABASE '${dictDbPath}' AS dict`);
      
      console.log('Database initialized successfully');
      setDb(appDb);
    } catch (err) {
      console.error('Database initialization error:', err);
      setError(err instanceof Error ? err.message : 'Unknown database error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initDatabase();
  }, [initDatabase]);

  return (
    <DatabaseContext.Provider value={{ db, isLoading, error }}>
      {children}
    </DatabaseContext.Provider>
  );
}
