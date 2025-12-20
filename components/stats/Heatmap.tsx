import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, PlatformColor, Pressable, ScrollView } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import type { HeatmapData } from '@/database/stats';

type HeatmapProps = {
  data: HeatmapData[];
};

type CellData = {
  date: string;
  count: number;
  month?: string;
};

export function Heatmap({ data }: HeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<CellData | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to the right (current week) on mount
  useEffect(() => {
    // Small delay to ensure layout is complete
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Generate 52 weeks ending at today (like GitHub)
  const today = new Date();
  const endDate = new Date(today);
  
  // Calculate start date: 52 weeks ago, aligned to Sunday
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (52 * 7) - today.getDay());

  // Determine year label (show range if spanning two years)
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const yearLabel = startYear === endYear ? `${endYear}` : `${startYear}-${endYear}`;

  // Build a map of dates to counts
  const dataMap = new Map(data.map((d) => [d.date, d.count]));

  // Generate grid: 52 weeks × 7 days
  const weeks: CellData[][] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const week: CellData[] = [];
    for (let day = 0; day < 7; day++) {
      const dateString = currentDate.toISOString().split('T')[0];
      const count = dataMap.get(dateString) ?? 0;

      if (currentDate <= endDate) {
        week.push({
          date: dateString,
          count,
          month:
            currentDate.getDate() === 1
              ? currentDate.toLocaleDateString('en-US', { month: 'short' })
              : undefined,
        });
      } else {
        week.push({ date: '', count: -1 }); // Empty cell (future dates)
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);
  }

  const getColor = (count: number): string => {
    if (count === -1) return 'transparent'; // Empty cell
    if (count === 0) return 'quaternarySystemFill';
    return 'label';
  };

  const getOpacity = (count: number): number => {
    if (count === -1 || count === 0) return 1;
    if (count <= 5) return 0.3;
    if (count <= 15) return 0.6;
    return 1;
  };

  return (
    <GlassView style={styles.container} glassEffectStyle="regular">
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Study Days</Text>
          <Text style={styles.yearLabel}>{yearLabel}</Text>
        </View>

        <View style={styles.gridContainer}>
          {/* Day labels - fixed on the left */}
          <View style={styles.dayLabelsColumn}>
            {/* Spacer for month row alignment */}
            <View style={styles.dayLabelSpacer} />
            <View style={styles.dayLabels}>
              <Text style={styles.dayLabel}>S</Text>
              <Text style={styles.dayLabel}>M</Text>
              <Text style={styles.dayLabel}>T</Text>
              <Text style={styles.dayLabel}>W</Text>
              <Text style={styles.dayLabel}>T</Text>
              <Text style={styles.dayLabel}>F</Text>
              <Text style={styles.dayLabel}>S</Text>
            </View>
          </View>

          {/* Scrollable heatmap */}
          <ScrollView ref={scrollViewRef} horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.grid}>
              {/* Month labels row */}
              <View style={styles.monthRow}>
                {weeks.map((week, weekIndex) => {
                  const monthLabel = week.find((cell) => cell.month)?.month;
                  return (
                    <View key={weekIndex} style={styles.monthLabelContainer}>
                      {monthLabel && <Text style={styles.monthLabel}>{monthLabel}</Text>}
                    </View>
                  );
                })}
              </View>

              {/* Heatmap grid */}
              <View style={styles.heatmapGrid}>
                {weeks.map((week, weekIndex) => (
                  <View key={weekIndex} style={styles.weekColumn}>
                    {week.map((cell, dayIndex) => (
                      <Pressable
                        key={`${weekIndex}-${dayIndex}`}
                        onPress={() =>
                          cell.count >= 0 ? setSelectedCell(cell) : null
                        }
                        disabled={cell.count === -1}
                      >
                        <View
                          style={[
                            styles.cell,
                            {
                              backgroundColor: PlatformColor(getColor(cell.count) as any),
                              opacity: getOpacity(cell.count),
                            },
                          ]}
                        />
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendLabel}>Less</Text>
          {[0, 1, 6, 16].map((threshold, index) => (
            <View
              key={index}
              style={[
                styles.legendCell,
                {
                  backgroundColor: PlatformColor(getColor(threshold) as any),
                  opacity: getOpacity(threshold),
                },
              ]}
            />
          ))}
          <Text style={styles.legendLabel}>More</Text>
        </View>

        {/* Selected cell details */}
        {selectedCell && selectedCell.count >= 0 && (
          <View style={styles.detailBox}>
            <Text style={styles.detailText}>
              {new Date(selectedCell.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              : <Text style={styles.detailCount}>{selectedCell.count} reviews</Text>
            </Text>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: PlatformColor('label'),
  },
  yearLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: PlatformColor('secondaryLabel'),
  },
  gridContainer: {
    flexDirection: 'row',
  },
  dayLabelsColumn: {
    marginRight: 8,
  },
  dayLabelSpacer: {
    height: 18, // Match month row height (14) + marginBottom (4)
  },
  grid: {
    gap: 4,
  },
  dayLabels: {
    gap: 3,
  },
  dayLabel: {
    fontSize: 10,
    color: PlatformColor('tertiaryLabel'),
    height: 12,
    textAlign: 'center',
  },
  monthRow: {
    flexDirection: 'row',
    height: 14,
    marginBottom: 4,
  },
  monthLabelContainer: {
    width: 12,
    marginHorizontal: 1,
  },
  monthLabel: {
    fontSize: 9,
    color: PlatformColor('tertiaryLabel'),
    fontWeight: '500',
  },
  heatmapGrid: {
    flexDirection: 'row',
    gap: 3,
  },
  weekColumn: {
    gap: 3,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
  },
  legendLabel: {
    fontSize: 11,
    color: PlatformColor('tertiaryLabel'),
    marginHorizontal: 4,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  detailBox: {
    padding: 12,
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: 8,
    marginTop: 8,
  },
  detailText: {
    fontSize: 13,
    color: PlatformColor('secondaryLabel'),
    textAlign: 'center',
  },
  detailCount: {
    fontWeight: '700',
    color: PlatformColor('label'),
  },
});
