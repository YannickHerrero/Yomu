import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PlatformColor,
  Pressable,
  Animated,
  Image,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { StageIndicator } from './StageIndicator';
import { getCardImageUri } from '@/utils/imageStorage';
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

  // Get image URI if available
  const imageUri = getCardImageUri(card.imagePath);

  // Front content (not revealed)
  const frontContent = (
    <>
      {/* Stage indicator */}
      <View style={styles.stageContainer}>
        <StageIndicator stage={card.stage} size="small" />
      </View>

      {/* Main word */}
      <View style={styles.wordContainer}>
        <Text style={styles.word}>{displayWord}</Text>

        {/* Example sentence on front (Japanese only, no translation) */}
        {card.exampleSentence && (
          <Text style={styles.frontSentence}>{card.exampleSentence}</Text>
        )}

        {/* Tap to reveal hint */}
        <Text style={styles.tapHint}>Tap to reveal</Text>
      </View>
    </>
  );

  // Back content (revealed)
  const backContent = (
    <>
      {/* Stage indicator */}
      <View style={styles.stageContainer}>
        <StageIndicator stage={card.stage} size="small" />
      </View>

      {/* Main word with reading */}
      <View style={styles.backWordContainer}>
        <Text style={styles.backWord}>{displayWord}</Text>
        {showReadingSeparately && <Text style={styles.reading}>{card.reading}</Text>}
      </View>

      {/* Answer section (revealed) */}
      <Animated.View style={[styles.answerContainer, { opacity: fadeAnim }]}>
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

        {/* Example sentence with translation */}
        {card.exampleSentence && (
          <>
            <View style={styles.divider} />
            <View style={styles.sentenceContainer}>
              <Text style={styles.sentence}>{card.exampleSentence}</Text>
              {card.translatedSentence && (
                <Text style={styles.translatedSentence}>{card.translatedSentence}</Text>
              )}
            </View>
          </>
        )}

        {/* Context image */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          </View>
        )}
      </Animated.View>
    </>
  );

  // If not revealed, single pressable to reveal
  if (!isRevealed) {
    return (
      <Pressable onPress={onReveal}>
        <GlassView style={styles.card} glassEffectStyle="regular">
          {frontContent}
        </GlassView>
      </Pressable>
    );
  }

  // When revealed, split into left (wrong) and right (correct) halves
  return (
    <View style={styles.splitContainer}>
      <Pressable onPress={onWrong} style={styles.leftHalf}>
        <GlassView style={styles.card} glassEffectStyle="regular">
          {backContent}
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
    zIndex: 1,
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
  frontSentence: {
    fontSize: 18,
    color: PlatformColor('secondaryLabel'),
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 8,
    lineHeight: 26,
  },
  tapHint: {
    fontSize: 14,
    color: PlatformColor('tertiaryLabel'),
    marginTop: 20,
  },
  backWordContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  backWord: {
    fontSize: 40,
    fontWeight: '600',
    color: PlatformColor('label'),
    textAlign: 'center',
  },
  reading: {
    fontSize: 22,
    color: PlatformColor('secondaryLabel'),
    textAlign: 'center',
    marginTop: 4,
  },
  answerContainer: {
    paddingTop: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: PlatformColor('separator'),
    marginVertical: 16,
  },
  definitionsContainer: {
    gap: 6,
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
  sentenceContainer: {
    gap: 8,
  },
  sentence: {
    fontSize: 16,
    color: PlatformColor('label'),
    lineHeight: 24,
  },
  translatedSentence: {
    fontSize: 14,
    color: PlatformColor('secondaryLabel'),
    lineHeight: 20,
    fontStyle: 'italic',
  },
  imageContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 12,
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
