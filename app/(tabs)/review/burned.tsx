import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PlatformColor,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useFocusEffect } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useDeckStore, type DeckCard } from '@/stores/useDeckStore';
import { CardListItem } from '@/components/review/CardListItem';
import { UnburnButton } from '@/components/review/UnburnButton';

export default function BurnedCardsScreen() {
  const { db } = useDatabase();
  const { burnedCards, isLoading, loadAllData, unburnCard } = useDeckStore();

  const [refreshing, setRefreshing] = useState(false);

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

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    if (!db) return;
    setRefreshing(true);
    try {
      await loadAllData(db);
    } finally {
      setRefreshing(false);
    }
  }, [db, loadAllData]);

  // Handle unburn card
  const handleUnburnCard = useCallback(
    async (card: DeckCard) => {
      if (!db) return;
      await unburnCard(db, card.id);
    },
    [db, unburnCard]
  );

  // Render card item
  const renderItem = useCallback(
    ({ item }: { item: DeckCard }) => (
      <View style={styles.cardItem}>
        <CardListItem
          card={item}
          showStage={false}
          rightContent={
            <UnburnButton
              onUnburn={() => handleUnburnCard(item)}
              cardName={item.kanji || item.reading}
            />
          }
        />
      </View>
    ),
    [handleUnburnCard]
  );

  // Key extractor
  const keyExtractor = useCallback((item: DeckCard) => item.id.toString(), []);

  // Empty state
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <GlassView style={styles.emptyCard} glassEffectStyle="regular">
          <SymbolView
            name="flame.fill"
            style={styles.emptyIcon}
            tintColor={PlatformColor('secondaryLabel')}
          />
          <Text style={styles.emptyTitle}>No burned cards yet</Text>
          <Text style={styles.emptyText}>
            Cards that reach the final SRS stage will appear here. Keep reviewing to burn your first
            card!
          </Text>
        </GlassView>
      </View>
    );
  }, [isLoading]);

  // Header
  const renderHeader = useCallback(() => {
    return (
      <View style={styles.header}>
        <Text style={styles.countText}>
          {burnedCards.length} {burnedCards.length === 1 ? 'card' : 'cards'} burned
        </Text>
        <Text style={styles.subtitleText}>
          Burned cards are mastered and removed from reviews. Tap &quot;Resurrect&quot; to add them back.
        </Text>
      </View>
    );
  }, [burnedCards.length]);

  return (
    <View style={styles.container}>
      <FlatList
        data={burnedCards}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PlatformColor('systemBackground'),
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  countText: {
    fontSize: 14,
    color: PlatformColor('secondaryLabel'),
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: PlatformColor('tertiaryLabel'),
    lineHeight: 18,
  },
  cardItem: {
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 40,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    marginBottom: 16,
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
