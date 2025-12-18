import { View, StyleSheet, PlatformColor } from 'react-native';
import { Stopwatch } from '@/components/session/Stopwatch';

export default function SessionScreen() {
  return (
    <View style={styles.container}>
      <Stopwatch />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PlatformColor('systemBackground'),
  },
});
