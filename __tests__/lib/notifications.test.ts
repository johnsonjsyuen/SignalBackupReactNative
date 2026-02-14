import * as Notifications from 'expo-notifications';

// ---------------------------------------------------------------------------
// setNotificationHandler is called at module load time. We need to check
// this BEFORE clearAllMocks resets the call counts. By importing the module
// here, the top-level code runs immediately (Jest caches modules, so
// subsequent requires in tests below return the same instance).
// ---------------------------------------------------------------------------

// Capture the calls BEFORE any beforeEach/clearAllMocks can run
const setHandlerMock = Notifications.setNotificationHandler as jest.Mock;

// Force the module to load (triggers the top-level setNotificationHandler call)
const _notifications = require('@/lib/notifications');

// Snapshot the call that happened at module load time
const initialSetHandlerCalls = setHandlerMock.mock.calls.length;
const initialSetHandlerArg = setHandlerMock.mock.calls[0]?.[0];

describe('module initialization', () => {
  it('calls setNotificationHandler when module is loaded', () => {
    expect(initialSetHandlerCalls).toBe(1);
    expect(initialSetHandlerArg).toEqual(
      expect.objectContaining({
        handleNotification: expect.any(Function),
      }),
    );
  });

  it('configures the handler to show alerts but not play sound', async () => {
    const result = await initialSetHandlerArg.handleNotification();

    expect(result).toEqual({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    });
  });
});

// ---------------------------------------------------------------------------
// Import the functions under test
// ---------------------------------------------------------------------------

import {
  requestNotificationPermission,
  showUploadProgress,
  showUploadComplete,
  showUploadFailed,
  dismissUploadNotification,
} from '@/lib/notifications';

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// requestNotificationPermission
// ---------------------------------------------------------------------------

describe('requestNotificationPermission', () => {
  it('returns true immediately when already granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });

    const result = await requestNotificationPermission();

    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('requests permission and returns true when granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });

    const result = await requestNotificationPermission();

    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('requests permission and returns false when denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });

    const result = await requestNotificationPermission();

    expect(result).toBe(false);
  });

  it('requests permission when status is undetermined', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'undetermined',
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });

    const result = await requestNotificationPermission();

    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// showUploadProgress
// ---------------------------------------------------------------------------

describe('showUploadProgress', () => {
  it('schedules notification with correct identifier, title, and body', async () => {
    await showUploadProgress(42, '21 MB / 50 MB');

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'upload-progress',
      content: {
        title: 'Uploading Signal backup...',
        body: '42% - 21 MB / 50 MB',
        data: { type: 'upload-progress' },
      },
      trigger: null,
    });
  });

  it('formats percent and bytes text into the body', async () => {
    await showUploadProgress(100, '1.5 GB / 1.5 GB');

    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.content.body).toBe('100% - 1.5 GB / 1.5 GB');
  });
});

// ---------------------------------------------------------------------------
// showUploadComplete
// ---------------------------------------------------------------------------

describe('showUploadComplete', () => {
  it('dismisses the progress notification first', async () => {
    await showUploadComplete('signal-2024.backup');

    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith(
      'upload-progress',
    );
  });

  it('schedules a completion notification with the file name', async () => {
    await showUploadComplete('signal-2024.backup');

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: 'Backup complete',
        body: 'signal-2024.backup uploaded successfully',
        data: { type: 'upload-complete' },
      },
      trigger: null,
    });
  });

  it('dismisses before scheduling (order check)', async () => {
    await showUploadComplete('test.backup');

    const dismissOrder = (Notifications.dismissNotificationAsync as jest.Mock)
      .mock.invocationCallOrder[0];
    const scheduleOrder = (Notifications.scheduleNotificationAsync as jest.Mock)
      .mock.invocationCallOrder[0];
    expect(dismissOrder).toBeLessThan(scheduleOrder);
  });
});

// ---------------------------------------------------------------------------
// showUploadFailed
// ---------------------------------------------------------------------------

describe('showUploadFailed', () => {
  it('dismisses the progress notification first', async () => {
    await showUploadFailed('Network error');

    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith(
      'upload-progress',
    );
  });

  it('schedules a failure notification with the error message', async () => {
    await showUploadFailed('Network error');

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: 'Backup failed',
        body: 'Network error',
        data: { type: 'upload-failed' },
      },
      trigger: null,
    });
  });

  it('dismisses before scheduling (order check)', async () => {
    await showUploadFailed('Timeout');

    const dismissOrder = (Notifications.dismissNotificationAsync as jest.Mock)
      .mock.invocationCallOrder[0];
    const scheduleOrder = (Notifications.scheduleNotificationAsync as jest.Mock)
      .mock.invocationCallOrder[0];
    expect(dismissOrder).toBeLessThan(scheduleOrder);
  });
});

// ---------------------------------------------------------------------------
// dismissUploadNotification
// ---------------------------------------------------------------------------

describe('dismissUploadNotification', () => {
  it('dismisses with the upload-progress identifier', async () => {
    await dismissUploadNotification();

    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith(
      'upload-progress',
    );
  });
});
