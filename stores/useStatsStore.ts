import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import {
  getAllStats,
  getHeatmapData,
  getForecastData,
  type HeatmapData,
  type ForecastData,
} from '@/database/stats';

type StatsState = {
  // Overview
  totalReviews: number;
  reviewsToday: number;
  studyDays: number;
  currentStreak: number;
  bestStreak: number;

  // Performance
  successRateAllTime: number;
  successRate7Days: number;
  successRate30Days: number;

  // Visualizations
  heatmapData: HeatmapData[];
  forecastData: ForecastData[];

  isLoading: boolean;
  error: string | null;

  // Actions
  loadAllStats: (db: SQLiteDatabase) => Promise<void>;
  loadHeatmapData: (db: SQLiteDatabase, year?: number) => Promise<void>;
  loadForecastData: (db: SQLiteDatabase, days?: number) => Promise<void>;
  refreshStats: (db: SQLiteDatabase) => Promise<void>;
  reset: () => void;
};

const initialState = {
  totalReviews: 0,
  reviewsToday: 0,
  studyDays: 0,
  currentStreak: 0,
  bestStreak: 0,
  successRateAllTime: 0,
  successRate7Days: 0,
  successRate30Days: 0,
  heatmapData: [],
  forecastData: [],
  isLoading: false,
  error: null,
};

export const useStatsStore = create<StatsState>((set) => ({
  ...initialState,

  loadAllStats: async (db: SQLiteDatabase) => {
    try {
      set({ isLoading: true, error: null });

      const stats = await getAllStats(db);

      set({
        totalReviews: stats.totalReviews,
        reviewsToday: stats.reviewsToday,
        studyDays: stats.studyDays,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
        successRateAllTime: stats.successRateAllTime,
        successRate7Days: stats.successRate7Days,
        successRate30Days: stats.successRate30Days,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load statistics' 
      });
    }
  },

  loadHeatmapData: async (db: SQLiteDatabase, year?: number) => {
    try {
      const data = await getHeatmapData(db, year);
      set({ heatmapData: data });
    } catch (error) {
      console.error('Failed to load heatmap data:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to load heatmap' });
    }
  },

  loadForecastData: async (db: SQLiteDatabase, days: number = 30) => {
    try {
      const data = await getForecastData(db, days);
      set({ forecastData: data });
    } catch (error) {
      console.error('Failed to load forecast data:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to load forecast' });
    }
  },

  refreshStats: async (db: SQLiteDatabase) => {
    try {
      set({ isLoading: true, error: null });

      const [stats, heatmap, forecast] = await Promise.all([
        getAllStats(db),
        getHeatmapData(db),
        getForecastData(db, 30),
      ]);

      set({
        totalReviews: stats.totalReviews,
        reviewsToday: stats.reviewsToday,
        studyDays: stats.studyDays,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
        successRateAllTime: stats.successRateAllTime,
        successRate7Days: stats.successRate7Days,
        successRate30Days: stats.successRate30Days,
        heatmapData: heatmap,
        forecastData: forecast,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to refresh stats:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to refresh statistics' 
      });
    }
  },

  reset: () => set(initialState),
}));
