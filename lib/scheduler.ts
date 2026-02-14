import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// ---------------------------------------------------------------------------
// Task name
// ---------------------------------------------------------------------------

const UPLOAD_TASK_NAME = 'SIGNAL_BACKUP_UPLOAD';

// ---------------------------------------------------------------------------
// Register / unregister
// ---------------------------------------------------------------------------

export async function registerBackgroundTask(): Promise<void> {
  try {
    await BackgroundFetch.registerTaskAsync(UPLOAD_TASK_NAME, {
      minimumInterval: 60 * 60, // 1 hour minimum (OS controls actual timing)
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (e) {
    console.warn('Failed to register background task:', e);
  }
}

export async function unregisterBackgroundTask(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(UPLOAD_TASK_NAME);
  } catch {
    // Task may not be registered -- safe to ignore
  }
}

// ---------------------------------------------------------------------------
// Task definition (must be called at module scope before registration)
// ---------------------------------------------------------------------------

export function defineBackgroundTask(handler: () => Promise<void>): void {
  TaskManager.defineTask(UPLOAD_TASK_NAME, async () => {
    try {
      await handler();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

// ---------------------------------------------------------------------------
// Status check
// ---------------------------------------------------------------------------

export async function getBackgroundTaskStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
  return BackgroundFetch.getStatusAsync();
}
