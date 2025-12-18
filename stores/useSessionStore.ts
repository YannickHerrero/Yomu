import { create } from 'zustand';

type ReadingSession = {
  id: number;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  cardsAddedCount: number;
};

type SessionState = {
  // Stopwatch state
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
  currentSessionId: number | null;
  cardsAddedCount: number;

  // History
  sessions: ReadingSession[];
  isLoading: boolean;

  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  setElapsedTime: (time: number) => void;
  setCurrentSessionId: (id: number | null) => void;
  setCardsAddedCount: (count: number) => void;
  incrementCardsAdded: () => void;
  setSessions: (sessions: ReadingSession[]) => void;
  setIsLoading: (loading: boolean) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isRunning: false,
  startTime: null,
  elapsedTime: 0,
  currentSessionId: null,
  cardsAddedCount: 0,
  sessions: [],
  isLoading: false,

  startTimer: () =>
    set((state) => ({
      isRunning: true,
      startTime: Date.now() - state.elapsedTime,
    })),

  pauseTimer: () => set({ isRunning: false }),

  stopTimer: () =>
    set({
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
      currentSessionId: null,
      cardsAddedCount: 0,
    }),

  setElapsedTime: (time) => set({ elapsedTime: time }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setCardsAddedCount: (count) => set({ cardsAddedCount: count }),
  incrementCardsAdded: () => set((state) => ({ cardsAddedCount: state.cardsAddedCount + 1 })),
  setSessions: (sessions) => set({ sessions }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
