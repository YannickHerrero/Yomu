import { View, StyleSheet, Text, PlatformColor } from 'react-native';
import { GlassView } from 'expo-glass-effect';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <GlassView style={styles.card} glassEffectStyle="regular">
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Coming soon...</Text>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: PlatformColor('systemBackground'),
  },
  card: {
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PlatformColor('label'),
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: PlatformColor('secondaryLabel'),
  },
});
