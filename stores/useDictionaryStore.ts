import { create } from 'zustand';
import type { DictionaryEntry } from '@/database/dictionary';

type DictionaryState = {
  searchQuery: string;
  results: DictionaryEntry[];
  isLoading: boolean;
  hasMore: boolean;
  inDeckIds: Set<number>;
  shouldFocusSearch: boolean;
  setSearchQuery: (query: string) => void;
  setResults: (results: DictionaryEntry[]) => void;
  appendResults: (results: DictionaryEntry[]) => void;
  setIsLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setInDeckIds: (ids: Set<number>, merge?: boolean) => void;
  addToDeckIds: (id: number) => void;
  removeFromDeckIds: (id: number) => void;
  clearResults: () => void;
  triggerFocusSearch: () => void;
  clearFocusSearch: () => void;
  reset: () => void;
};

export const useDictionaryStore = create<DictionaryState>((set) => ({
  searchQuery: '',
  results: [],
  isLoading: false,
  hasMore: true,
  inDeckIds: new Set(),
  shouldFocusSearch: false,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setResults: (results) => set({ results }),
  appendResults: (results) =>
    set((state) => ({ results: [...state.results, ...results] })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setHasMore: (hasMore) => set({ hasMore }),
  setInDeckIds: (ids, merge = false) =>
    set((state) => ({
      inDeckIds: merge ? new Set([...state.inDeckIds, ...ids]) : ids,
    })),
  addToDeckIds: (id) =>
    set((state) => {
      const newSet = new Set(state.inDeckIds);
      newSet.add(id);
      return { inDeckIds: newSet };
    }),
  removeFromDeckIds: (id) =>
    set((state) => {
      const newSet = new Set(state.inDeckIds);
      newSet.delete(id);
      return { inDeckIds: newSet };
    }),
  clearResults: () => set({ results: [], searchQuery: '', hasMore: true }),
  triggerFocusSearch: () => set({ shouldFocusSearch: true }),
  clearFocusSearch: () => set({ shouldFocusSearch: false }),
  reset: () =>
    set({
      searchQuery: '',
      results: [],
      isLoading: false,
      hasMore: true,
      inDeckIds: new Set(),
      shouldFocusSearch: false,
    }),
}));
