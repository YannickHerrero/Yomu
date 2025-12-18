import { create } from 'zustand';

type DeckCard = {
  id: number;
  dictionaryId: number;
  addedAt: string;
  dueDate: string | null;
  stage: number;
  currentIncorrectCount: number;
  // Joined from dictionary
  kanji: string | null;
  reading: string;
  definitions: string[];
};

type DeckStats = {
  totalCards: number;
  activeCards: number;
  burnedCards: number;
  dueNow: number;
  apprentice: number;
  guru: number;
  master: number;
  enlightened: number;
};

type DeckState = {
  cards: DeckCard[];
  dueCards: DeckCard[];
  burnedCards: DeckCard[];
  stats: DeckStats;
  isLoading: boolean;
  setCards: (cards: DeckCard[]) => void;
  setDueCards: (cards: DeckCard[]) => void;
  setBurnedCards: (cards: DeckCard[]) => void;
  setStats: (stats: DeckStats) => void;
  setIsLoading: (loading: boolean) => void;
};

const initialStats: DeckStats = {
  totalCards: 0,
  activeCards: 0,
  burnedCards: 0,
  dueNow: 0,
  apprentice: 0,
  guru: 0,
  master: 0,
  enlightened: 0,
};

export const useDeckStore = create<DeckState>((set) => ({
  cards: [],
  dueCards: [],
  burnedCards: [],
  stats: initialStats,
  isLoading: false,
  setCards: (cards) => set({ cards }),
  setDueCards: (cards) => set({ dueCards: cards }),
  setBurnedCards: (cards) => set({ burnedCards: cards }),
  setStats: (stats) => set({ stats }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
