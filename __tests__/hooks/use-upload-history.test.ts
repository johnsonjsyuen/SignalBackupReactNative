import { renderHook, act } from '@testing-library/react-native';
import { useUploadHistory } from '@/hooks/use-upload-history';
import type { UploadRecord } from '@/types/upload';

// ---------------------------------------------------------------------------
// Mock the database module.
// ---------------------------------------------------------------------------

jest.mock('@/lib/database', () => ({
  getAllUploadRecords: jest.fn(() => []),
}));

import { getAllUploadRecords } from '@/lib/database';

const mockedGetAll = getAllUploadRecords as jest.Mock;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useUploadHistory', () => {
  beforeEach(() => {
    mockedGetAll.mockReset();
    mockedGetAll.mockReturnValue([]);
  });

  it('returns empty records and sets isLoading to false after mount', () => {
    const { result } = renderHook(() => useUploadHistory());

    expect(result.current.records).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns records from database', () => {
    const mockRecords: UploadRecord[] = [
      {
        id: 1,
        timestamp: 1700000000000,
        fileName: 'signal-2024-01-01.backup',
        fileSizeBytes: 1024 * 1024,
        status: 'SUCCESS',
        errorMessage: null,
        driveFolderId: 'folder-123',
        driveFileId: 'file-456',
      },
      {
        id: 2,
        timestamp: 1700100000000,
        fileName: 'signal-2024-01-02.backup',
        fileSizeBytes: 2048 * 1024,
        status: 'FAILED',
        errorMessage: 'Network error',
        driveFolderId: 'folder-123',
        driveFileId: null,
      },
    ];
    mockedGetAll.mockReturnValue(mockRecords);

    const { result } = renderHook(() => useUploadHistory());

    expect(result.current.records).toEqual(mockRecords);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles database error gracefully without crashing', () => {
    mockedGetAll.mockImplementation(() => {
      throw new Error('Database not initialized. Call initDatabase() first.');
    });

    const { result } = renderHook(() => useUploadHistory());

    // Should still render without throwing -- records stay empty.
    expect(result.current.records).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('refresh() re-fetches records from the database', () => {
    mockedGetAll.mockReturnValue([]);
    const { result } = renderHook(() => useUploadHistory());

    expect(result.current.records).toEqual([]);

    // Simulate new data appearing in the database.
    const newRecord: UploadRecord = {
      id: 3,
      timestamp: 1700200000000,
      fileName: 'signal-2024-01-03.backup',
      fileSizeBytes: 512 * 1024,
      status: 'SUCCESS',
      errorMessage: null,
      driveFolderId: 'folder-123',
      driveFileId: 'file-789',
    };
    mockedGetAll.mockReturnValue([newRecord]);

    act(() => {
      result.current.refresh();
    });

    expect(result.current.records).toEqual([newRecord]);
    // getAllUploadRecords was called once on mount and once on refresh.
    expect(mockedGetAll).toHaveBeenCalledTimes(2);
  });
});
