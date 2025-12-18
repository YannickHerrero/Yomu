import React from 'react';
import { View, Text, StyleSheet, PlatformColor, Pressable } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import type { DeckStats as DeckStatsType } from '@/stores/useDeckStore';

type DeckStatsProps = {
  stats: DeckStatsType;
  onPress?: () => void;
};

type DistributionBarProps = {
  label: string;
  count: number;
  total: number;
  color: ReturnType<typeof PlatformColor>;
};

function DistributionBar({ label, count, total, color }: DistributionBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <View style={styles.distributionRow}>
      <View style={styles.distributionLabelContainer}>
        <View style={[styles.distributionDot, { backgroundColor: color }]} />
        <Text style={styles.distributionLabel}>{label}</Text>
      </View>
      <View style={styles.distributionBarContainer}>
        <View
          style={[
            styles.distributionBarFill,
            {
              width: `${percentage}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.distributionCount}>{count}</Text>
    </View>
  );
}

export function DeckStats({ stats, onPress }: DeckStatsProps) {
  const totalActive = stats.activeCards;

  return (
    <View style={styles.container}>
      {/* Due Cards Card */}
      <Pressable onPress={onPress}>
        <GlassView style={styles.dueCard} glassEffectStyle="regular" isInteractive>
          <Text style={styles.dueCount}>{stats.dueNow}</Text>
          <Text style={styles.dueLabel}>cards due</Text>
        </GlassView>
      </Pressable>

      {/* Distribution Card */}
      <GlassView style={styles.distributionCard} glassEffectStyle="regular">
        <Text style={styles.sectionTitle}>Distribution</Text>

        <DistributionBar
          label="Apprentice"
          count={stats.apprentice}
          total={totalActive}
          color={PlatformColor('systemPink')}
        />
        <DistributionBar
          label="Guru"
          count={stats.guru}
          total={totalActive}
          color={PlatformColor('systemPurple')}
        />
        <DistributionBar
          label="Master"
          count={stats.master}
          total={totalActive}
          color={PlatformColor('systemBlue')}
        />
        <DistributionBar
          label="Enlightened"
          count={stats.enlightened}
          total={totalActive}
          color={PlatformColor('systemCyan')}
        />

        <View style={styles.totalsRow}>
          <View style={styles.totalItem}>
            <Text style={styles.totalCount}>{stats.activeCards}</Text>
            <Text style={styles.totalLabel}>Active</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalCount}>{stats.burnedCards}</Text>
            <Text style={styles.totalLabel}>Burned</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalCount}>{stats.totalCards}</Text>
            <Text style={styles.totalLabel}>Total</Text>
          </View>
        </View>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  dueCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  dueCount: {
    fontSize: 64,
    fontWeight: '700',
    color: PlatformColor('label'),
    fontVariant: ['tabular-nums'],
  },
  dueLabel: {
    fontSize: 18,
    color: PlatformColor('secondaryLabel'),
    marginTop: -8,
  },
  distributionCard: {
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: PlatformColor('label'),
    marginBottom: 16,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distributionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  distributionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  distributionLabel: {
    fontSize: 14,
    color: PlatformColor('label'),
  },
  distributionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: PlatformColor('systemGray5'),
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: PlatformColor('secondaryLabel'),
    width: 40,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PlatformColor('separator'),
  },
  totalItem: {
    alignItems: 'center',
  },
  totalCount: {
    fontSize: 24,
    fontWeight: '600',
    color: PlatformColor('label'),
    fontVariant: ['tabular-nums'],
  },
  totalLabel: {
    fontSize: 12,
    color: PlatformColor('secondaryLabel'),
    marginTop: 2,
  },
});
