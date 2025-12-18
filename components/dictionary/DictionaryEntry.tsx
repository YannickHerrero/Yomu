import React from 'react';
import { View, Text, StyleSheet, PlatformColor } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { AddToDeckButton } from './AddToDeckButton';
import type { DictionaryEntry as DictionaryEntryType } from '@/database/dictionary';

type DictionaryEntryProps = {
  entry: DictionaryEntryType;
  isInDeck: boolean;
  onAddToDeck: () => Promise<void>;
  onRemoveFromDeck?: () => Promise<void>;
};

export function DictionaryEntry({
  entry,
  isInDeck,
  onAddToDeck,
  onRemoveFromDeck,
}: DictionaryEntryProps) {
  const displayWord = entry.kanji || entry.reading;
  const showReading = entry.kanji !== null;
  const primaryPos = entry.partOfSpeech[0];

  return (
    <GlassView style={styles.card} glassEffectStyle="regular">
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Word with furigana */}
          <View style={styles.wordRow}>
            <Text style={styles.word}>{displayWord}</Text>
            {showReading && (
              <Text style={styles.reading}>{entry.reading}</Text>
            )}
            {entry.common && (
              <View style={styles.commonBadge}>
                <Text style={styles.commonText}>common</Text>
              </View>
            )}
          </View>

          {/* Part of speech */}
          {primaryPos && (
            <View style={styles.posBadge}>
              <Text style={styles.posText}>{primaryPos}</Text>
            </View>
          )}

          {/* Definitions */}
          <View style={styles.definitions}>
            {entry.definitions.slice(0, 5).map((def, index) => (
              <Text key={index} style={styles.definition}>
                {entry.definitions.length > 1 ? `${index + 1}. ` : ''}
                {def}
              </Text>
            ))}
            {entry.definitions.length > 5 && (
              <Text style={styles.moreDefinitions}>
                +{entry.definitions.length - 5} more definitions
              </Text>
            )}
          </View>
        </View>

        {/* Add to deck button */}
        <View style={styles.buttonContainer}>
          <AddToDeckButton
            isInDeck={isInDeck}
            onAdd={onAddToDeck}
            onRemove={onRemoveFromDeck}
          />
        </View>
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  container: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  word: {
    fontSize: 24,
    fontWeight: '700',
    color: PlatformColor('label'),
  },
  reading: {
    fontSize: 16,
    color: PlatformColor('secondaryLabel'),
    marginLeft: 8,
  },
  commonBadge: {
    backgroundColor: PlatformColor('systemGreen'),
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  commonText: {
    fontSize: 11,
    fontWeight: '600',
    color: PlatformColor('systemBackground'),
  },
  posBadge: {
    backgroundColor: PlatformColor('secondarySystemFill'),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  posText: {
    fontSize: 12,
    fontWeight: '500',
    color: PlatformColor('secondaryLabel'),
  },
  definitions: {
    marginTop: 12,
  },
  definition: {
    fontSize: 15,
    color: PlatformColor('label'),
    marginBottom: 4,
    lineHeight: 20,
  },
  moreDefinitions: {
    fontSize: 13,
    color: PlatformColor('tertiaryLabel'),
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    alignSelf: 'flex-start',
  },
});
