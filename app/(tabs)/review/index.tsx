import React, { useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, PlatformColor, Pressable, Text } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useDeckStore } from '@/stores/useDeckStore';
import { DeckStats } from '@/components/review/DeckStats';

export default function ReviewScreen() {
  const { db, isLoading: dbLoading } = useDatabase();
  const { stats, isLoading, loadAllData, startSession } = useDeckStore();

  // Load data on mount
  useEffect(() => {
    if (db) {
      loadAllData(db);
    }
  }, [db, loadAllData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (db) {
        loadAllData(db);
      }
    }, [db, loadAllData])
  );

  const handleStartReview = useCallback(async () => {
    if (!db) return;

    try {
      await startSession(db);
      router.push('/review/session');
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }, [db, startSession]);

  const handleViewDeck = useCallback(() => {
    router.push('/review/deck');
  }, []);

  const handleViewBurned = useCallback(() => {
    router.push('/review/burned');
  }, []);

  if (dbLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Stats Display */}
      <DeckStats stats={stats} onStartReview={handleStartReview} isLoading={isLoading} />

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <Pressable onPress={handleViewDeck} style={styles.navButtonWrapper}>
          <GlassView style={styles.navButton} glassEffectStyle="regular" isInteractive>
            <Text style={styles.navButtonIcon}>📚</Text>
            <Text style={styles.navButtonText}>View Deck</Text>
            <Text style={styles.navButtonSubtext}>{stats.activeCards} cards</Text>
          </GlassView>
        </Pressable>

        <Pressable onPress={handleViewBurned} style={styles.navButtonWrapper}>
          <GlassView style={styles.navButton} glassEffectStyle="regular" isInteractive>
            <Text style={styles.navButtonIcon}>🔥</Text>
            <Text style={styles.navButtonText}>Burned</Text>
            <Text style={styles.navButtonSubtext}>{stats.burnedCards} cards</Text>
          </GlassView>
        </Pressable>
      </View>

      {/* Empty State Message */}
      {stats.totalCards === 0 && (
        <GlassView style={styles.emptyCard} glassEffectStyle="regular">
          <Text style={styles.emptyTitle}>No cards yet</Text>
          <Text style={styles.emptyText}>
            Search for words in the dictionary and add them to your deck to start learning!
          </Text>
        </GlassView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PlatformColor('systemBackground'),
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: PlatformColor('secondaryLabel'),
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  navButtonWrapper: {
    flex: 1,
  },
  navButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  navButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PlatformColor('label'),
  },
  navButtonSubtext: {
    fontSize: 13,
    color: PlatformColor('secondaryLabel'),
    marginTop: 4,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PlatformColor('label'),
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: PlatformColor('secondaryLabel'),
    textAlign: 'center',
    lineHeight: 20,
  },
});
