import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, ActivityIndicator, View, Text, StyleSheet, PlatformColor } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar, type SearchBarRef } from '@/components/dictionary/SearchBar';
import { DictionaryEntry } from '@/components/dictionary/DictionaryEntry';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useDictionaryStore } from '@/stores/useDictionaryStore';
import { searchDictionary, getInDeckStatus } from '@/database/dictionary';
import { addCardToDeck, removeCardByDictionaryId } from '@/database/deck';
import type { DictionaryEntry as DictionaryEntryType } from '@/database/dictionary';

const SEARCH_DEBOUNCE_MS = 150;
const PAGE_SIZE = 20;

export default function DictionaryScreen() {
  const insets = useSafeAreaInsets();
  const { db, isLoading: dbLoading, error: dbError } = useDatabase();
  const {
    searchQuery,
    results,
    isLoading,
    hasMore,
    inDeckIds,
    setSearchQuery,
    setResults,
    appendResults,
    setIsLoading,
    setHasMore,
    setInDeckIds,
    addToDeckIds,
    removeFromDeckIds,
    clearResults,
  } = useDictionaryStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offsetRef = useRef(0);
  const isLoadingRef = useRef(false);
  const searchBarRef = useRef<SearchBarRef>(null);

  // Focus search bar when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Focus the search bar when the tab is focused
      const timeout = setTimeout(() => {
        searchBarRef.current?.focus();
      }, 100);

      return () => {
        clearTimeout(timeout);
      };
    }, [])
  );

  // Perform search
  const performSearch = useCallback(
    async (query: string, append = false) => {
      if (!db) return;

      if (!query.trim()) {
        clearResults();
        offsetRef.current = 0;
        return;
      }

      // Prevent concurrent searches
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        const offset = append ? offsetRef.current : 0;
        const searchResults = await searchDictionary(db, query, PAGE_SIZE, offset);

        // Get in-deck status for all results
        const ids = searchResults.map((r) => r.id);
        const deckStatus = await getInDeckStatus(db, ids);

        if (append) {
          appendResults(searchResults);
          setInDeckIds(deckStatus, true); // merge mode
        } else {
          setResults(searchResults);
          setInDeckIds(deckStatus, false);
        }

        offsetRef.current = offset + searchResults.length;
        setHasMore(searchResults.length === PAGE_SIZE);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [db, clearResults, setIsLoading, setResults, appendResults, setInDeckIds, setHasMore]
  );

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      offsetRef.current = 0;
      performSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Handle text change
  const handleChangeText = useCallback(
    (text: string) => {
      setSearchQuery(text);
    },
    [setSearchQuery]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    setSearchQuery('');
    clearResults();
    offsetRef.current = 0;
  }, [setSearchQuery, clearResults]);

  // Handle load more (infinite scroll)
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore && searchQuery.trim()) {
      performSearch(searchQuery, true);
    }
  }, [isLoading, hasMore, searchQuery, performSearch]);

  // Handle add to deck
  const handleAddToDeck = useCallback(
    async (entry: DictionaryEntryType) => {
      if (!db) return;

      try {
        await addCardToDeck(db, entry.id);
        addToDeckIds(entry.id);
      } catch (err) {
        console.error('Failed to add to deck:', err);
        throw err;
      }
    },
    [db, addToDeckIds]
  );

  // Handle remove from deck
  const handleRemoveFromDeck = useCallback(
    async (entry: DictionaryEntryType) => {
      if (!db) return;

      try {
        await removeCardByDictionaryId(db, entry.id);
        removeFromDeckIds(entry.id);
      } catch (err) {
        console.error('Failed to remove from deck:', err);
        throw err;
      }
    },
    [db, removeFromDeckIds]
  );

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: DictionaryEntryType }) => (
      <DictionaryEntry
        entry={item}
        isInDeck={inDeckIds.has(item.id)}
        onAddToDeck={() => handleAddToDeck(item)}
        onRemoveFromDeck={() => handleRemoveFromDeck(item)}
      />
    ),
    [inDeckIds, handleAddToDeck, handleRemoveFromDeck]
  );

  // Key extractor
  const keyExtractor = useCallback((item: DictionaryEntryType) => item.id.toString(), []);

  // Render footer (loading indicator for infinite scroll)
  const renderFooter = useCallback(() => {
    if (!isLoading || results.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" />
      </View>
    );
  }, [isLoading, results.length]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Type to search the dictionary</Text>
          <Text style={styles.emptySubtext}>
            You can search in Japanese, romaji, or English
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          No results found for &quot;{searchQuery}&quot;
        </Text>
      </View>
    );
  }, [isLoading, searchQuery]);

  // Loading state for database initialization
  if (dbLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading dictionary...</Text>
      </View>
    );
  }

  // Error state
  if (dbError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Failed to load dictionary: {dbError}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { paddingTop: insets.top + 16 }]}>
        <SearchBar
          ref={searchBarRef}
          value={searchQuery}
          onChangeText={handleChangeText}
          onClear={handleClear}
        />
      </View>

      {/* Results List */}
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        extraData={inDeckIds}
        contentContainerStyle={[
          styles.listContent,
          results.length === 0 && styles.listContentEmpty,
        ]}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />

      {/* Loading overlay for initial search */}
      {isLoading && results.length === 0 && searchQuery.trim() && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PlatformColor('systemBackground'),
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: PlatformColor('systemBackground'),
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: PlatformColor('secondaryLabel'),
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: PlatformColor('tertiaryLabel'),
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PlatformColor('systemBackground'),
  },
  loadingText: {
    fontSize: 16,
    color: PlatformColor('secondaryLabel'),
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: PlatformColor('systemBackground'),
  },
  errorText: {
    fontSize: 16,
    color: PlatformColor('label'),
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
