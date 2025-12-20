import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Camera } from 'expo-camera';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { DatabaseProvider, useDatabase } from '@/contexts/DatabaseContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import {
  registerBackgroundFetch,
  requestNotificationPermissions,
  updateBadgeCount,
} from '@/utils/backgroundBadgeTask';
import '@/global.css';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isLoading, loadingMessage, error, retry } = useDatabase();

  // Hide splash screen once we're ready to show our custom loading UI
  const onLayoutReady = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  // Initialize permissions and badge system ONLY after database is ready
  useEffect(() => {
    if (isLoading || error) return;

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
  }, [isLoading, error]);

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

  // Show loading screen while database is initializing
  if (isLoading || error) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <LoadingScreen
          message={loadingMessage}
          error={error}
          onRetry={retry}
          onLayout={onLayoutReady}
        />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GluestackUIProvider mode={colorScheme ?? 'dark'}>
      <DatabaseProvider>
        <RootLayoutContent />
      </DatabaseProvider>
    </GluestackUIProvider>
  );
}
