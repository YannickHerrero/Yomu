import { useState } from 'react';
import { View, Text, StyleSheet, PlatformColor } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Host, Picker } from '@expo/ui/swift-ui';

type PerformanceCardProps = {
  successRateAllTime: number;
  successRate7Days: number;
  successRate30Days: number;
};

type TimeRange = 'all' | '7d' | '30d';

export function PerformanceCard({
  successRateAllTime,
  successRate7Days,
  successRate30Days,
}: PerformanceCardProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('all');

  const successRate =
    selectedRange === 'all'
      ? successRateAllTime
      : selectedRange === '7d'
      ? successRate7Days
      : successRate30Days;

  return (
    <GlassView style={styles.container} glassEffectStyle="regular">
      <View style={styles.content}>
        <Text style={styles.title}>Success Rate</Text>

        <View style={styles.gaugeContainer}>
          <View style={styles.circularGauge}>
            <Text style={styles.percentage}>
              {successRate.toFixed(1)}%
            </Text>
            <View
              style={[
                styles.progressRing,
                {
                  borderColor: PlatformColor('label'),
                  transform: [{ rotate: `${(successRate / 100) * 360}deg` }],
                },
              ]}
            />
          </View>
        </View>

        <Host matchContents style={styles.pickerContainer}>
          <Picker
            variant="segmented"
            options={['All Time', '7 Days', '30 Days']}
            selectedIndex={selectedRange === 'all' ? 0 : selectedRange === '7d' ? 1 : 2}
            onOptionSelected={(event) => {
              const index = event.nativeEvent.index;
              setSelectedRange(index === 0 ? 'all' : index === 1 ? '7d' : '30d');
            }}
          />
        </Host>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>All Time</Text>
            <Text style={styles.detailValue}>{successRateAllTime.toFixed(1)}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last 7 Days</Text>
            <Text style={styles.detailValue}>{successRate7Days.toFixed(1)}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last 30 Days</Text>
            <Text style={styles.detailValue}>{successRate30Days.toFixed(1)}%</Text>
          </View>
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
    gap: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: PlatformColor('label'),
    textAlign: 'center',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  circularGauge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
    borderColor: PlatformColor('quaternarySystemFill'),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  percentage: {
    fontSize: 42,
    fontWeight: '700',
    color: PlatformColor('label'),
  },
  progressRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
    borderColor: 'transparent',
  },
  pickerContainer: {
    width: '100%',
  },
  details: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: PlatformColor('secondaryLabel'),
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: PlatformColor('label'),
  },
});
