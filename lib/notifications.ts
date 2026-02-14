import * as Notifications from 'expo-notifications';

// ---------------------------------------------------------------------------
// Default notification handler
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const UPLOAD_NOTIFICATION_ID = 'upload-progress';

// ---------------------------------------------------------------------------
// Permission
// ---------------------------------------------------------------------------

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ---------------------------------------------------------------------------
// Upload progress notification
// ---------------------------------------------------------------------------

export async function showUploadProgress(
  percent: number,
  bytesText: string,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: UPLOAD_NOTIFICATION_ID,
    content: {
      title: 'Uploading Signal backup...',
      body: `${percent}% - ${bytesText}`,
      data: { type: 'upload-progress' },
    },
    trigger: null, // Show immediately
  });
}

// ---------------------------------------------------------------------------
// Upload complete notification
// ---------------------------------------------------------------------------

export async function showUploadComplete(fileName: string): Promise<void> {
  await Notifications.dismissNotificationAsync(UPLOAD_NOTIFICATION_ID);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Backup complete',
      body: `${fileName} uploaded successfully`,
      data: { type: 'upload-complete' },
    },
    trigger: null,
  });
}

// ---------------------------------------------------------------------------
// Upload failure notification
// ---------------------------------------------------------------------------

export async function showUploadFailed(error: string): Promise<void> {
  await Notifications.dismissNotificationAsync(UPLOAD_NOTIFICATION_ID);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Backup failed',
      body: error,
      data: { type: 'upload-failed' },
    },
    trigger: null,
  });
}

// ---------------------------------------------------------------------------
// Dismiss upload notification
// ---------------------------------------------------------------------------

export async function dismissUploadNotification(): Promise<void> {
  await Notifications.dismissNotificationAsync(UPLOAD_NOTIFICATION_ID);
}
