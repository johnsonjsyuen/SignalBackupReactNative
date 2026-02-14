import { UploadConstants } from '@/constants/upload';

// ---------------------------------------------------------------------------
// expo-file-system mock: the factory must be self-contained because
// jest.mock() is hoisted above all other statements by babel-jest.
// ---------------------------------------------------------------------------

const MOCK_CACHE_PATH = 'mock://cache';

jest.mock('expo-file-system', () => {
  class MockFile {
    uri: string;
    exists = true;
    size = 1024;
    md5 = 'abc123def456';
    modificationTime = Date.now();
    private _offset = 0;

    constructor(...args: string[]) {
      this.uri = args.length === 1 ? args[0] : `${args[0]}/${args[1]}`;
    }

    get offset() { return this._offset; }
    set offset(val: number) { this._offset = val; }

    open() {
      return {
        offset: 0,
        readBytes: jest.fn((size: number) => new Uint8Array(size)),
        close: jest.fn(),
      };
    }
    copy() {}
    delete() {}
  }

  class MockDirectory {
    uri: string;
    constructor(uri: string) { this.uri = uri; }
    list(): MockFile[] { return []; }
  }

  return {
    File: MockFile,
    Directory: MockDirectory,
    Paths: { cache: 'mock://cache', document: 'mock://document' },
  };
});

// ---------------------------------------------------------------------------
// Mock all other dependencies
// ---------------------------------------------------------------------------

jest.mock('@/lib/google-auth', () => ({
  getGoogleAccessToken: jest.fn(),
}));

jest.mock('@/lib/storage', () => ({
  getSettings: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  insertUploadRecord: jest.fn(),
}));

jest.mock('@/lib/drive-api', () => ({
  findFile: jest.fn(),
  initiateResumableUpload: jest.fn(),
  uploadChunk: jest.fn(),
  queryUploadProgress: jest.fn(),
}));

jest.mock('@/lib/upload-session', () => ({
  loadSession: jest.fn(),
  saveSession: jest.fn(),
  clearSession: jest.fn(),
  isSessionExpired: jest.fn(),
  updateBytesUploaded: jest.fn(),
}));

jest.mock('@/lib/md5', () => ({
  computeFileMd5: jest.fn(),
}));

