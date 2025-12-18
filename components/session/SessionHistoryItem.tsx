import { View, Text, StyleSheet, PlatformColor } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import type { ReadingSession } from '@/database/sessions';

type SessionHistoryItemProps = {
  session: ReadingSession;
};

/**
 * Format duration in readable format (e.g., "1h 23m", "45m", "2h 15m")
 */
function formatDuration(seconds: number | null): string {
  if (!seconds) return '0m';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
}

/**
 * Format date to readable format (e.g., "Today, 14:30" or "Dec 17, 14:30")
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (isToday) {
    return `Today, ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return `${dateStr}, ${timeStr}`;
}

export function SessionHistoryItem({ session }: SessionHistoryItemProps) {
  return (
    <GlassView style={styles.card} glassEffectStyle="regular">
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(session.startedAt)}</Text>
        <Text style={styles.duration}>{formatDuration(session.durationSeconds)}</Text>
      </View>

      {session.cardsAddedCount > 0 && (
        <View style={styles.footer}>
          <Text style={styles.cardsCount}>
            {session.cardsAddedCount} card{session.cardsAddedCount !== 1 ? 's' : ''} added
          </Text>
        </View>
      )}
    </GlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 16,
    fontWeight: '500',
    color: PlatformColor('label'),
  },
  duration: {
    fontSize: 20,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: PlatformColor('label'),
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PlatformColor('separator'),
  },
  cardsCount: {
    fontSize: 14,
    fontWeight: '500',
    color: PlatformColor('secondaryLabel'),
  },
});
