import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, PlatformColor, Pressable, Animated } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { StageIndicator } from './StageIndicator';
import type { DeckCard } from '@/stores/useDeckStore';

type FlashcardProps = {
  card: DeckCard;
  isRevealed: boolean;
  onReveal: () => void;
  onWrong?: () => void;
  onCorrect?: () => void;
};

export function Flashcard({ card, isRevealed, onReveal, onWrong, onCorrect }: FlashcardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animate the answer reveal
  useEffect(() => {
    if (isRevealed) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isRevealed, fadeAnim]);

  // Display word - prefer kanji, fallback to reading
  const displayWord = card.kanji || card.reading;
  // Only show reading separately if we're showing kanji
  const showReadingSeparately = card.kanji !== null;

  // Format definitions
  const definitions = card.definitions.slice(0, 3); // Show max 3 definitions

  // Content to display (same for both states)
  const cardContent = (
    <>
      {/* Stage indicator */}
      <View style={styles.stageContainer}>
        <StageIndicator stage={card.stage} size="small" />
      </View>

      {/* Main word */}
      <View style={styles.wordContainer}>
        <Text style={styles.word}>{displayWord}</Text>

        {/* Tap to reveal hint */}
        {!isRevealed && <Text style={styles.tapHint}>Tap to reveal</Text>}
      </View>

      {/* Answer section (revealed) */}
      {isRevealed && (
        <Animated.View style={[styles.answerContainer, { opacity: fadeAnim }]}>
          {/* Reading (if showing kanji) */}
          {showReadingSeparately && <Text style={styles.reading}>{card.reading}</Text>}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Definitions */}
          <View style={styles.definitionsContainer}>
            {definitions.map((def, index) => (
              <Text key={index} style={styles.definition}>
                {index + 1}. {def}
              </Text>
            ))}
            {card.definitions.length > 3 && (
              <Text style={styles.moreDefinitions}>
                +{card.definitions.length - 3} more
              </Text>
            )}
          </View>
        </Animated.View>
      )}
    </>
  );

  // If not revealed, single pressable to reveal
  if (!isRevealed) {
    return (
      <Pressable onPress={onReveal}>
        <GlassView style={styles.card} glassEffectStyle="regular">
          {cardContent}
        </GlassView>
      </Pressable>
    );
  }

  // When revealed, split into left (wrong) and right (correct) halves
  return (
    <View style={styles.splitContainer}>
      <Pressable onPress={onWrong} style={styles.leftHalf}>
        <GlassView style={styles.card} glassEffectStyle="regular">
          {cardContent}
        </GlassView>
      </Pressable>

      <Pressable onPress={onCorrect} style={styles.rightHalf}>
        <View style={styles.transparentOverlay} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 24,
    minHeight: 300,
  },
  stageContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  wordContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  word: {
    fontSize: 56,
    fontWeight: '600',
    color: PlatformColor('label'),
    textAlign: 'center',
  },
  tapHint: {
    fontSize: 14,
    color: PlatformColor('tertiaryLabel'),
    marginTop: 16,
  },
  answerContainer: {
    paddingTop: 8,
  },
  reading: {
    fontSize: 28,
    color: PlatformColor('secondaryLabel'),
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: PlatformColor('separator'),
    marginVertical: 16,
  },
  definitionsContainer: {
    gap: 8,
  },
  definition: {
    fontSize: 16,
    color: PlatformColor('label'),
    lineHeight: 22,
  },
  moreDefinitions: {
    fontSize: 14,
    color: PlatformColor('tertiaryLabel'),
    fontStyle: 'italic',
    marginTop: 4,
  },
  splitContainer: {
    position: 'relative',
  },
  leftHalf: {
    width: '100%',
  },
  rightHalf: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
  },
  transparentOverlay: {
    width: '100%',
    height: '100%',
  },
});