jest.mock('@/lib/platform', () => ({
  isWifiConnected: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after jest.mock calls)
// ---------------------------------------------------------------------------

import { getGoogleAccessToken } from '@/lib/google-auth';
import { getSettings } from '@/lib/storage';
import { insertUploadRecord } from '@/lib/database';
import * as DriveApi from '@/lib/drive-api';
import * as UploadSession from '@/lib/upload-session';
import { computeFileMd5 } from '@/lib/md5';
import { isWifiConnected } from '@/lib/platform';
import { performUpload } from '@/lib/upload-engine';

// Extract the mock classes from the mocked module for use in test setup
const { File: MockFile, Directory: MockDirectory } = jest.requireMock('expo-file-system') as {
  File: new (...args: string[]) => any;
  Directory: new (...args: string[]) => any;
};

// ---------------------------------------------------------------------------
// Types for mock access
// ---------------------------------------------------------------------------

const mockGetToken = getGoogleAccessToken as jest.Mock;
const mockGetSettings = getSettings as jest.Mock;
const mockInsertRecord = insertUploadRecord as jest.Mock;
const mockFindFile = DriveApi.findFile as jest.Mock;
const mockInitiateUpload = DriveApi.initiateResumableUpload as jest.Mock;
const mockUploadChunk = DriveApi.uploadChunk as jest.Mock;
const mockQueryProgress = DriveApi.queryUploadProgress as jest.Mock;
const mockLoadSession = UploadSession.loadSession as jest.Mock;
const mockSaveSession = UploadSession.saveSession as jest.Mock;
const mockClearSession = UploadSession.clearSession as jest.Mock;
const mockIsSessionExpired = UploadSession.isSessionExpired as jest.Mock;
const mockUpdateBytesUploaded = UploadSession.updateBytesUploaded as jest.Mock;
const mockComputeMd5 = computeFileMd5 as jest.Mock;
const mockIsWifiConnected = isWifiConnected as jest.Mock;

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const FILE_NAME = 'signal-2024-01-15.backup';
const FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const TOKEN = 'test-access-token';
const SESSION_URI = 'https://www.googleapis.com/upload/drive/v3/files?upload_id=session123';
const DRIVE_FOLDER_ID = 'drive-folder-abc';
const DRIVE_FILE_ID = 'drive-file-xyz';
const LOCAL_FOLDER_URI = 'file:///storage/emulated/0/Signal/Backups';
const CACHE_FILE_URI = `${MOCK_CACHE_PATH}/${FILE_NAME}`;

/** Builds a mock File instance (from the expo-file-system mock) with custom properties. */
function createMockFile(overrides: Partial<{
  uri: string;
  exists: boolean;
  size: number;
  md5: string;
  modificationTime: number;
}> = {}) {
  const file = new MockFile(overrides.uri ?? `${LOCAL_FOLDER_URI}/${FILE_NAME}`);
  Object.assign(file, {
    exists: overrides.exists ?? true,
    size: overrides.size ?? FILE_SIZE,
    md5: overrides.md5 ?? 'abc123def456',
    modificationTime: overrides.modificationTime ?? 1000,
  });
  return file;
}

function createDefaultCallbacks() {
  return {
    onProgress: jest.fn(),
    isCancelled: jest.fn().mockReturnValue(false),
  };
}

/**
 * Sets up the "happy path" mocks: a fresh upload from start to finish.
 * Individual tests can override specific mocks before calling performUpload.
 */
function setupDefaultMocks() {
  mockGetToken.mockResolvedValue(TOKEN);

  mockGetSettings.mockResolvedValue({
    localFolderUri: LOCAL_FOLDER_URI,
    driveFolderId: DRIVE_FOLDER_ID,
    driveFolderName: 'Backups',
    scheduleHour: 3,
    scheduleMinute: 0,
    googleAccountEmail: 'test@example.com',
    themeMode: 'SYSTEM',
    wifiOnly: false,
  });

  // No existing session
  mockLoadSession.mockResolvedValue(null);

  // Directory listing returns one backup file
  const backupFile = createMockFile();
  jest.spyOn(MockDirectory.prototype, 'list').mockReturnValue([backupFile]);

  // No duplicate on Drive
  mockFindFile.mockResolvedValue(null);

  // Resumable upload initiation returns session URI
  mockInitiateUpload.mockResolvedValue(SESSION_URI);

  // Single-chunk upload completes immediately
  mockUploadChunk.mockResolvedValue({
    done: true,
    bytesConfirmed: -1,
    driveFileId: DRIVE_FILE_ID,
    md5Checksum: 'abc123def456',
  });

  // MD5 matches
  mockComputeMd5.mockReturnValue('abc123def456');

  // Session persistence
  mockSaveSession.mockResolvedValue(undefined);
  mockClearSession.mockResolvedValue(undefined);
  mockUpdateBytesUploaded.mockResolvedValue(undefined);

  // Wi-Fi connected
  mockIsWifiConnected.mockResolvedValue(true);
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaultMocks();
});

// ---------------------------------------------------------------------------
// Phase 1: Configuration errors
// ---------------------------------------------------------------------------

describe('performUpload - configuration validation', () => {
  it('returns error when localFolderUri is not set', async () => {
    mockGetSettings.mockResolvedValue({
      localFolderUri: null,
      driveFolderId: DRIVE_FOLDER_ID,
      wifiOnly: false,
    });

    const result = await performUpload(createDefaultCallbacks());

    expect(result.success).toBe(false);
    expect(result.error).toBe('Local backup folder not set');
  });

  it('returns error when driveFolderId is not set', async () => {
    mockGetSettings.mockResolvedValue({
      localFolderUri: LOCAL_FOLDER_URI,
      driveFolderId: null,
      wifiOnly: false,
    });

    const result = await performUpload(createDefaultCallbacks());

    expect(result.success).toBe(false);
    expect(result.error).toBe('Google Drive folder not set');
  });
});

// ---------------------------------------------------------------------------
// Phase 2: Session resume
// ---------------------------------------------------------------------------

describe('performUpload - session resume', () => {
  const savedSession = {
    sessionUri: SESSION_URI,
    localFileUri: CACHE_FILE_URI,
    fileName: FILE_NAME,
    bytesUploaded: 5 * 1024 * 1024,
    totalBytes: FILE_SIZE,
    driveFolderId: DRIVE_FOLDER_ID,
    createdAtMillis: Date.now() - 1000,
    driveFileId: null,
  };

  it('resumes from a saved session when valid', async () => {
    mockLoadSession.mockResolvedValue(savedSession);
    mockIsSessionExpired.mockReturnValue(false);
    mockQueryProgress.mockResolvedValue({
      done: false,
      bytesConfirmed: 5 * 1024 * 1024,
    });

    // The resume will enter uploadChunks. Mock a single successful chunk.
    mockUploadChunk.mockResolvedValue({
      done: true,
      bytesConfirmed: -1,
      driveFileId: DRIVE_FILE_ID,
      md5Checksum: 'abc123def456',
    });

    const callbacks = createDefaultCallbacks();
    const result = await performUpload(callbacks);

    expect(result.success).toBe(true);
    expect(result.fileName).toBe(FILE_NAME);
    expect(mockQueryProgress).toHaveBeenCalledWith(SESSION_URI, FILE_SIZE);
    expect(mockInsertRecord).toHaveBeenCalledTimes(1);
  });

  it('handles crash recovery when session query shows upload already done', async () => {
    mockLoadSession.mockResolvedValue(savedSession);
    mockIsSessionExpired.mockReturnValue(false);
    mockQueryProgress.mockResolvedValue({
      done: true,
      bytesConfirmed: -1,
      driveFileId: DRIVE_FILE_ID,
    });

    const result = await performUpload(createDefaultCallbacks());

    expect(result.success).toBe(true);
    expect(result.fileName).toBe(FILE_NAME);
    expect(result.fileSizeBytes).toBe(FILE_SIZE);
    expect(mockClearSession).toHaveBeenCalled();
    expect(mockInsertRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: FILE_NAME,
        fileSizeBytes: FILE_SIZE,
        status: 'SUCCESS',
        driveFileId: DRIVE_FILE_ID,
      }),
    );
  });

  it('clears expired session and starts fresh', async () => {
    mockLoadSession.mockResolvedValue(savedSession);
    mockIsSessionExpired.mockReturnValue(true);

    const callbacks = createDefaultCallbacks();
    const result = await performUpload(callbacks);

    // Should have cleared the expired session
    expect(mockClearSession).toHaveBeenCalled();
    // Should continue to a fresh upload and succeed
    expect(result.success).toBe(true);
  });

  it('clears session targeting a different folder and starts fresh', async () => {
    const wrongFolderSession = { ...savedSession, driveFolderId: 'different-folder' };
    mockLoadSession.mockResolvedValue(wrongFolderSession);
    mockIsSessionExpired.mockReturnValue(false);

    const result = await performUpload(createDefaultCallbacks());

    expect(mockClearSession).toHaveBeenCalled();
    // Should proceed with a fresh upload
    expect(result.success).toBe(true);
    expect(mockInitiateUpload).toHaveBeenCalled();
  });

  it('clears session and starts fresh when queryUploadProgress throws', async () => {
    mockLoadSession.mockResolvedValue(savedSession);
    mockIsSessionExpired.mockReturnValue(false);
    mockQueryProgress.mockRejectedValue(new Error('Upload session expired'));

    const result = await performUpload(createDefaultCallbacks());

    // Should clear the invalid session and proceed fresh
    expect(mockClearSession).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Phase 3: Finding backup files
// ---------------------------------------------------------------------------

describe('performUpload - finding backup files', () => {
  it('returns error when no backup files are found', async () => {
    jest.spyOn(MockDirectory.prototype, 'list').mockReturnValue([]);

    const result = await performUpload(createDefaultCallbacks());

    expect(result.success).toBe(false);
    expect(result.error).toBe('No backup files found');
  });

  it('filters out non-.backup files', async () => {
    const txtFile = createMockFile({ uri: `${LOCAL_FOLDER_URI}/notes.txt` });
    jest.spyOn(MockDirectory.prototype, 'list').mockReturnValue([txtFile]);

    const result = await performUpload(createDefaultCallbacks());

    expect(result.success).toBe(false);
    expect(result.error).toBe('No backup files found');
  });
});

// ---------------------------------------------------------------------------
// Phase 4: Deduplication
// ---------------------------------------------------------------------------

describe('performUpload - deduplication', () => {
  it('skips upload when file already exists on Drive with same size', async () => {
    mockFindFile.mockResolvedValue({ id: 'existing-id', size: FILE_SIZE });

    const callbacks = createDefaultCallbacks();
    const result = await performUpload(callbacks);

    expect(result.success).toBe(true);
    expect(result.fileName).toBe(FILE_NAME);
    expect(result.fileSizeBytes).toBe(FILE_SIZE);
    // Should not have initiated an upload
    expect(mockInitiateUpload).not.toHaveBeenCalled();
    // Should still record the dedup as a success
    expect(mockInsertRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: FILE_NAME,
        fileSizeBytes: FILE_SIZE,
        status: 'SUCCESS',
        driveFileId: 'existing-id',
      }),
    );
  });

  it('proceeds with upload when existing file has different size', async () => {
    mockFindFile.mockResolvedValue({ id: 'existing-id', size: FILE_SIZE - 100 });

    const result = await performUpload(createDefaultCallbacks());

    expect(result.success).toBe(true);
    expect(mockInitiateUpload).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Phase 5+6: Full upload lifecycle
// ---------------------------------------------------------------------------

describe('performUpload - full upload lifecycle', () => {
  it('completes a fresh upload from start to finish', async () => {
    const callbacks = createDefaultCallbacks();
    const result = await performUpload(callbacks);

    expect(result).toEqual({
      success: true,
      fileName: FILE_NAME,
      fileSizeBytes: FILE_SIZE,
    });

    // Verify the flow
    expect(mockGetToken).toHaveBeenCalled();
    expect(mockGetSettings).toHaveBeenCalled();
    expect(mockLoadSession).toHaveBeenCalled();
    expect(mockFindFile).toHaveBeenCalledWith(FILE_NAME, DRIVE_FOLDER_ID, TOKEN);
    expect(mockInitiateUpload).toHaveBeenCalledWith(
      FILE_NAME,
      DRIVE_FOLDER_ID,
      FILE_SIZE,
      TOKEN,
    );
    expect(mockSaveSession).toHaveBeenCalled();
    expect(mockUploadChunk).toHaveBeenCalled();
    expect(mockClearSession).toHaveBeenCalled();
    expect(mockInsertRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: FILE_NAME,
        fileSizeBytes: FILE_SIZE,
        status: 'SUCCESS',
        driveFileId: DRIVE_FILE_ID,
      }),
    );
  });

  it('reports progress via onProgress callback', async () => {
    const callbacks = createDefaultCallbacks();
    await performUpload(callbacks);

    expect(callbacks.onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        bytesUploaded: expect.any(Number),
        totalBytes: FILE_SIZE,
        speedBytesPerSec: expect.any(Number),
        estimatedSecondsRemaining: expect.any(Number),
      }),
    );
  });

  it('handles multi-chunk upload', async () => {
    // First chunk: in progress
    mockUploadChunk
      .mockResolvedValueOnce({
        done: false,
        bytesConfirmed: 5 * 1024 * 1024,
      })
      // Second chunk: done
      .mockResolvedValueOnce({
        done: true,
        bytesConfirmed: -1,
        driveFileId: DRIVE_FILE_ID,
        md5Checksum: 'abc123def456',
      });

    const callbacks = createDefaultCallbacks();
    const result = await performUpload(callbacks);

    expect(result.success).toBe(true);
    expect(mockUploadChunk).toHaveBeenCalledTimes(2);
    expect(callbacks.onProgress).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Cancellation
// ---------------------------------------------------------------------------

describe('performUpload - cancellation', () => {
  it('returns cancelled when isCancelled returns true before dedup check', async () => {
    const callbacks = createDefaultCallbacks();
    // Cancel after finding the file but before dedup check
    callbacks.isCancelled
      .mockReturnValueOnce(true);

    const result = await performUpload(callbacks);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Cancelled');
  });

  it('returns cancelled when isCancelled returns true during upload loop', async () => {
    const callbacks = createDefaultCallbacks();
    // First call (before dedup): not cancelled
    // Second call (before upload initiation): not cancelled
    // Third call (in upload loop): cancelled
    callbacks.isCancelled
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    // Make the first chunk return "in progress" so the loop iterates
    mockUploadChunk.mockResolvedValueOnce({
      done: false,
      bytesConfirmed: 5 * 1024 * 1024,
    });

    const result = await performUpload(callbacks);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Cancelled');
  });
});

// ---------------------------------------------------------------------------
// Wi-Fi check
// ---------------------------------------------------------------------------

describe('performUpload - Wi-Fi check', () => {
  it('throws when wifiOnly is true and Wi-Fi is not connected', async () => {
    mockGetSettings.mockResolvedValue({
      localFolderUri: LOCAL_FOLDER_URI,
      driveFolderId: DRIVE_FOLDER_ID,
      wifiOnly: true,
    });
    mockIsWifiConnected.mockResolvedValue(false);

    const result = await performUpload(createDefaultCallbacks());

    expect(result.success).toBe(false);
    expect(result.error).toBe('Wi-Fi connection lost');
  });

  it('does not check Wi-Fi when wifiOnly is false', async () => {
    mockGetSettings.mockResolvedValue({
      localFolderUri: LOCAL_FOLDER_URI,
      driveFolderId: DRIVE_FOLDER_ID,
      wifiOnly: false,
    });

    await performUpload(createDefaultCallbacks());

    expect(mockIsWifiConnected).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Stall detection
// ---------------------------------------------------------------------------

describe('performUpload - stall detection', () => {
  it('returns error when upload stalls with no progress after retries', async () => {
    // Every chunk returns the same bytesConfirmed (0) = no progress
    mockUploadChunk.mockResolvedValue({
      done: false,
      bytesConfirmed: 0,
    });

    const result = await performUpload(createDefaultCallbacks());

    expect(result.success).toBe(false);
    expect(result.error).toBe('Upload stalled: no progress after retries');
    // Should have been called MAX_NO_PROGRESS_RETRIES times
    expect(mockUploadChunk).toHaveBeenCalledTimes(UploadConstants.MAX_NO_PROGRESS_RETRIES);
  });
});

// ---------------------------------------------------------------------------
// Phase 7: MD5 verification
// ---------------------------------------------------------------------------

describe('performUpload - MD5 verification', () => {
  it('verifies MD5 checksum on completion', async () => {
    mockComputeMd5.mockReturnValue('abc123def456');
    mockUploadChunk.mockResolvedValue({
      done: true,
      bytesConfirmed: -1,
      driveFileId: DRIVE_FILE_ID,
      md5Checksum: 'abc123def456',
    });

    const result = await performUpload(createDefaultCallbacks());

    expect(result.success).toBe(true);
    expect(mockComputeMd5).toHaveBeenCalled();
  });

  it('returns error on MD5 checksum mismatch', async () => {
    mockComputeMd5.mockReturnValue('local-md5-hash');
    mockUploadChunk.mockResolvedValue({
      done: true,
      bytesConfirmed: -1,
      driveFileId: DRIVE_FILE_ID,
      md5Checksum: 'remote-md5-hash',
    });

    const result = await performUpload(createDefaultCallbacks());

    expect(result.success).toBe(false);
    expect(result.error).toBe('MD5 checksum mismatch');
  });

  it('succeeds when Drive does not return an MD5 checksum', async () => {
    mockComputeMd5.mockReturnValue('local-md5-hash');
    mockUploadChunk.mockResolvedValue({
      done: true,
      bytesConfirmed: -1,
      driveFileId: DRIVE_FILE_ID,
      md5Checksum: undefined,
    });

    const result = await performUpload(createDefaultCallbacks());

    expect(result.success).toBe(true);
  });

  it('succeeds when computeFileMd5 throws a non-mismatch error', async () => {
    mockComputeMd5.mockImplementation(() => {
      throw new Error('Failed to compute MD5');
    });
    mockUploadChunk.mockResolvedValue({
      done: true,
      bytesConfirmed: -1,
      driveFileId: DRIVE_FILE_ID,
      md5Checksum: 'remote-md5-hash',
    });

    const result = await performUpload(createDefaultCallbacks());

    // Non-mismatch MD5 errors are swallowed (non-critical)
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Database recording
// ---------------------------------------------------------------------------

describe('performUpload - database recording', () => {
  it('records upload in database on success', async () => {
    const result = await performUpload(createDefaultCallbacks());

    expect(result.success).toBe(true);
    expect(mockInsertRecord).toHaveBeenCalledTimes(1);
    expect(mockInsertRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: FILE_NAME,
        fileSizeBytes: FILE_SIZE,
        status: 'SUCCESS',
        errorMessage: null,
        driveFolderId: DRIVE_FOLDER_ID,
        driveFileId: DRIVE_FILE_ID,
      }),
    );
  });

  it('includes timestamp in the upload record', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T10:00:00Z'));

    await performUpload(createDefaultCallbacks());

    const recordArg = mockInsertRecord.mock.calls[0][0];
    expect(recordArg.timestamp).toBe(Date.now());

    jest.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// Cache cleanup
// ---------------------------------------------------------------------------

describe('performUpload - cache cleanup', () => {
  it('deletes cached file on success', async () => {
    const deleteSpy = jest.fn();
    // Override the File mock's delete to track calls.
    // The File constructor in the mock is called inside uploadChunks.
    // We need to spy on the prototype.
    jest.spyOn(MockFile.prototype, 'delete').mockImplementation(deleteSpy);

    await performUpload(createDefaultCallbacks());

    expect(deleteSpy).toHaveBeenCalled();

    (MockFile.prototype.delete as jest.Mock).mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Upload chunk completing inline (result.done = true on first chunk)
// ---------------------------------------------------------------------------

describe('performUpload - chunk completing immediately', () => {
  it('handles upload chunk completing with done=true on first chunk', async () => {
    mockUploadChunk.mockResolvedValue({
      done: true,
      bytesConfirmed: -1,
      driveFileId: DRIVE_FILE_ID,
      md5Checksum: 'abc123def456',
    });

    const callbacks = createDefaultCallbacks();
    const result = await performUpload(callbacks);

    expect(result.success).toBe(true);
    expect(result.fileName).toBe(FILE_NAME);
    expect(result.fileSizeBytes).toBe(FILE_SIZE);
    expect(mockUploadChunk).toHaveBeenCalledTimes(1);
    expect(mockClearSession).toHaveBeenCalled();
  });
});
