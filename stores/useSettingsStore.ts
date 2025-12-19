import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEEPL_API_KEY_STORAGE_KEY = 'deepl_api_key';
const NEW_CARDS_PER_BATCH_KEY = 'new_cards_per_batch';

const DEFAULT_NEW_CARDS_PER_BATCH = 10;

type SettingsState = {
  deeplApiKey: string | null;
  newCardsPerBatch: number;
  isLoading: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  loadApiKey: () => Promise<void>;
  saveApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
  setNewCardsPerBatch: (count: number) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  deeplApiKey: null,
  newCardsPerBatch: DEFAULT_NEW_CARDS_PER_BATCH,
  isLoading: true,

  loadSettings: async () => {
    try {
      const [apiKey, batchSize] = await Promise.all([
        AsyncStorage.getItem(DEEPL_API_KEY_STORAGE_KEY),
        AsyncStorage.getItem(NEW_CARDS_PER_BATCH_KEY),
      ]);
      set({
        deeplApiKey: apiKey,
        newCardsPerBatch: batchSize ? parseInt(batchSize, 10) : DEFAULT_NEW_CARDS_PER_BATCH,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  loadApiKey: async () => {
    try {
      const key = await AsyncStorage.getItem(DEEPL_API_KEY_STORAGE_KEY);
      set({ deeplApiKey: key, isLoading: false });
    } catch (error) {
      console.error('Failed to load DeepL API key:', error);
      set({ isLoading: false });
    }
  },

  saveApiKey: async (key: string) => {
    try {
      const trimmedKey = key.trim();
      if (trimmedKey) {
        await AsyncStorage.setItem(DEEPL_API_KEY_STORAGE_KEY, trimmedKey);
        set({ deeplApiKey: trimmedKey });
      } else {
        await AsyncStorage.removeItem(DEEPL_API_KEY_STORAGE_KEY);
        set({ deeplApiKey: null });
      }
    } catch (error) {
      console.error('Failed to save DeepL API key:', error);
      throw error;
    }
  },

  clearApiKey: async () => {
    try {
      await AsyncStorage.removeItem(DEEPL_API_KEY_STORAGE_KEY);
      set({ deeplApiKey: null });
    } catch (error) {
      console.error('Failed to clear DeepL API key:', error);
      throw error;
    }
  },

  setNewCardsPerBatch: async (count: number) => {
    try {
      await AsyncStorage.setItem(NEW_CARDS_PER_BATCH_KEY, count.toString());
      set({ newCardsPerBatch: count });
    } catch (error) {
      console.error('Failed to save new cards per batch:', error);
      throw error;
    }
  },
}));
