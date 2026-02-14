import { renderHook } from '@testing-library/react-native';
import React from 'react';
import { useUploadStatus } from '@/hooks/use-upload-status';
import { UploadContext } from '@/providers/upload-context';
import type { UploadProgress, UploadStatus } from '@/types/upload';

// ---------------------------------------------------------------------------
// Helper: render the hook inside an UploadContext provider with given values.
// ---------------------------------------------------------------------------

function renderWithUploadContext(overrides: {
  status?: UploadStatus;
  progress?: UploadProgress | null;
  startUpload?: () => Promise<void>;
  cancelUpload?: () => void;
} = {}) {
  const value = {
    status: overrides.status ?? { kind: 'idle' as const },
    progress: overrides.progress ?? null,
    startUpload: overrides.startUpload ?? jest.fn(),
    cancelUpload: overrides.cancelUpload ?? jest.fn(),
  };

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(UploadContext.Provider, { value }, children);

  return { ...renderHook(() => useUploadStatus(), { wrapper }), contextValue: value };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useUploadStatus', () => {
  it('returns status from context', () => {
    const status: UploadStatus = {
      kind: 'success',
      fileName: 'backup.bin',
      fileSizeBytes: 1024,
    };
    const { result } = renderWithUploadContext({ status });

    expect(result.current.status).toEqual(status);
  });

  it('returns progress from context', () => {
    const progress: UploadProgress = {
      bytesUploaded: 500,
      totalBytes: 1000,
      speedBytesPerSec: 100,
      estimatedSecondsRemaining: 5,
    };
    const { result } = renderWithUploadContext({ progress });

    expect(result.current.progress).toEqual(progress);
  });

  it('returns startUpload function from context', () => {
    const startUpload = jest.fn();
    const { result } = renderWithUploadContext({ startUpload });

    expect(result.current.startUpload).toBe(startUpload);
  });

  it('returns cancelUpload function from context', () => {
    const cancelUpload = jest.fn();
    const { result } = renderWithUploadContext({ cancelUpload });

    expect(result.current.cancelUpload).toBe(cancelUpload);
  });

  it('returns default idle status when no provider is present', () => {
    const { result } = renderHook(() => useUploadStatus());

    expect(result.current.status).toEqual({ kind: 'idle' });
    expect(result.current.progress).toBeNull();
  });
});
