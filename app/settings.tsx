import { Stack } from 'expo-router';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Center } from '@/components/ui/center';

export default function SettingsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Settings', presentation: 'modal' }} />
      <Box className="flex-1 bg-background-0">
        <Center className="flex-1">
          <Text className="text-typography-500">Settings</Text>
        </Center>
      </Box>
    </>
  );
}
