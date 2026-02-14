import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '@/constants/storage-keys';
import { Settings, DEFAULT_SETTINGS, ThemeMode } from '@/types/settings';
import { ResumableUploadSession } from '@/types/drive';

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getSettings(): Promise<Settings> {
  const keys = [
    StorageKeys.LOCAL_FOLDER_URI,
    StorageKeys.DRIVE_FOLDER_ID,
    StorageKeys.DRIVE_FOLDER_NAME,
    StorageKeys.SCHEDULE_HOUR,
    StorageKeys.SCHEDULE_MINUTE,
    StorageKeys.GOOGLE_ACCOUNT_EMAIL,
    StorageKeys.THEME_MODE,
    StorageKeys.WIFI_ONLY,
  ];

  const pairs = await AsyncStorage.multiGet(keys);
  const map = new Map(pairs);

  const parseNumber = (raw: string | null | undefined, fallback: number): number => {
    if (raw == null) return fallback;
    const n = Number(raw);
    return Number.isNaN(n) ? fallback : n;
  };

  const parseBoolean = (raw: string | null | undefined, fallback: boolean): boolean => {
    if (raw == null) return fallback;
    return raw === 'true';
  };

  return {
    localFolderUri: map.get(StorageKeys.LOCAL_FOLDER_URI) ?? DEFAULT_SETTINGS.localFolderUri,
    driveFolderId: map.get(StorageKeys.DRIVE_FOLDER_ID) ?? DEFAULT_SETTINGS.driveFolderId,
    driveFolderName: map.get(StorageKeys.DRIVE_FOLDER_NAME) ?? DEFAULT_SETTINGS.driveFolderName,
    scheduleHour: parseNumber(map.get(StorageKeys.SCHEDULE_HOUR), DEFAULT_SETTINGS.scheduleHour),
    scheduleMinute: parseNumber(
      map.get(StorageKeys.SCHEDULE_MINUTE),
      DEFAULT_SETTINGS.scheduleMinute,
    ),
    googleAccountEmail:
      map.get(StorageKeys.GOOGLE_ACCOUNT_EMAIL) ?? DEFAULT_SETTINGS.googleAccountEmail,
    themeMode: (map.get(StorageKeys.THEME_MODE) as ThemeMode) ?? DEFAULT_SETTINGS.themeMode,
    wifiOnly: parseBoolean(map.get(StorageKeys.WIFI_ONLY), DEFAULT_SETTINGS.wifiOnly),
  };
}

export async function setSetting(
  key: string,
  value: string | number | boolean | null,
): Promise<void> {
  if (value === null) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, String(value));
}

// ---------------------------------------------------------------------------
// Resumable upload session
// ---------------------------------------------------------------------------

const RESUME_KEYS = [
  StorageKeys.RESUME_SESSION_URI,
  StorageKeys.RESUME_LOCAL_FILE_URI,
  StorageKeys.RESUME_FILE_NAME,
  StorageKeys.RESUME_BYTES_UPLOADED,
  StorageKeys.RESUME_TOTAL_BYTES,
  StorageKeys.RESUME_DRIVE_FOLDER_ID,
  StorageKeys.RESUME_CREATED_AT,
  StorageKeys.RESUME_DRIVE_FILE_ID,
] as const;

export async function getResumeSession(): Promise<ResumableUploadSession | null> {
  const pairs = await AsyncStorage.multiGet([...RESUME_KEYS]);
  const map = new Map(pairs);

  const sessionUri = map.get(StorageKeys.RESUME_SESSION_URI);
  if (!sessionUri) return null;

  return {
    sessionUri,
    localFileUri: map.get(StorageKeys.RESUME_LOCAL_FILE_URI) ?? '',
    fileName: map.get(StorageKeys.RESUME_FILE_NAME) ?? '',
    bytesUploaded: Number(map.get(StorageKeys.RESUME_BYTES_UPLOADED) ?? 0),
    totalBytes: Number(map.get(StorageKeys.RESUME_TOTAL_BYTES) ?? 0),
    driveFolderId: map.get(StorageKeys.RESUME_DRIVE_FOLDER_ID) ?? '',
    createdAtMillis: Number(map.get(StorageKeys.RESUME_CREATED_AT) ?? 0),
    driveFileId: map.get(StorageKeys.RESUME_DRIVE_FILE_ID) ?? null,
  };
}

export async function saveResumeSession(session: ResumableUploadSession): Promise<void> {
  await AsyncStorage.multiSet([
    [StorageKeys.RESUME_SESSION_URI, session.sessionUri],
    [StorageKeys.RESUME_LOCAL_FILE_URI, session.localFileUri],
    [StorageKeys.RESUME_FILE_NAME, session.fileName],
    [StorageKeys.RESUME_BYTES_UPLOADED, String(session.bytesUploaded)],
    [StorageKeys.RESUME_TOTAL_BYTES, String(session.totalBytes)],
    [StorageKeys.RESUME_DRIVE_FOLDER_ID, session.driveFolderId],
    [StorageKeys.RESUME_CREATED_AT, String(session.createdAtMillis)],
    [StorageKeys.RESUME_DRIVE_FILE_ID, session.driveFileId ?? ''],
  ]);
}

export async function clearResumeSession(): Promise<void> {
  await AsyncStorage.multiRemove([...RESUME_KEYS]);
}

// ---------------------------------------------------------------------------
// Retry state
// ---------------------------------------------------------------------------

export async function getRetryState(): Promise<{
  retryAtMillis: number | null;
  retryError: string | null;
}> {
  const pairs = await AsyncStorage.multiGet([
    StorageKeys.RETRY_AT_MILLIS,
    StorageKeys.RETRY_ERROR,
  ]);
  const map = new Map(pairs);

  const rawMillis = map.get(StorageKeys.RETRY_AT_MILLIS);
  const rawError = map.get(StorageKeys.RETRY_ERROR);

  return {
    retryAtMillis: rawMillis ? Number(rawMillis) : null,
    retryError: rawError ?? null,
  };
}

export async function setRetryState(
  retryAtMillis: number | null,
  retryError: string | null,
): Promise<void> {
  if (retryAtMillis !== null) {
    await AsyncStorage.setItem(StorageKeys.RETRY_AT_MILLIS, String(retryAtMillis));
  } else {
    await AsyncStorage.removeItem(StorageKeys.RETRY_AT_MILLIS);
  }

  if (retryError !== null) {
    await AsyncStorage.setItem(StorageKeys.RETRY_ERROR, retryError);
  } else {
    await AsyncStorage.removeItem(StorageKeys.RETRY_ERROR);
  }
}

export async function clearRetryState(): Promise<void> {
  await AsyncStorage.multiRemove([StorageKeys.RETRY_AT_MILLIS, StorageKeys.RETRY_ERROR]);
}
