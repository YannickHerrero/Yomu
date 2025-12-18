import { View, Text, StyleSheet, PlatformColor, ScrollView } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import type { ForecastData } from '@/database/stats';

type ForecastChartProps = {
  data: ForecastData[];
};

export function ForecastChart({ data }: ForecastChartProps) {
  // Fill in missing days and limit to 30 days
  const today = new Date();
  const filledData: { date: string; count: number; dayLabel: string }[] = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];

    const existingData = data.find((d) => d.date === dateString);
    const count = existingData?.count ?? 0;

    // Format day label (e.g., "Dec 18")
    const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    filledData.push({ date: dateString, count, dayLabel });
  }

  const maxCount = Math.max(...filledData.map((d) => d.count), 1);

  return (
    <GlassView style={styles.container} glassEffectStyle="regular">
      <View style={styles.content}>
        <Text style={styles.title}>Upcoming Reviews (30 Days)</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartContainer}
        >
          {filledData.map((item, index) => {
            const height = maxCount > 0 ? (item.count / maxCount) * 120 : 0;
            const showLabel = index % 7 === 0; // Show label every 7 days (weekly)

            return (
              <View key={item.date} style={styles.barColumn}>
                <View style={styles.barWrapper}>
                  <Text style={styles.countText}>
                    {item.count > 0 ? item.count : ''}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(height, item.count > 0 ? 4 : 0),
                        backgroundColor: PlatformColor('label'),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.dateLabel} numberOfLines={1}>
                  {showLabel ? item.dayLabel : ''}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Total: {filledData.reduce((sum, d) => sum + d.count, 0)} reviews
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
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
    gap: 4,
    width: 32,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 140,
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
    color: PlatformColor('secondaryLabel'),
    marginBottom: 4,
    minHeight: 12,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  dateLabel: {
    fontSize: 10,
    color: PlatformColor('tertiaryLabel'),
    textAlign: 'center',
    width: '100%',
  },
  summary: {
    paddingTop: 12,
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
