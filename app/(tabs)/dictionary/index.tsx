import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Center } from '@/components/ui/center';
import { Spinner } from '@/components/ui/spinner';
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
  const { db, isLoading: dbLoading, error: dbError } = useDatabase();
  const {
    searchQuery,
    results,
    isLoading,
    hasMore,
    inDeckIds,
    shouldFocusSearch,
    setSearchQuery,
    setResults,
    appendResults,
    setIsLoading,
    setHasMore,
    setInDeckIds,
    addToDeckIds,
    removeFromDeckIds,
    clearResults,
    clearFocusSearch,
  } = useDictionaryStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offsetRef = useRef(0);
  const isLoadingRef = useRef(false);
  const searchBarRef = useRef<SearchBarRef>(null);

  // Handle focus trigger from tab press
  useEffect(() => {
    if (shouldFocusSearch) {
      searchBarRef.current?.focus();
      clearFocusSearch();
    }
  }, [shouldFocusSearch, clearFocusSearch]);

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
      <Center className="py-4">
        <ActivityIndicator size="small" />
      </Center>
    );
  }, [isLoading, results.length]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    if (!searchQuery.trim()) {
      return (
        <Center className="flex-1 p-8">
          <Text className="text-typography-400 text-center">
            Type to search the dictionary
          </Text>
          <Text className="text-typography-400 text-center mt-2 text-sm">
            You can search in Japanese, romaji, or English
          </Text>
        </Center>
      );
    }

    return (
      <Center className="flex-1 p-8">
        <Text className="text-typography-400 text-center">
          No results found for &quot;{searchQuery}&quot;
        </Text>
      </Center>
    );
  }, [isLoading, searchQuery]);

  // Loading state for database initialization
  if (dbLoading) {
    return (
      <Box className="flex-1 bg-background-0">
        <Center className="flex-1">
          <Spinner size="large" />
          <Text className="text-typography-400 mt-4">Loading dictionary...</Text>
        </Center>
      </Box>
    );
  }

  // Error state
  if (dbError) {
    return (
      <Box className="flex-1 bg-background-0">
        <Center className="flex-1 p-8">
          <Text className="text-error-500 text-center">
            Failed to load dictionary: {dbError}
          </Text>
        </Center>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-background-0">
      <VStack className="flex-1">
        {/* Search Bar */}
        <Box className="px-4 pt-4 pb-2">
          <SearchBar
            ref={searchBarRef}
            value={searchQuery}
            onChangeText={handleChangeText}
            onClear={handleClear}
            autoFocus
          />
        </Box>

        {/* Results List */}
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            flexGrow: results.length === 0 ? 1 : undefined,
          }}
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
          <Box className="absolute inset-0 bg-background-0/80 justify-center items-center">
            <Spinner size="large" />
          </Box>
        )}
      </VStack>
    </Box>
  );
}
