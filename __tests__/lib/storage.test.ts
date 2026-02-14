import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '@/constants/storage-keys';
import { DEFAULT_SETTINGS } from '@/types/settings';
import {
  getSettings,
  setSetting,
  getResumeSession,
  saveResumeSession,
  clearResumeSession,
  getRetryState,
  setRetryState,
  clearRetryState,
} from '@/lib/storage';

// The mock exposes __getStore() and __resetStore() helpers for direct store access.
const mockStorage = AsyncStorage as typeof AsyncStorage & {
  __getStore: () => Record<string, string>;
  __resetStore: () => void;
};

beforeEach(() => {
  mockStorage.__resetStore();
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getSettings
// ---------------------------------------------------------------------------

describe('getSettings', () => {
  it('returns all defaults when storage is empty', async () => {
    const settings = await getSettings();

    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('returns stored string values', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.LOCAL_FOLDER_URI] = 'file:///some/folder';
    store[StorageKeys.DRIVE_FOLDER_ID] = 'folder-123';
    store[StorageKeys.DRIVE_FOLDER_NAME] = 'Signal Backups';
    store[StorageKeys.GOOGLE_ACCOUNT_EMAIL] = 'user@example.com';
    store[StorageKeys.THEME_MODE] = 'DARK';

    const settings = await getSettings();

    expect(settings.localFolderUri).toBe('file:///some/folder');
    expect(settings.driveFolderId).toBe('folder-123');
    expect(settings.driveFolderName).toBe('Signal Backups');
    expect(settings.googleAccountEmail).toBe('user@example.com');
    expect(settings.themeMode).toBe('DARK');
  });

  it('returns stored numeric values', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.SCHEDULE_HOUR] = '14';
    store[StorageKeys.SCHEDULE_MINUTE] = '30';

    const settings = await getSettings();

    expect(settings.scheduleHour).toBe(14);
    expect(settings.scheduleMinute).toBe(30);
  });

  it('falls back to default for invalid numbers (NaN)', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.SCHEDULE_HOUR] = 'not-a-number';
    store[StorageKeys.SCHEDULE_MINUTE] = 'abc';

    const settings = await getSettings();

    expect(settings.scheduleHour).toBe(DEFAULT_SETTINGS.scheduleHour);
    expect(settings.scheduleMinute).toBe(DEFAULT_SETTINGS.scheduleMinute);
  });

  it('parses boolean "true" correctly', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.WIFI_ONLY] = 'true';

    const settings = await getSettings();

    expect(settings.wifiOnly).toBe(true);
  });

  it('parses boolean "false" correctly', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.WIFI_ONLY] = 'false';

    const settings = await getSettings();

    expect(settings.wifiOnly).toBe(false);
  });

  it('uses default for boolean when value is null', async () => {
    // wifiOnly not set -> falls back to DEFAULT_SETTINGS.wifiOnly (false)
    const settings = await getSettings();

    expect(settings.wifiOnly).toBe(DEFAULT_SETTINGS.wifiOnly);
  });

  it('calls AsyncStorage.multiGet with the correct keys', async () => {
    await getSettings();

    expect(AsyncStorage.multiGet).toHaveBeenCalledWith([
      StorageKeys.LOCAL_FOLDER_URI,
      StorageKeys.DRIVE_FOLDER_ID,
      StorageKeys.DRIVE_FOLDER_NAME,
      StorageKeys.SCHEDULE_HOUR,
      StorageKeys.SCHEDULE_MINUTE,
      StorageKeys.GOOGLE_ACCOUNT_EMAIL,
      StorageKeys.THEME_MODE,
      StorageKeys.WIFI_ONLY,
    ]);
  });
});

// ---------------------------------------------------------------------------
// setSetting
// ---------------------------------------------------------------------------

