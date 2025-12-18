import { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, PlatformColor } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useSessionStore } from '@/stores/useSessionStore';
import { getAllSessions } from '@/database/sessions';
import { SessionHistoryItem } from '@/components/session/SessionHistoryItem';

/**
 * Format duration in readable format
 */
function formatTotalDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export default function SessionHistoryScreen() {
  const { db } = useDatabase();
  const { sessions, isLoading, setSessions, setIsLoading } = useSessionStore();

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHistory = async () => {
    if (!db) return;
    
    setIsLoading(true);
    try {
      const allSessions = await getAllSessions(db);
      setSessions(allSessions);
    } catch (error) {
      console.error('Failed to load session history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total cards added across all sessions
  const totalCardsAdded = sessions.reduce(
    (sum, session) => sum + session.cardsAddedCount,
    0
  );

  // Calculate total duration
  const totalDuration = sessions.reduce(
    (sum, session) => sum + (session.durationSeconds ?? 0),
    0
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No reading sessions yet</Text>
          <Text style={styles.emptySubtext}>
            Start a session to track your reading time
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <SessionHistoryItem session={item} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <GlassView style={styles.summaryCard} glassEffectStyle="regular">
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{sessions.length}</Text>
                <Text style={styles.summaryLabel}>Sessions</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {formatTotalDuration(totalDuration)}
                </Text>
                <Text style={styles.summaryLabel}>Total Time</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{totalCardsAdded}</Text>
                <Text style={styles.summaryLabel}>Cards Added</Text>
              </View>
            </View>
          </GlassView>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: PlatformColor('secondaryLabel'),
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: PlatformColor('label'),
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: PlatformColor('secondaryLabel'),
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 16,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: PlatformColor('label'),
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: PlatformColor('secondaryLabel'),
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: PlatformColor('separator'),
  },
});

