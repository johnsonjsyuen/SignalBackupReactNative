// Each test needs a fresh database module since `database.ts` holds `db` in
// module scope. We use jest.resetModules() + require() to get a fresh copy.
// After resetModules, we must also re-require expo-sqlite to get the same
// mock instance that the fresh database module will use.

interface FreshDb {
  mod: typeof import('@/lib/database');
  sqliteMock: any;
  mockDb: any;
}

function getFreshDatabase(): FreshDb {
  jest.resetModules();
  const sqliteMock = require('expo-sqlite');
  const mockDb = sqliteMock.__mockDb;
  const mod = require('@/lib/database') as typeof import('@/lib/database');
  return { mod, sqliteMock, mockDb };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// initDatabase
// ---------------------------------------------------------------------------

describe('initDatabase', () => {
  it('calls openDatabaseSync with the correct database name', () => {
    const { mod, sqliteMock } = getFreshDatabase();

    mod.initDatabase();

    expect(sqliteMock.openDatabaseSync).toHaveBeenCalledWith('signalbackup.db');
  });

  it('calls execSync with a CREATE TABLE statement', () => {
    const { mod, mockDb } = getFreshDatabase();

    mod.initDatabase();

    expect(mockDb.execSync).toHaveBeenCalledTimes(1);
    const sql = mockDb.execSync.mock.calls[0][0] as string;
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS upload_history');
    expect(sql).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT');
    expect(sql).toContain('timestamp INTEGER NOT NULL');
    expect(sql).toContain('fileName TEXT NOT NULL');
    expect(sql).toContain('fileSizeBytes INTEGER NOT NULL');
    expect(sql).toContain('status TEXT NOT NULL');
    expect(sql).toContain('errorMessage TEXT');
    expect(sql).toContain('driveFolderId TEXT NOT NULL');
    expect(sql).toContain('driveFileId TEXT');
  });

  it('creates an index on the timestamp column', () => {
    const { mod, mockDb } = getFreshDatabase();

    mod.initDatabase();

    const sql = mockDb.execSync.mock.calls[0][0] as string;
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_upload_history_timestamp');
  });
});

// ---------------------------------------------------------------------------
// insertUploadRecord
// ---------------------------------------------------------------------------

describe('insertUploadRecord', () => {
  it('throws if database is not initialized', () => {
    const { mod } = getFreshDatabase();

    expect(() =>
      mod.insertUploadRecord({
        timestamp: 1700000000000,
        fileName: 'backup.bin',
        fileSizeBytes: 1024,
        status: 'SUCCESS',
        errorMessage: null,
        driveFolderId: 'folder-1',
        driveFileId: 'file-1',
      }),
    ).toThrow('Database not initialized. Call initDatabase() first.');
  });

  it('calls runSync with correct SQL and parameters', () => {
    const { mod, mockDb } = getFreshDatabase();
    mod.initDatabase();
    mockDb.runSync.mockClear();

    const record = {
      timestamp: 1700000000000,
      fileName: 'signal-2024-01.backup',
      fileSizeBytes: 52428800,
      status: 'SUCCESS' as const,
      errorMessage: null,
      driveFolderId: 'folder-abc',
      driveFileId: 'file-xyz',
    };

    mod.insertUploadRecord(record);

    expect(mockDb.runSync).toHaveBeenCalledTimes(1);
    const [sql, params] = mockDb.runSync.mock.calls[0];
    expect(sql).toContain('INSERT INTO upload_history');
    expect(params).toEqual([
      1700000000000,
      'signal-2024-01.backup',
      52428800,
      'SUCCESS',
      null,
      'folder-abc',
      'file-xyz',
    ]);
  });

  it('handles FAILED status with an error message', () => {
    const { mod, mockDb } = getFreshDatabase();
    mod.initDatabase();
    mockDb.runSync.mockClear();

    mod.insertUploadRecord({
      timestamp: 1700000000000,
      fileName: 'backup.bin',
      fileSizeBytes: 1024,
      status: 'FAILED',
      errorMessage: 'Network timeout',
      driveFolderId: 'folder',
      driveFileId: null,
    });

    const [, params] = mockDb.runSync.mock.calls[0];
    expect(params[3]).toBe('FAILED');
    expect(params[4]).toBe('Network timeout');
    expect(params[6]).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getAllUploadRecords
// ---------------------------------------------------------------------------

describe('getAllUploadRecords', () => {
  it('throws if database is not initialized', () => {
    const { mod } = getFreshDatabase();

    expect(() => mod.getAllUploadRecords()).toThrow(
      'Database not initialized. Call initDatabase() first.',
    );
  });

  it('calls getAllSync and returns the result', () => {
    const { mod, mockDb } = getFreshDatabase();
    mod.initDatabase();

    const fakeRecords = [
      {
        id: 1,
        timestamp: 1700000000000,
        fileName: 'a.backup',
        fileSizeBytes: 100,
        status: 'SUCCESS',
        errorMessage: null,
        driveFolderId: 'f1',
        driveFileId: 'd1',
      },
      {
        id: 2,
        timestamp: 1700000001000,
        fileName: 'b.backup',
        fileSizeBytes: 200,
        status: 'FAILED',
        errorMessage: 'err',
        driveFolderId: 'f2',
        driveFileId: null,
      },
    ];

    mockDb.getAllSync.mockReturnValueOnce(fakeRecords);

    const result = mod.getAllUploadRecords();

    expect(mockDb.getAllSync).toHaveBeenCalledTimes(1);
    const sql = mockDb.getAllSync.mock.calls[0][0] as string;
    expect(sql).toContain('SELECT * FROM upload_history ORDER BY timestamp DESC');
    expect(result).toEqual(fakeRecords);
  });

  it('returns an empty array when no records exist', () => {
    const { mod, mockDb } = getFreshDatabase();
    mod.initDatabase();

    mockDb.getAllSync.mockReturnValueOnce([]);

    const result = mod.getAllUploadRecords();

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getLatestUploadRecord
// ---------------------------------------------------------------------------

describe('getLatestUploadRecord', () => {
  it('throws if database is not initialized', () => {
    const { mod } = getFreshDatabase();

    expect(() => mod.getLatestUploadRecord()).toThrow(
      'Database not initialized. Call initDatabase() first.',
    );
  });

  it('returns null when no records exist', () => {
    const { mod, mockDb } = getFreshDatabase();
    mod.initDatabase();

    mockDb.getFirstSync.mockReturnValueOnce(null);

    const result = mod.getLatestUploadRecord();

    expect(result).toBeNull();
  });

  it('returns undefined as null (via ?? null)', () => {
    const { mod, mockDb } = getFreshDatabase();
    mod.initDatabase();

    mockDb.getFirstSync.mockReturnValueOnce(undefined);

    const result = mod.getLatestUploadRecord();

    expect(result).toBeNull();
  });

  it('returns the first record when one exists', () => {
    const { mod, mockDb } = getFreshDatabase();
    mod.initDatabase();

    const fakeRecord = {
      id: 1,
      timestamp: 1700000000000,
      fileName: 'latest.backup',
      fileSizeBytes: 5000,
      status: 'SUCCESS',
      errorMessage: null,
      driveFolderId: 'folder',
      driveFileId: 'drive-file',
    };

    mockDb.getFirstSync.mockReturnValueOnce(fakeRecord);

    const result = mod.getLatestUploadRecord();

    expect(mockDb.getFirstSync).toHaveBeenCalledTimes(1);
    const sql = mockDb.getFirstSync.mock.calls[0][0] as string;
    expect(sql).toContain('SELECT * FROM upload_history ORDER BY timestamp DESC LIMIT 1');
    expect(result).toEqual(fakeRecord);
  });
});
