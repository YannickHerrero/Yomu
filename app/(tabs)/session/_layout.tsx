import { Stack, router } from 'expo-router';
import { Pressable, Text, StyleSheet, PlatformColor } from 'react-native';

function HistoryButton() {
  return (
    <Pressable onPress={() => router.push('/session/history')} style={styles.headerButton}>
      <Text style={styles.headerButtonText}>History</Text>
    </Pressable>
  );
}

export default function SessionLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Session',
          headerRight: () => <HistoryButton />,
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: 'History',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: PlatformColor('label'),
  },
});
