import { create } from 'zustand';

type DailyStats = {
  date: string;
  reviewsCount: number;
  correctCount: number;
  incorrectCount: number;
};

type HeatmapData = {
  date: string;
  count: number;
};

type ForecastData = {
  date: string;
  count: number;
};

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

  // Actions
  setOverviewStats: (stats: {
    totalReviews: number;
    reviewsToday: number;
    studyDays: number;
    currentStreak: number;
    bestStreak: number;
  }) => void;
  setPerformanceStats: (stats: {
    successRateAllTime: number;
    successRate7Days: number;
    successRate30Days: number;
  }) => void;
  setHeatmapData: (data: HeatmapData[]) => void;
  setForecastData: (data: ForecastData[]) => void;
  setIsLoading: (loading: boolean) => void;
};

export const useStatsStore = create<StatsState>((set) => ({
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

  setOverviewStats: (stats) => set(stats),
  setPerformanceStats: (stats) => set(stats),
  setHeatmapData: (data) => set({ heatmapData: data }),
  setForecastData: (data) => set({ forecastData: data }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
