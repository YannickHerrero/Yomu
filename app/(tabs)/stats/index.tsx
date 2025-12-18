import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  PlatformColor,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useStatsStore } from '@/stores/useStatsStore';
import { useDeckStore } from '@/stores/useDeckStore';
import { StatCard } from '@/components/stats/StatCard';
import { StreakDisplay } from '@/components/stats/StreakDisplay';
import { PerformanceCard } from '@/components/stats/PerformanceCard';
import { StageDistribution } from '@/components/stats/StageDistribution';
import { ForecastChart } from '@/components/stats/ForecastChart';
import { Heatmap } from '@/components/stats/Heatmap';

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const stats = useStatsStore();
  const deck = useDeckStore();
  const [refreshing, setRefreshing] = useState(false);

  // Load all stats on mount
  useEffect(() => {
    if (db) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const loadData = async () => {
    if (!db) return;

    try {
      await Promise.all([
        stats.loadAllStats(db),
        stats.loadHeatmapData(db),
        stats.loadForecastData(db),
        deck.refreshStats(db),
      ]);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleRefresh = async () => {
    if (!db) return;

    setRefreshing(true);
    try {
      await Promise.all([
        stats.refreshStats(db),
        deck.refreshStats(db),
      ]);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!db || stats.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  const hasData = stats.totalReviews > 0 || deck.stats.totalCards > 0;

  if (!hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Statistics Yet</Text>
        <Text style={styles.emptyMessage}>
          Add cards to your deck and start reviewing to see your statistics here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <Text style={styles.screenTitle}>Statistics</Text>

      {/* Overview Cards */}
      <View style={styles.section}>
        <View style={styles.cardRow}>
          <StatCard label="Total Cards" value={deck.stats.totalCards} />
          <StatCard label="Active" value={deck.stats.activeCards} />
          <StatCard label="Burned" value={deck.stats.burnedCards} />
        </View>

        <View style={styles.cardRow}>
          <StatCard label="Total Reviews" value={stats.totalReviews} />
          <StatCard label="Reviews Today" value={stats.reviewsToday} />
        </View>

        <View style={styles.cardRow}>
          <StatCard label="Study Days" value={stats.studyDays} subtitle="days with reviews" />
          <StatCard
            label="Due Now"
            value={deck.stats.dueNow}
            subtitle="cards ready"
          />
        </View>
      </View>

      {/* Streak */}
      {stats.currentStreak > 0 && (
        <View style={styles.section}>
          <StreakDisplay
            currentStreak={stats.currentStreak}
            bestStreak={stats.bestStreak}
          />
        </View>
      )}

      {/* Performance */}
      {stats.totalReviews > 0 && (
        <View style={styles.section}>
          <PerformanceCard
            successRateAllTime={stats.successRateAllTime}
            successRate7Days={stats.successRate7Days}
            successRate30Days={stats.successRate30Days}
          />
        </View>
      )}

      {/* Stage Distribution */}
      {deck.stats.activeCards > 0 && (
        <View style={styles.section}>
          <StageDistribution
            apprentice={deck.stats.apprentice}
            guru={deck.stats.guru}
            master={deck.stats.master}
            enlightened={deck.stats.enlightened}
            burned={deck.stats.burnedCards}
            totalCards={deck.stats.totalCards}
          />
        </View>
      )}

      {/* Heatmap */}
      {stats.heatmapData.length > 0 && (
        <View style={styles.section}>
          <Heatmap data={stats.heatmapData} />
        </View>
      )}

      {/* Forecast */}
      {stats.forecastData.length > 0 && (
        <View style={styles.section}>
          <ForecastChart data={stats.forecastData} />
        </View>
      )}

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PlatformColor('systemBackground'),
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PlatformColor('systemBackground'),
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: PlatformColor('secondaryLabel'),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PlatformColor('systemBackground'),
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: PlatformColor('label'),
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 15,
    color: PlatformColor('secondaryLabel'),
    textAlign: 'center',
    lineHeight: 22,
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: PlatformColor('label'),
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  bottomSpacing: {
    height: 40,
  },
});
