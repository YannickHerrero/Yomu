import { View, Text, StyleSheet, PlatformColor } from 'react-native';
import { GlassView } from 'expo-glass-effect';

type StageDistributionProps = {
  apprentice: number;
  guru: number;
  master: number;
  enlightened: number;
  burned: number;
  totalCards: number;
};

type GroupData = {
  name: string;
  count: number;
  color: string;
  percentage: number;
};

export function StageDistribution({
  apprentice,
  guru,
  master,
  enlightened,
  burned,
  totalCards,
}: StageDistributionProps) {
  const activeCards = totalCards - burned;

  const groups: GroupData[] = [
    {
      name: 'Apprentice',
      count: apprentice,
      color: 'label',
      percentage: activeCards > 0 ? (apprentice / activeCards) * 100 : 0,
    },
    {
      name: 'Guru',
      count: guru,
      color: 'label',
      percentage: activeCards > 0 ? (guru / activeCards) * 100 : 0,
    },
    {
      name: 'Master',
      count: master,
      color: 'label',
      percentage: activeCards > 0 ? (master / activeCards) * 100 : 0,
    },
    {
      name: 'Enlightened',
      count: enlightened,
      color: 'label',
      percentage: activeCards > 0 ? (enlightened / activeCards) * 100 : 0,
    },
  ];

  return (
    <GlassView style={styles.container} glassEffectStyle="regular">
      <View style={styles.content}>
        <Text style={styles.title}>Stage Distribution</Text>

        <View style={styles.groups}>
          {groups.map((group) => (
            <View key={group.name} style={styles.groupRow}>
              <View style={styles.groupInfo}>
                <View
                  style={[
                    styles.colorBadge,
                    { backgroundColor: PlatformColor(group.color as any) },
                  ]}
                />
                <Text style={styles.groupName}>{group.name}</Text>
              </View>

              <View style={styles.barContainer}>
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${group.percentage}%`,
                        backgroundColor: PlatformColor(group.color as any),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.countLabel}>
                  {group.count} ({group.percentage.toFixed(0)}%)
                </Text>
              </View>
            </View>
          ))}

          {burned > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.groupRow}>
                <View style={styles.groupInfo}>
                <View
                  style={[
                    styles.colorBadge,
                    { backgroundColor: PlatformColor('secondaryLabel') },
                  ]}
                />
                  <Text style={styles.groupName}>Burned</Text>
                </View>
                <Text style={styles.burnedCount}>{burned} cards</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {activeCards} active • {totalCards} total
          </Text>
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: PlatformColor('label'),
  },
  groups: {
    gap: 16,
  },
  groupRow: {
    gap: 8,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: PlatformColor('label'),
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: PlatformColor('quaternarySystemFill'),
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  countLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PlatformColor('secondaryLabel'),
    minWidth: 70,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: PlatformColor('separator'),
    marginVertical: 4,
  },
  burnedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: PlatformColor('secondaryLabel'),
  },
  summary: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: PlatformColor('separator'),
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '500',
    color: PlatformColor('tertiaryLabel'),
    textAlign: 'center',
  },
});
