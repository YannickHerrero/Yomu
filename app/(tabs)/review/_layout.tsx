import { Stack } from 'expo-router';

export default function ReviewLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Review',
        }}
      />
      <Stack.Screen
        name="session"
        options={{
          title: 'Review Session',
          headerBackTitle: 'Back',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="deck"
        options={{
          title: 'Deck',
        }}
      />
      <Stack.Screen
        name="burned"
        options={{
          title: 'Burned Cards',
        }}
      />
    </Stack>
  );
}
