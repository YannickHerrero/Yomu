import { View, Text, StyleSheet, PlatformColor } from 'react-native';
import { GlassView } from 'expo-glass-effect';

type StatCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
};

export function StatCard({ label, value, subtitle }: StatCardProps) {
  return (
    <GlassView style={styles.card} glassEffectStyle="regular">
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minHeight: 100,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: PlatformColor('label'),
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: PlatformColor('secondaryLabel'),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: PlatformColor('tertiaryLabel'),
    marginTop: 2,
    textAlign: 'center',
  },
});
