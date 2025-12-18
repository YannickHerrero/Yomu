import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PlatformColor,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Host, Picker } from '@expo/ui/swift-ui';
import { GlassView } from 'expo-glass-effect';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useDeckStore, type DeckCard } from '@/stores/useDeckStore';
import { CardListItem } from '@/components/review/CardListItem';
import { getGroupFromStage } from '@/constants/srs';

type SortOption = 'added' | 'stage' | 'due' | 'alphabetical';
type FilterOption = 'all' | 'apprentice' | 'guru' | 'master' | 'enlightened';

const sortLabels: string[] = ['Recently Added', 'Stage', 'Due Date', 'Alphabetical'];
const sortValues: SortOption[] = ['added', 'stage', 'due', 'alphabetical'];

const filterLabels: string[] = ['All', 'Apprentice', 'Guru', 'Master', 'Enlightened'];
const filterValues: FilterOption[] = ['all', 'apprentice', 'guru', 'master', 'enlightened'];

export default function DeckScreen() {
  const { db } = useDatabase();
  const { cards, isLoading, loadAllData, removeCard } = useDeckStore();

  const [sortIndex, setSortIndex] = useState<number>(0);
  const [filterIndex, setFilterIndex] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  const sortBy = sortValues[sortIndex];
  const filterBy = filterValues[filterIndex];

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

  // Handle delete card
  const handleDeleteCard = useCallback(
    (card: DeckCard) => {
      Alert.alert(
        'Remove Card',
        `Remove "${card.kanji || card.reading}" from your deck? Your progress will be lost.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              if (db) {
                try {
                  await removeCard(db, card.id);
                } catch (error) {
                  console.error('Failed to remove card:', error);
                }
              }
            },
          },
        ]
      );
    },
    [db, removeCard]
  );

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    let result = [...cards];

    // Filter
    if (filterBy !== 'all') {
      result = result.filter((card) => getGroupFromStage(card.stage) === filterBy);
    }

    // Sort
    switch (sortBy) {
      case 'added':
        result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        break;
      case 'stage':
        result.sort((a, b) => b.stage - a.stage);
        break;
      case 'due':
        result.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        break;
      case 'alphabetical':
        result.sort((a, b) => {
          const aWord = a.kanji || a.reading;
          const bWord = b.kanji || b.reading;
          return aWord.localeCompare(bWord, 'ja');
        });
        break;
    }

    return result;
  }, [cards, filterBy, sortBy]);

  // Render card item
  const renderItem = useCallback(
    ({ item }: { item: DeckCard }) => (
      <View style={styles.cardItem}>
        <CardListItem card={item} onPress={() => handleDeleteCard(item)} />
      </View>
    ),
    [handleDeleteCard]
  );

  // Key extractor
  const keyExtractor = useCallback((item: DeckCard) => item.id.toString(), []);

  // Empty state
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <GlassView style={styles.emptyCard} glassEffectStyle="regular">
          <Text style={styles.emptyTitle}>
            {filterBy === 'all' ? 'No cards in deck' : `No ${filterBy} cards`}
          </Text>
          <Text style={styles.emptyText}>
            {filterBy === 'all'
              ? 'Add words from the dictionary to start building your deck.'
              : 'Try changing the filter to see more cards.'}
          </Text>
        </GlassView>
      </View>
    );
  }, [isLoading, filterBy]);

  // Handle sort picker change
  const handleSortChange = useCallback(
    (event: { nativeEvent: { index: number; label: string } }) => {
      setSortIndex(event.nativeEvent.index);
    },
    []
  );

  // Handle filter picker change
  const handleFilterChange = useCallback(
    (event: { nativeEvent: { index: number; label: string } }) => {
      setFilterIndex(event.nativeEvent.index);
    },
    []
  );

  // Header with filter/sort controls
  const renderHeader = useCallback(() => {
    return (
      <View style={styles.header}>
        <Text style={styles.countText}>
          {filteredAndSortedCards.length} {filteredAndSortedCards.length === 1 ? 'card' : 'cards'}
        </Text>

        <View style={styles.controls}>
          {/* Sort Picker */}
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Sort:</Text>
            <Host style={styles.picker}>
              <Picker
                options={sortLabels}
                selectedIndex={sortIndex}
                onOptionSelected={handleSortChange}
                variant="menu"
              />
            </Host>
          </View>

          {/* Filter Picker */}
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Filter:</Text>
            <Host style={styles.picker}>
              <Picker
                options={filterLabels}
                selectedIndex={filterIndex}
                onOptionSelected={handleFilterChange}
                variant="menu"
              />
            </Host>
          </View>
        </View>
      </View>
    );
  }, [filteredAndSortedCards.length, sortIndex, filterIndex, handleSortChange, handleFilterChange]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredAndSortedCards}
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
    marginBottom: 12,
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
  },
  pickerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerLabel: {
    fontSize: 14,
    color: PlatformColor('secondaryLabel'),
  },
  picker: {
    flex: 1,
  },
  cardItem: {
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 40,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
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
