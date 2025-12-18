import { create } from 'zustand';

type ReadingSession = {
  id: number;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
};

type SessionState = {
  // Stopwatch state
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
  currentSessionId: number | null;

  // History
  sessions: ReadingSession[];
  isLoading: boolean;

  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  setElapsedTime: (time: number) => void;
  setCurrentSessionId: (id: number | null) => void;
  setSessions: (sessions: ReadingSession[]) => void;
  setIsLoading: (loading: boolean) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isRunning: false,
  startTime: null,
  elapsedTime: 0,
  currentSessionId: null,
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
    }),

  setElapsedTime: (time) => set({ elapsedTime: time }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setSessions: (sessions) => set({ sessions }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
