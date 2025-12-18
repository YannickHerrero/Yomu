import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, PlatformColor, AppState, type AppStateStatus, Platform, Pressable } from 'react-native';
// import { Host, Button } from '@expo/ui/swift-ui';
import { GlassView } from 'expo-glass-effect';
import { useSessionStore } from '@/stores/useSessionStore';
import { useDatabase } from '@/contexts/DatabaseContext';
import { startSession, endSession } from '@/database/sessions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startActivity, updateActivity, stopActivity } from 'expo-live-activity';

const STORAGE_KEY = '@yomu:active_session';

type SessionData = {
  sessionId: number;
  startTime: number;
  elapsedTime: number;
  cardsAddedCount: number;
};

/**
 * Format elapsed time in HH:MM:SS format
 */
function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((n) => n.toString().padStart(2, '0'))
    .join(':');
}

export function Stopwatch() {
  const { db } = useDatabase();
  const {
    isRunning,
    startTime,
    elapsedTime,
    currentSessionId,
    cardsAddedCount,
    startTimer,
    pauseTimer,
    stopTimer,
    setElapsedTime,
    setCurrentSessionId,
    setCardsAddedCount,
  } = useSessionStore();

  const [displayTime, setDisplayTime] = useState(elapsedTime);
  const liveActivityId = useRef<string | null>(null);

  // Update display time when running
  useEffect(() => {
    if (!isRunning || !startTime) {
      setDisplayTime(elapsedTime);
      return;
    }

    const interval = setInterval(() => {
      const newElapsed = Date.now() - startTime;
      setElapsedTime(newElapsed);
      setDisplayTime(newElapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, startTime, elapsedTime, setElapsedTime]);

  // Update Live Activity (iOS only)
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (!isRunning || !liveActivityId.current) return;

    const updateLiveActivityState = async () => {
      if (!liveActivityId.current) return;

      try {
        await updateActivity(liveActivityId.current, {
          title: formatTime(displayTime),
          subtitle: `${cardsAddedCount} card${cardsAddedCount !== 1 ? 's' : ''} added`,
        });
      } catch (error) {
        console.error('Failed to update Live Activity:', error);
      }
    };

    // Update immediately and then every second
    updateLiveActivityState();
    const interval = setInterval(updateLiveActivityState, 1000);
    return () => clearInterval(interval);
  }, [isRunning, displayTime, cardsAddedCount]);

  // Persist session state when app backgrounds
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && currentSessionId) {
        // Save current session state
        const sessionData: SessionData = {
          sessionId: currentSessionId,
          startTime: startTime ?? Date.now(),
          elapsedTime,
          cardsAddedCount,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      } else if (nextAppState === 'active') {
        // Restore session state if exists
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && !currentSessionId) {
          const sessionData: SessionData = JSON.parse(stored);
          setCurrentSessionId(sessionData.sessionId);
          setCardsAddedCount(sessionData.cardsAddedCount);
          
          // Calculate elapsed time including time spent in background
          const elapsed = Date.now() - sessionData.startTime;
          setElapsedTime(elapsed);
          
          // Resume timer
          startTimer();
        }
      }
    });

    return () => subscription.remove();
  }, [currentSessionId, startTime, elapsedTime, cardsAddedCount, setCurrentSessionId, setCardsAddedCount, setElapsedTime, startTimer]);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored && !currentSessionId) {
        const sessionData: SessionData = JSON.parse(stored);
        setCurrentSessionId(sessionData.sessionId);
        setCardsAddedCount(sessionData.cardsAddedCount);
        
        // Calculate elapsed time including time spent while app was closed
        const elapsed = Date.now() - sessionData.startTime;
        setElapsedTime(elapsed);
      }
    };

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartPause = useCallback(async () => {
    console.log('handleStartPause called', { db: !!db, isRunning, currentSessionId });
    
    if (!db) {
      console.log('No database, returning');
      return;
    }
    
    if (isRunning) {
      // Pause
      console.log('Pausing timer');
      pauseTimer();
    } else if (currentSessionId) {
      // Resume
      console.log('Resuming timer');
      startTimer();
    } else {
      // Start new session
      console.log('Starting new session');
      try {
        const sessionId = await startSession(db);
        console.log('Session started with ID:', sessionId);
        setCurrentSessionId(sessionId);
        setCardsAddedCount(0);
        startTimer();

        // Start Live Activity (iOS only)
        if (Platform.OS === 'ios') {
          try {
            const activityId = startActivity({
              title: '00:00:00',
              subtitle: '0 cards added',
            });
            console.log('Live Activity started with ID:', activityId);
            if (activityId) {
              liveActivityId.current = activityId;
            }
          } catch (error) {
            console.error('Failed to start Live Activity:', error);
          }
        }
      } catch (error) {
        console.error('Failed to start session:', error);
      }
    }
  }, [isRunning, currentSessionId, db, startTimer, pauseTimer, setCurrentSessionId, setCardsAddedCount]);

  const handleStop = useCallback(async () => {
    if (!db || !currentSessionId) return;

    try {
      const durationSeconds = Math.floor(elapsedTime / 1000);
      await endSession(db, currentSessionId, durationSeconds, cardsAddedCount);
      
      // Stop Live Activity (iOS only)
      if (Platform.OS === 'ios' && liveActivityId.current) {
        try {
          await stopActivity(liveActivityId.current, {
            title: formatTime(elapsedTime),
            subtitle: `Session ended • ${cardsAddedCount} card${cardsAddedCount !== 1 ? 's' : ''} added`,
          });
          liveActivityId.current = null;
        } catch (error) {
          console.error('Failed to stop Live Activity:', error);
        }
      }
      
      // Clear persisted session
      await AsyncStorage.removeItem(STORAGE_KEY);
      
      // Reset state
      stopTimer();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [currentSessionId, elapsedTime, cardsAddedCount, db, stopTimer]);

  // Early return after all hooks
  if (!db) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading database...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Timer Display Card */}
      <GlassView style={styles.timerCard} glassEffectStyle="regular">
        <Text style={styles.timer} adjustsFontSizeToFit numberOfLines={1}>
          {formatTime(displayTime)}
        </Text>
        <Text style={styles.cardsLabel}>
          {cardsAddedCount} card{cardsAddedCount !== 1 ? 's' : ''} added
        </Text>
      </GlassView>

      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable onPress={handleStartPause}>
          <GlassView style={styles.button} isInteractive>
            <Text style={styles.buttonText}>
              {isRunning ? 'Pause' : currentSessionId ? 'Resume' : 'Start'}
            </Text>
          </GlassView>
        </Pressable>

        {elapsedTime > 0 && (
          <Pressable onPress={handleStop}>
            <GlassView style={styles.button} isInteractive>
              <Text style={styles.buttonText}>Stop</Text>
            </GlassView>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 48,
  },
  loadingText: {
    fontSize: 16,
    color: PlatformColor('secondaryLabel'),
  },
  timerCard: {
    width: '100%',
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    fontSize: 56,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: 4,
    color: PlatformColor('label'),
  },
  cardsLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: PlatformColor('secondaryLabel'),
    marginTop: 16,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: PlatformColor('label'),
  },
});
