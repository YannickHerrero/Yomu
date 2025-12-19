import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, PlatformColor, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { Host, Button } from '@expo/ui/swift-ui';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useDeckStore } from '@/stores/useDeckStore';
import { Flashcard } from '@/components/review/Flashcard';
import { ReviewButtons } from '@/components/review/ReviewButtons';

export default function ReviewSessionScreen() {
  const { db } = useDatabase();
  const { session, revealCard, submitAnswer, endSession, loadAllData } = useDeckStore();
  const isNavigatingRef = useRef(false);

  // If no session on initial load (e.g., direct navigation), redirect to review index
  useEffect(() => {
    if (!session && !isNavigatingRef.current) {
      router.replace('/review');
    }
  }, [session]);

  const handleReveal = useCallback(() => {
    revealCard();
  }, [revealCard]);

  const handleWrong = useCallback(async () => {
    if (!db) return;
    await submitAnswer(db, false);
  }, [db, submitAnswer]);

  const handleCorrect = useCallback(async () => {
    if (!db) return;
    await submitAnswer(db, true);
  }, [db, submitAnswer]);

  const handleDone = useCallback(async () => {
    isNavigatingRef.current = true;
    // Refresh data before ending session
    if (db) {
      await loadAllData(db);
    }
    endSession();
    // Use replace to navigate back to review index (avoids GO_BACK issues)
    router.replace('/review');
  }, [endSession, loadAllData, db]);

  // No session state
  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Session complete - show summary
  if (!session.currentCard) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.summaryContainer}
      >
        <GlassView style={styles.summaryCard} glassEffectStyle="regular">
          <Text style={styles.summaryTitle}>Session Complete!</Text>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatValue, styles.correctValue]}>
                {session.results.correct}
              </Text>
              <Text style={styles.summaryStatLabel}>Correct</Text>
            </View>

            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatValue, styles.incorrectValue]}>
                {session.results.incorrect}
              </Text>
              <Text style={styles.summaryStatLabel}>Incorrect</Text>
            </View>

            {session.results.burned > 0 && (
              <View style={styles.summaryStatItem}>
                <Text style={[styles.summaryStatValue, styles.burnedValue]}>
                  {session.results.burned}
                </Text>
                <Text style={styles.summaryStatLabel}>Burned</Text>
              </View>
            )}
          </View>

          {/* Accuracy */}
          {session.results.correct + session.results.incorrect > 0 && (
            <View style={styles.accuracyContainer}>
              <Text style={styles.accuracyLabel}>Accuracy</Text>
              <Text style={styles.accuracyValue}>
                {Math.round(
                  (session.results.correct /
                    (session.results.correct + session.results.incorrect)) *
                    100
                )}
                %
              </Text>
            </View>
          )}

          <View style={styles.doneButtonContainer}>
            <Host matchContents>
              <Button onPress={handleDone}>Done</Button>
            </Host>
          </View>
        </GlassView>
      </ScrollView>
    );
  }

  // Calculate progress
  const totalReviewed = session.results.correct + session.results.incorrect;
  const remaining = session.queue.length + 1; // +1 for current card
  const progress = totalReviewed;

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {progress} reviewed · {remaining} remaining
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(progress / (progress + remaining)) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Flashcard */}
      <View style={styles.cardContainer}>
        <Flashcard
          card={session.currentCard}
          isRevealed={session.isRevealed}
          onReveal={handleReveal}
          onWrong={handleWrong}
          onCorrect={handleCorrect}
        />
      </View>

      {/* Review Buttons */}
      <View style={styles.buttonsContainer}>
        <ReviewButtons
          onWrong={handleWrong}
          onCorrect={handleCorrect}
          disabled={!session.isRevealed}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PlatformColor('systemBackground'),
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
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: PlatformColor('secondaryLabel'),
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: PlatformColor('systemGray5'),
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PlatformColor('systemBlue'),
    borderRadius: 2,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  // Summary styles
  summaryContainer: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  summaryCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: PlatformColor('label'),
    marginBottom: 32,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 24,
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  correctValue: {
    color: PlatformColor('systemGreen'),
  },
  incorrectValue: {
    color: PlatformColor('systemRed'),
  },
  burnedValue: {
    color: PlatformColor('systemOrange'),
  },
  summaryStatLabel: {
    fontSize: 14,
    color: PlatformColor('secondaryLabel'),
    marginTop: 4,
  },
  accuracyContainer: {
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PlatformColor('separator'),
    width: '100%',
    marginBottom: 24,
  },
  accuracyLabel: {
    fontSize: 14,
    color: PlatformColor('secondaryLabel'),
    marginBottom: 4,
  },
  accuracyValue: {
    fontSize: 32,
    fontWeight: '600',
    color: PlatformColor('label'),
  },
  doneButtonContainer: {
    marginTop: 8,
    minWidth: 120,
  },
});