describe('setSetting', () => {
  it('stores a string value', async () => {
    await setSetting('test_key', 'hello');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('test_key', 'hello');
    expect(mockStorage.__getStore()['test_key']).toBe('hello');
  });

  it('stores a number as a string', async () => {
    await setSetting('num_key', 42);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('num_key', '42');
    expect(mockStorage.__getStore()['num_key']).toBe('42');
  });

  it('stores a boolean as a string', async () => {
    await setSetting('bool_key', true);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('bool_key', 'true');
    expect(mockStorage.__getStore()['bool_key']).toBe('true');
  });

  it('removes the item when value is null', async () => {
    mockStorage.__getStore()['del_key'] = 'existing';

    await setSetting('del_key', null);

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('del_key');
    expect(mockStorage.__getStore()['del_key']).toBeUndefined();
  });

  it('does not call setItem when value is null', async () => {
    await setSetting('key', null);

    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getResumeSession
// ---------------------------------------------------------------------------

describe('getResumeSession', () => {
  it('returns null when no session is stored', async () => {
    const session = await getResumeSession();

    expect(session).toBeNull();
  });

  it('returns null when session URI is not present', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.RESUME_FILE_NAME] = 'backup.bin';
    // No RESUME_SESSION_URI set

    const session = await getResumeSession();

    expect(session).toBeNull();
  });

  it('returns a full session object when all fields are stored', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.RESUME_SESSION_URI] = 'https://upload.googleapis.com/session/123';
    store[StorageKeys.RESUME_LOCAL_FILE_URI] = 'file:///data/backup.bin';
    store[StorageKeys.RESUME_FILE_NAME] = 'backup.bin';
    store[StorageKeys.RESUME_BYTES_UPLOADED] = '5242880';
    store[StorageKeys.RESUME_TOTAL_BYTES] = '10485760';
    store[StorageKeys.RESUME_DRIVE_FOLDER_ID] = 'folder-abc';
    store[StorageKeys.RESUME_CREATED_AT] = '1700000000000';
    store[StorageKeys.RESUME_DRIVE_FILE_ID] = 'file-xyz';

    const session = await getResumeSession();

    expect(session).toEqual({
      sessionUri: 'https://upload.googleapis.com/session/123',
      localFileUri: 'file:///data/backup.bin',
      fileName: 'backup.bin',
      bytesUploaded: 5242880,
      totalBytes: 10485760,
      driveFolderId: 'folder-abc',
      createdAtMillis: 1700000000000,
      driveFileId: 'file-xyz',
    });
  });

  it('defaults missing optional fields correctly', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.RESUME_SESSION_URI] = 'https://upload.example.com/sess';
    // All other fields missing

    const session = await getResumeSession();

    expect(session).not.toBeNull();
    expect(session!.localFileUri).toBe('');
    expect(session!.fileName).toBe('');
    expect(session!.bytesUploaded).toBe(0);
    expect(session!.totalBytes).toBe(0);
    expect(session!.driveFolderId).toBe('');
    expect(session!.createdAtMillis).toBe(0);
    expect(session!.driveFileId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// saveResumeSession
// ---------------------------------------------------------------------------

describe('saveResumeSession', () => {
  it('persists all 8 fields via multiSet', async () => {
    await saveResumeSession({
      sessionUri: 'https://upload.example.com/session/1',
      localFileUri: 'file:///data/backup.bin',
      fileName: 'backup.bin',
      bytesUploaded: 1024,
      totalBytes: 4096,
      driveFolderId: 'folder-1',
      createdAtMillis: 1700000000000,
      driveFileId: 'file-1',
    });

    expect(AsyncStorage.multiSet).toHaveBeenCalledWith([
      [StorageKeys.RESUME_SESSION_URI, 'https://upload.example.com/session/1'],
      [StorageKeys.RESUME_LOCAL_FILE_URI, 'file:///data/backup.bin'],
      [StorageKeys.RESUME_FILE_NAME, 'backup.bin'],
      [StorageKeys.RESUME_BYTES_UPLOADED, '1024'],
      [StorageKeys.RESUME_TOTAL_BYTES, '4096'],
      [StorageKeys.RESUME_DRIVE_FOLDER_ID, 'folder-1'],
      [StorageKeys.RESUME_CREATED_AT, '1700000000000'],
      [StorageKeys.RESUME_DRIVE_FILE_ID, 'file-1'],
    ]);
  });

  it('stores empty string for null driveFileId', async () => {
    await saveResumeSession({
      sessionUri: 'uri',
      localFileUri: 'local',
      fileName: 'name',
      bytesUploaded: 0,
      totalBytes: 100,
      driveFolderId: 'folder',
      createdAtMillis: 123,
      driveFileId: null,
    });

    const store = mockStorage.__getStore();
    expect(store[StorageKeys.RESUME_DRIVE_FILE_ID]).toBe('');
  });

  it('round-trips correctly with getResumeSession', async () => {
    const original = {
      sessionUri: 'https://upload.example.com/session/rt',
      localFileUri: 'file:///data/roundtrip.bin',
      fileName: 'roundtrip.bin',
      bytesUploaded: 999,
      totalBytes: 2000,
      driveFolderId: 'folder-rt',
      createdAtMillis: 1700000000000,
      driveFileId: 'file-rt',
    };

    await saveResumeSession(original);
    const loaded = await getResumeSession();

    expect(loaded).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// clearResumeSession
// ---------------------------------------------------------------------------

describe('clearResumeSession', () => {
  it('removes all 8 resume keys', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.RESUME_SESSION_URI] = 'some-uri';
    store[StorageKeys.RESUME_LOCAL_FILE_URI] = 'local';
    store[StorageKeys.RESUME_FILE_NAME] = 'name';
    store[StorageKeys.RESUME_BYTES_UPLOADED] = '100';
    store[StorageKeys.RESUME_TOTAL_BYTES] = '200';
    store[StorageKeys.RESUME_DRIVE_FOLDER_ID] = 'folder';
    store[StorageKeys.RESUME_CREATED_AT] = '123';
    store[StorageKeys.RESUME_DRIVE_FILE_ID] = 'file';

    await clearResumeSession();

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      StorageKeys.RESUME_SESSION_URI,
      StorageKeys.RESUME_LOCAL_FILE_URI,
      StorageKeys.RESUME_FILE_NAME,
      StorageKeys.RESUME_BYTES_UPLOADED,
      StorageKeys.RESUME_TOTAL_BYTES,
      StorageKeys.RESUME_DRIVE_FOLDER_ID,
      StorageKeys.RESUME_CREATED_AT,
      StorageKeys.RESUME_DRIVE_FILE_ID,
    ]);
  });

  it('results in getResumeSession returning null', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.RESUME_SESSION_URI] = 'uri';

    await clearResumeSession();
    const session = await getResumeSession();

    expect(session).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getRetryState
// ---------------------------------------------------------------------------

describe('getRetryState', () => {
  it('returns nulls when storage is empty', async () => {
    const state = await getRetryState();

    expect(state).toEqual({ retryAtMillis: null, retryError: null });
  });

  it('returns stored values', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.RETRY_AT_MILLIS] = '1700000000000';
    store[StorageKeys.RETRY_ERROR] = 'Network error';

    const state = await getRetryState();

    expect(state).toEqual({
      retryAtMillis: 1700000000000,
      retryError: 'Network error',
    });
  });

  it('returns null for retryAtMillis when not set, but returns retryError', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.RETRY_ERROR] = 'Some error';

    const state = await getRetryState();

    expect(state.retryAtMillis).toBeNull();
    expect(state.retryError).toBe('Some error');
  });
});

// ---------------------------------------------------------------------------
// setRetryState
// ---------------------------------------------------------------------------

describe('setRetryState', () => {
  it('stores both values when non-null', async () => {
    await setRetryState(1700000000000, 'Upload failed');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      StorageKeys.RETRY_AT_MILLIS,
      '1700000000000',
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      StorageKeys.RETRY_ERROR,
      'Upload failed',
    );
  });

  it('removes retryAtMillis when null', async () => {
    await setRetryState(null, 'error msg');

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(StorageKeys.RETRY_AT_MILLIS);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      StorageKeys.RETRY_ERROR,
      'error msg',
    );
  });

  it('removes retryError when null', async () => {
    await setRetryState(123456, null);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      StorageKeys.RETRY_AT_MILLIS,
      '123456',
    );
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(StorageKeys.RETRY_ERROR);
  });

  it('removes both keys when both are null', async () => {
    await setRetryState(null, null);

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(StorageKeys.RETRY_AT_MILLIS);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(StorageKeys.RETRY_ERROR);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// clearRetryState
// ---------------------------------------------------------------------------

describe('clearRetryState', () => {
  it('removes both retry keys via multiRemove', async () => {
    await clearRetryState();

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      StorageKeys.RETRY_AT_MILLIS,
      StorageKeys.RETRY_ERROR,
    ]);
  });

  it('results in getRetryState returning nulls', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.RETRY_AT_MILLIS] = '999';
    store[StorageKeys.RETRY_ERROR] = 'err';

    await clearRetryState();
    const state = await getRetryState();

    expect(state).toEqual({ retryAtMillis: null, retryError: null });
  });
});
