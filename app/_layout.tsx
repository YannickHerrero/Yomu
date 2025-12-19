import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Camera } from 'expo-camera';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import {
  registerBackgroundFetch,
  requestNotificationPermissions,
  updateBadgeCount,
} from '@/utils/backgroundBadgeTask';
import '@/global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Initialize permissions and badge system on mount
  useEffect(() => {
    async function initPermissions() {
      // Request notification permissions (required for badge)
      await requestNotificationPermissions();

      // Request camera permissions
      await Camera.requestCameraPermissionsAsync();

      // Register background fetch task
      await registerBackgroundFetch();

      // Update badge immediately
      await updateBadgeCount();
    }

    initPermissions();
  }, []);

  // Update badge when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        updateBadgeCount();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GluestackUIProvider mode={colorScheme ?? 'dark'}>
      <DatabaseProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </DatabaseProvider>
    </GluestackUIProvider>
  );
}
