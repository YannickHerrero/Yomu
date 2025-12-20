import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as SQLite from 'expo-sqlite';

const BACKGROUND_FETCH_TASK = 'background-badge-update';
const SRS_NEW_STAGE = 0;
const SRS_BURNED_STAGE = 9;

/**
 * Update the app badge with the current due card count.
 * This function can be called from foreground or background.
 * 
 * Note: deck_cards table is in the main yomu.db, no need to attach dictionary.
 */
export async function updateBadgeCount(): Promise<number> {
  try {
    // Open/get the app database connection
    // expo-sqlite reuses existing connections, so this is safe to call multiple times
    const appDb = await SQLite.openDatabaseAsync('yomu.db');

    // Query due card count (excludes new cards - stage 0)
    const now = new Date().toISOString();
    const result = await appDb.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM deck_cards WHERE stage > ? AND stage < ? AND due_date <= ?`,
      [SRS_NEW_STAGE, SRS_BURNED_STAGE, now]
    );

    const dueCount = result?.count ?? 0;

    // Set the badge count
    await Notifications.setBadgeCountAsync(dueCount);

    console.log(`[BackgroundBadge] Updated badge count to ${dueCount}`);
    return dueCount;
  } catch (error) {
    console.error('[BackgroundBadge] Failed to update badge:', error);
    return 0;
  }
}

/**
 * Define the background task.
 * This must be called at the top level of the app (outside any component).
 */
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    await updateBadgeCount();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[BackgroundBadge] Background task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background fetch task.
 * Should be called once when the app starts.
 */
export async function registerBackgroundFetch(): Promise<void> {
  try {
    // Check if already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      console.log('[BackgroundBadge] Task already registered');
      return;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (iOS minimum)
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('[BackgroundBadge] Background fetch registered');
  } catch (error) {
    console.error('[BackgroundBadge] Failed to register background fetch:', error);
  }
}

/**
 * Unregister the background fetch task.
 */
export async function unregisterBackgroundFetch(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log('[BackgroundBadge] Background fetch unregistered');
    }
  } catch (error) {
    console.error('[BackgroundBadge] Failed to unregister background fetch:', error);
  }
}

/**
 * Request notification permissions (required for badge on iOS).
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
