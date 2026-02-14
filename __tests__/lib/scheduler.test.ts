import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import {
  registerBackgroundTask,
  unregisterBackgroundTask,
  defineBackgroundTask,
  getBackgroundTaskStatus,
} from '@/lib/scheduler';

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// registerBackgroundTask
// ---------------------------------------------------------------------------

describe('registerBackgroundTask', () => {
  it('calls registerTaskAsync with correct task name and options', async () => {
    await registerBackgroundTask();

    expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalledTimes(1);
    expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalledWith(
      'SIGNAL_BACKUP_UPLOAD',
      {
        minimumInterval: 60 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      },
    );
  });

  it('logs a warning when registration fails but does not throw', async () => {
    const error = new Error('Registration failed');
    (BackgroundFetch.registerTaskAsync as jest.Mock).mockRejectedValueOnce(error);

    // console.warn is mocked in jest.setup.js; restore and spy for this test
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(registerBackgroundTask()).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to register background task:',
      error,
    );

    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// unregisterBackgroundTask
// ---------------------------------------------------------------------------

describe('unregisterBackgroundTask', () => {
  it('calls unregisterTaskAsync with the correct task name', async () => {
    await unregisterBackgroundTask();

    expect(BackgroundFetch.unregisterTaskAsync).toHaveBeenCalledTimes(1);
    expect(BackgroundFetch.unregisterTaskAsync).toHaveBeenCalledWith(
      'SIGNAL_BACKUP_UPLOAD',
    );
  });

  it('does not throw when unregister fails', async () => {
    (BackgroundFetch.unregisterTaskAsync as jest.Mock).mockRejectedValueOnce(
      new Error('Not registered'),
    );

    await expect(unregisterBackgroundTask()).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// defineBackgroundTask
// ---------------------------------------------------------------------------

describe('defineBackgroundTask', () => {
  it('calls TaskManager.defineTask with the correct task name', () => {
    const handler = jest.fn().mockResolvedValue(undefined);

    defineBackgroundTask(handler);

    expect(TaskManager.defineTask).toHaveBeenCalledTimes(1);
    expect(TaskManager.defineTask).toHaveBeenCalledWith(
      'SIGNAL_BACKUP_UPLOAD',
      expect.any(Function),
    );
  });

  it('returns NewData when handler succeeds', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);

    defineBackgroundTask(handler);

    // Extract the task executor that was passed to defineTask
    const taskExecutor = (TaskManager.defineTask as jest.Mock).mock.calls[0][1];
    const result = await taskExecutor();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NewData);
  });

  it('returns Failed when handler throws', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('Upload error'));

    defineBackgroundTask(handler);

    const taskExecutor = (TaskManager.defineTask as jest.Mock).mock.calls[0][1];
    const result = await taskExecutor();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(result).toBe(BackgroundFetch.BackgroundFetchResult.Failed);
  });
});

// ---------------------------------------------------------------------------
// getBackgroundTaskStatus
// ---------------------------------------------------------------------------

describe('getBackgroundTaskStatus', () => {
  it('returns the status from BackgroundFetch.getStatusAsync', async () => {
    const status = await getBackgroundTaskStatus();

    // The mock returns 3 (BackgroundFetchStatus.Available)
    expect(status).toBe(BackgroundFetch.BackgroundFetchStatus.Available);
    expect(BackgroundFetch.getStatusAsync).toHaveBeenCalledTimes(1);
  });

  it('returns Denied status when getStatusAsync returns 1', async () => {
    (BackgroundFetch.getStatusAsync as jest.Mock).mockResolvedValueOnce(
      BackgroundFetch.BackgroundFetchStatus.Denied,
    );

    const status = await getBackgroundTaskStatus();

    expect(status).toBe(BackgroundFetch.BackgroundFetchStatus.Denied);
  });
});
