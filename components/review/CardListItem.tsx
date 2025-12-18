import React from 'react';
import { View, Text, StyleSheet, PlatformColor, Pressable } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { StageIndicator } from './StageIndicator';
import type { DeckCard } from '@/stores/useDeckStore';

type CardListItemProps = {
  card: DeckCard;
  onPress?: () => void;
  showStage?: boolean;
  rightContent?: React.ReactNode;
};

export function CardListItem({
  card,
  onPress,
  showStage = true,
  rightContent,
}: CardListItemProps) {
  // Display word - prefer kanji, fallback to reading
  const displayWord = card.kanji || card.reading;
  // Only show reading separately if we're showing kanji
  const showReadingSeparately = card.kanji !== null;

  // Get first definition for preview
  const definitionPreview =
    card.definitions.length > 0
      ? card.definitions[0].length > 50
        ? card.definitions[0].slice(0, 50) + '...'
        : card.definitions[0]
      : '';

  const content = (
    <GlassView style={styles.container} glassEffectStyle="regular" isInteractive={!!onPress}>
      <View style={styles.mainContent}>
        {/* Word */}
        <View style={styles.wordRow}>
          <Text style={styles.word}>{displayWord}</Text>
          {showReadingSeparately && (
            <Text style={styles.reading}>{card.reading}</Text>
          )}
        </View>

        {/* Definition preview */}
        <Text style={styles.definition} numberOfLines={1}>
          {definitionPreview}
        </Text>
      </View>

      {/* Right side - stage or custom content */}
      <View style={styles.rightContent}>
        {rightContent || (showStage && <StageIndicator stage={card.stage} size="small" />)}
      </View>
    </GlassView>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  mainContent: {
    flex: 1,
    marginRight: 12,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  word: {
    fontSize: 20,
    fontWeight: '600',
    color: PlatformColor('label'),
  },
  reading: {
    fontSize: 14,
    color: PlatformColor('secondaryLabel'),
  },
  definition: {
    fontSize: 14,
    color: PlatformColor('tertiaryLabel'),
  },
  rightContent: {
    flexShrink: 0,
  },
});
