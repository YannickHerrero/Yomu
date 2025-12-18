import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { DeckCard } from '@/database/deck';
import {
  getDueCards,
  getAllCards,
  getBurnedCards,
  getDeckStats,
  addCardToDeck,
  removeCardFromDeck,
  updateCardAfterReview,
  unburnCard as unburnCardDb,
} from '@/database/deck';
import { recordReview } from '@/database/reviewHistory';
import { calculateNewStage } from '@/utils/srs';
import { useSessionStore } from './useSessionStore';

export type { DeckCard } from '@/database/deck';

export type DeckStats = {
  totalCards: number;
  activeCards: number;
  burnedCards: number;
  dueNow: number;
  apprentice: number;
  guru: number;
  master: number;
  enlightened: number;
};

export type SessionResults = {
  correct: number;
  incorrect: number;
  burned: number;
};

export type ReviewSession = {
  queue: DeckCard[]; // Cards remaining to review
  currentCard: DeckCard | null; // Current card being reviewed
  isRevealed: boolean; // Is the answer revealed?
  incorrectCounts: Map<number, number>; // cardId → error count this session
  results: SessionResults;
  totalCards: number; // Total cards at session start
};

type DeckState = {
  // Data
  cards: DeckCard[];
  dueCards: DeckCard[];
  burnedCards: DeckCard[];
  stats: DeckStats;
  isLoading: boolean;

  // Review session
  session: ReviewSession | null;

  // Data actions
  loadAllData: (db: SQLiteDatabase) => Promise<void>;
  refreshStats: (db: SQLiteDatabase) => Promise<void>;
  refreshDueCards: (db: SQLiteDatabase) => Promise<void>;
  addCard: (db: SQLiteDatabase, dictionaryId: number) => Promise<void>;
  removeCard: (db: SQLiteDatabase, cardId: number) => Promise<void>;
  unburnCard: (db: SQLiteDatabase, cardId: number) => Promise<void>;

  // Session actions
  startSession: (db: SQLiteDatabase) => Promise<boolean>;
  revealCard: () => void;
  submitAnswer: (db: SQLiteDatabase, isCorrect: boolean) => Promise<void>;
  endSession: () => void;

  // Legacy setters (for compatibility)
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

export const useDeckStore = create<DeckState>((set, get) => ({
  // Initial state
  cards: [],
  dueCards: [],
  burnedCards: [],
  stats: initialStats,
  isLoading: false,
  session: null,

  // Load all data from database
  loadAllData: async (db: SQLiteDatabase) => {
    set({ isLoading: true });
    try {
      const [cards, dueCards, burnedCards, stats] = await Promise.all([
        getAllCards(db),
        getDueCards(db),
        getBurnedCards(db),
        getDeckStats(db),
      ]);
      set({ cards, dueCards, burnedCards, stats });
    } catch (error) {
      console.error('Failed to load deck data:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh just stats
  refreshStats: async (db: SQLiteDatabase) => {
    try {
      const stats = await getDeckStats(db);
      set({ stats });
    } catch (error) {
      console.error('Failed to refresh stats:', error);
      throw error;
    }
  },

  // Refresh due cards
  refreshDueCards: async (db: SQLiteDatabase) => {
    try {
      const [dueCards, stats] = await Promise.all([getDueCards(db), getDeckStats(db)]);
      set({ dueCards, stats });
    } catch (error) {
      console.error('Failed to refresh due cards:', error);
      throw error;
    }
  },

  // Add a card to deck
  addCard: async (db: SQLiteDatabase, dictionaryId: number) => {
    try {
      // Check if there's an active reading session
      const sessionState = useSessionStore.getState();
      const activeSessionId = sessionState.currentSessionId;

      console.log('Adding card to deck, active session:', activeSessionId);

      await addCardToDeck(db, dictionaryId, activeSessionId ?? undefined);

      // If there's an active session, increment the cards added counter
      if (activeSessionId) {
        console.log('Incrementing cards added counter');
        sessionState.incrementCardsAdded();
      }

      // Refresh data
      const [cards, dueCards, stats] = await Promise.all([
        getAllCards(db),
        getDueCards(db),
        getDeckStats(db),
      ]);
      set({ cards, dueCards, stats });
    } catch (error) {
      console.error('Failed to add card:', error);
      throw error;
    }
  },

  // Remove a card from deck
  removeCard: async (db: SQLiteDatabase, cardId: number) => {
    try {
      await removeCardFromDeck(db, cardId);
      // Refresh data
      const [cards, dueCards, stats] = await Promise.all([
        getAllCards(db),
        getDueCards(db),
        getDeckStats(db),
      ]);
      set({ cards, dueCards, stats });
    } catch (error) {
      console.error('Failed to remove card:', error);
      throw error;
    }
  },

  // Unburn a card
  unburnCard: async (db: SQLiteDatabase, cardId: number) => {
    try {
      await unburnCardDb(db, cardId);
      // Refresh data
      const [cards, dueCards, burnedCards, stats] = await Promise.all([
        getAllCards(db),
        getDueCards(db),
        getBurnedCards(db),
        getDeckStats(db),
      ]);
      set({ cards, dueCards, burnedCards, stats });
    } catch (error) {
      console.error('Failed to unburn card:', error);
      throw error;
    }
  },

  // Start a review session
  startSession: async (db: SQLiteDatabase) => {
    try {
      // Get fresh due cards
      const dueCards = await getDueCards(db);

      if (dueCards.length === 0) {
        return false;
      }

      // Shuffle the cards for variety
      const shuffled = [...dueCards].sort(() => Math.random() - 0.5);

      set({
        session: {
          queue: shuffled.slice(1), // All cards except first
          currentCard: shuffled[0], // First card
          isRevealed: false,
          incorrectCounts: new Map(),
          results: { correct: 0, incorrect: 0, burned: 0 },
          totalCards: shuffled.length,
        },
      });
      
      return true;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  },

  // Reveal the current card's answer
  revealCard: () => {
    const { session } = get();
    if (!session) return;

    set({
      session: {
        ...session,
        isRevealed: true,
      },
    });
  },

  // Submit answer for current card
  submitAnswer: async (db: SQLiteDatabase, isCorrect: boolean) => {
    const { session } = get();
    if (!session || !session.currentCard) return;

    const card = session.currentCard;
    const currentIncorrectCount = session.incorrectCounts.get(card.id) ?? 0;
    const newIncorrectCount = isCorrect ? currentIncorrectCount : currentIncorrectCount + 1;

    // Calculate new stage
    const newStage = calculateNewStage(card.stage, isCorrect, newIncorrectCount);

    // Record review in history (but don't update card stage/due date yet if incorrect)
    await recordReview(db, card.id, card.stage, newStage, isCorrect, newIncorrectCount);

    // Only update card in database if answer is correct
    // If incorrect, the card stays "due" and will be re-queued in this session
    if (isCorrect) {
      await updateCardAfterReview(db, card.id, newStage, 0);
    }

    // Update session state
    const newResults = { ...session.results };
    if (isCorrect) {
      newResults.correct++;
      if (newStage === 9) {
        newResults.burned++;
      }
    } else {
      newResults.incorrect++;
    }

    // Update incorrect counts map
    const newIncorrectCounts = new Map(session.incorrectCounts);
    if (!isCorrect) {
      newIncorrectCounts.set(card.id, newIncorrectCount);
    }

    // Determine next card
    let newQueue = [...session.queue];
    let nextCard: DeckCard | null = null;

    if (!isCorrect) {
      // Wrong answer: add card to end of queue (keep original stage/due date)
      // The stage calculation is for the review record, not for immediate update
      const updatedCard = { ...card, currentIncorrectCount: newIncorrectCount };
      newQueue.push(updatedCard);
    }

    if (newQueue.length > 0) {
      nextCard = newQueue[0];
      newQueue = newQueue.slice(1);
    }

    set({
      session: {
        ...session,
        queue: newQueue,
        currentCard: nextCard,
        isRevealed: false,
        incorrectCounts: newIncorrectCounts,
        results: newResults,
      },
    });
  },

  // End the session
  endSession: () => {
    set({ session: null });
  },

  // Legacy setters
  setCards: (cards) => set({ cards }),
  setDueCards: (cards) => set({ dueCards: cards }),
  setBurnedCards: (cards) => set({ burnedCards: cards }),
  setStats: (stats) => set({ stats }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
