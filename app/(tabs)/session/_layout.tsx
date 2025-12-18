import { Stack } from 'expo-router';

export default function SessionLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Session',
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
