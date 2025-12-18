import { View, Text, StyleSheet, PlatformColor } from 'react-native';
import { GlassView } from 'expo-glass-effect';

type StreakDisplayProps = {
  currentStreak: number;
  bestStreak: number;
};

export function StreakDisplay({ currentStreak, bestStreak }: StreakDisplayProps) {
  return (
    <GlassView style={styles.container} glassEffectStyle="regular">
      <View style={styles.content}>
        <View style={styles.streakSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>◆</Text>
          </View>
          <View style={styles.streakText}>
            <Text style={styles.streakValue}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.bestSection}>
          <Text style={styles.bestLabel}>Best Streak</Text>
          <Text style={styles.bestValue}>{bestStreak} days</Text>
        </View>
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
  },
  content: {
    gap: 16,
  },
  streakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
    color: PlatformColor('label'),
  },
  streakText: {
    flex: 1,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: '700',
    color: PlatformColor('label'),
  },
  streakLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: PlatformColor('secondaryLabel'),
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: PlatformColor('separator'),
    marginVertical: 4,
  },
  bestSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bestLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: PlatformColor('secondaryLabel'),
  },
  bestValue: {
    fontSize: 16,
    fontWeight: '600',
    color: PlatformColor('label'),
  },
});
