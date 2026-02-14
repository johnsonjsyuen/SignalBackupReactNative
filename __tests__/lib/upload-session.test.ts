import AsyncStorage from '@react-native-async-storage/async-storage';
import { UploadConstants } from '@/constants/upload';
import type { ResumableUploadSession } from '@/types/drive';
import {
  loadSession,
  saveSession,
  clearSession,
  isSessionExpired,
  updateBytesUploaded,
} from '@/lib/upload-session';
import { StorageKeys } from '@/constants/storage-keys';

const mockStorage = AsyncStorage as typeof AsyncStorage & {
  __getStore: () => Record<string, string>;
  __resetStore: () => void;
};

beforeEach(() => {
  mockStorage.__resetStore();
  jest.clearAllMocks();
});

function makeSampleSession(overrides?: Partial<ResumableUploadSession>): ResumableUploadSession {
  return {
    sessionUri: 'https://upload.googleapis.com/session/abc',
    localFileUri: 'file:///data/backup.bin',
    fileName: 'backup.bin',
    bytesUploaded: 0,
    totalBytes: 10_000_000,
    driveFolderId: 'folder-123',
    createdAtMillis: Date.now(),
    driveFileId: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// loadSession
// ---------------------------------------------------------------------------

describe('loadSession', () => {
  it('returns null when no session is stored', async () => {
    const result = await loadSession();

    expect(result).toBeNull();
  });

  it('delegates to getResumeSession and returns the session', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.RESUME_SESSION_URI] = 'https://upload.example.com/sess';
    store[StorageKeys.RESUME_LOCAL_FILE_URI] = 'file:///local';
    store[StorageKeys.RESUME_FILE_NAME] = 'file.bin';
    store[StorageKeys.RESUME_BYTES_UPLOADED] = '500';
    store[StorageKeys.RESUME_TOTAL_BYTES] = '1000';
    store[StorageKeys.RESUME_DRIVE_FOLDER_ID] = 'folder';
    store[StorageKeys.RESUME_CREATED_AT] = '1700000000000';
    store[StorageKeys.RESUME_DRIVE_FILE_ID] = 'drive-file';

    const result = await loadSession();

    expect(result).toEqual({
      sessionUri: 'https://upload.example.com/sess',
      localFileUri: 'file:///local',
      fileName: 'file.bin',
      bytesUploaded: 500,
      totalBytes: 1000,
      driveFolderId: 'folder',
      createdAtMillis: 1700000000000,
      driveFileId: 'drive-file',
    });
  });
});

// ---------------------------------------------------------------------------
// saveSession
// ---------------------------------------------------------------------------

describe('saveSession', () => {
  it('delegates to saveResumeSession and persists all fields', async () => {
    const session = makeSampleSession({ bytesUploaded: 1024 });

    await saveSession(session);

    expect(AsyncStorage.multiSet).toHaveBeenCalledTimes(1);
    const store = mockStorage.__getStore();
    expect(store[StorageKeys.RESUME_SESSION_URI]).toBe(session.sessionUri);
    expect(store[StorageKeys.RESUME_BYTES_UPLOADED]).toBe('1024');
  });
});

// ---------------------------------------------------------------------------
// clearSession
// ---------------------------------------------------------------------------

describe('clearSession', () => {
  it('delegates to clearResumeSession and removes all keys', async () => {
    const store = mockStorage.__getStore();
    store[StorageKeys.RESUME_SESSION_URI] = 'uri';

    await clearSession();

    expect(AsyncStorage.multiRemove).toHaveBeenCalledTimes(1);
    const afterStore = mockStorage.__getStore();
    expect(afterStore[StorageKeys.RESUME_SESSION_URI]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// isSessionExpired
// ---------------------------------------------------------------------------

describe('isSessionExpired', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns false for a freshly created session', () => {
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    const session = makeSampleSession({ createdAtMillis: Date.now() });

    expect(isSessionExpired(session)).toBe(false);
  });

  it('returns false when session is just under 6 days old', () => {
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    const almostExpired = Date.now() - (UploadConstants.SESSION_MAX_AGE_MS - 1000);
    const session = makeSampleSession({ createdAtMillis: almostExpired });

    expect(isSessionExpired(session)).toBe(false);
  });

  it('returns true when session is exactly 6 days old plus 1ms', () => {
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    const expired = Date.now() - UploadConstants.SESSION_MAX_AGE_MS - 1;
    const session = makeSampleSession({ createdAtMillis: expired });

    expect(isSessionExpired(session)).toBe(true);
  });

  it('returns true for a very old session (30 days)', () => {
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    const veryOld = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const session = makeSampleSession({ createdAtMillis: veryOld });

    expect(isSessionExpired(session)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateBytesUploaded
// ---------------------------------------------------------------------------

describe('updateBytesUploaded', () => {
  it('updates bytes when a session exists', async () => {
    // Seed a session in storage
    const session = makeSampleSession({ bytesUploaded: 0, createdAtMillis: 1700000000000 });
    await saveSession(session);
    jest.clearAllMocks();

    await updateBytesUploaded(5_000_000);

    // Verify that saveResumeSession was called with updated bytes
    expect(AsyncStorage.multiSet).toHaveBeenCalledTimes(1);
    const store = mockStorage.__getStore();
    expect(store[StorageKeys.RESUME_BYTES_UPLOADED]).toBe('5000000');
  });

  it('does nothing when no session exists', async () => {
    await updateBytesUploaded(1000);

    // multiGet is called to load session, but multiSet should not be called
    expect(AsyncStorage.multiGet).toHaveBeenCalled();
    expect(AsyncStorage.multiSet).not.toHaveBeenCalled();
  });

  it('preserves all other session fields when updating bytes', async () => {
    const session = makeSampleSession({
      sessionUri: 'https://upload.example.com/keep-fields',
      bytesUploaded: 100,
      totalBytes: 5000,
      createdAtMillis: 1700000000000,
      driveFileId: 'file-keep',
    });
    await saveSession(session);
    jest.clearAllMocks();

    await updateBytesUploaded(2500);

    const store = mockStorage.__getStore();
    expect(store[StorageKeys.RESUME_SESSION_URI]).toBe('https://upload.example.com/keep-fields');
    expect(store[StorageKeys.RESUME_TOTAL_BYTES]).toBe('5000');
    expect(store[StorageKeys.RESUME_BYTES_UPLOADED]).toBe('2500');
    expect(store[StorageKeys.RESUME_DRIVE_FILE_ID]).toBe('file-keep');
  });
});
