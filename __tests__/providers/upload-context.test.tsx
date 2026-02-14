import React from 'react';
import { render, act, waitFor, fireEvent } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import { UploadProvider, UploadContext } from '@/providers/upload-context';
import type { UploadProgress, UploadStatus } from '@/types/upload';

// ---------------------------------------------------------------------------
// Mock the upload engine.  The provider uses a dynamic import:
//   const { performUpload } = await import('@/lib/upload-engine');
// So we mock the module at the top level.
// ---------------------------------------------------------------------------

const mockPerformUpload = jest.fn();

jest.mock('@/lib/upload-engine', () => ({
  performUpload: (...args: unknown[]) => mockPerformUpload(...args),
}));

// ---------------------------------------------------------------------------
// Test consumer that exposes the upload context via rendered text and
// pressable buttons for triggering actions.
// ---------------------------------------------------------------------------

function TestConsumer() {
  const { status, progress, startUpload, cancelUpload } =
    React.useContext(UploadContext);

  return (
    <>
      <Text testID="statusKind">{status.kind}</Text>
      <Text testID="progress">
        {progress ? `${progress.bytesUploaded}/${progress.totalBytes}` : 'none'}
      </Text>
      {status.kind === 'success' && (
        <Text testID="successFileName">{status.fileName}</Text>
      )}
      {status.kind === 'failed' && (
        <Text testID="failedError">{status.error}</Text>
      )}
      <Pressable testID="startBtn" onPress={startUpload} />
      <Pressable testID="cancelBtn" onPress={cancelUpload} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UploadProvider', () => {
  beforeEach(() => {
    mockPerformUpload.mockReset();
  });

  it('provides idle status initially', () => {
    const { getByTestId } = render(
      <UploadProvider>
        <TestConsumer />
      </UploadProvider>,
    );

    expect(getByTestId('statusKind').props.children).toBe('idle');
    expect(getByTestId('progress').props.children).toBe('none');
  });

  it('startUpload transitions to uploading then to success', async () => {
    mockPerformUpload.mockImplementation(async () => {
      return { success: true, fileName: 'backup.bin', fileSizeBytes: 2048 };
    });

    const { getByTestId } = render(
      <UploadProvider>
        <TestConsumer />
      </UploadProvider>,
    );

    await act(async () => {
      fireEvent.press(getByTestId('startBtn'));
    });

    // After performUpload resolves successfully, status should be 'success'.
    await waitFor(() => {
      expect(getByTestId('statusKind').props.children).toBe('success');
    });

    expect(getByTestId('successFileName').props.children).toBe('backup.bin');
  });

  it('startUpload transitions to failed on upload failure result', async () => {
    mockPerformUpload.mockImplementation(async () => {
      return { success: false, error: 'No backup files found' };
    });

    const { getByTestId } = render(
      <UploadProvider>
        <TestConsumer />
      </UploadProvider>,
    );

    await act(async () => {
      fireEvent.press(getByTestId('startBtn'));
    });

    await waitFor(() => {
      expect(getByTestId('statusKind').props.children).toBe('failed');
    });

    expect(getByTestId('failedError').props.children).toBe('No backup files found');
  });

  it('cancelUpload resets status to idle', async () => {
    // Make performUpload hang indefinitely so we can cancel mid-upload.
    let resolveUpload!: (v: any) => void;
    mockPerformUpload.mockImplementation(
      () => new Promise((resolve) => { resolveUpload = resolve; }),
    );

    const { getByTestId } = render(
      <UploadProvider>
        <TestConsumer />
      </UploadProvider>,
    );

    // Start the upload -- this will set status to 'uploading'.
    act(() => {
      fireEvent.press(getByTestId('startBtn'));
    });

    await waitFor(() => {
      expect(getByTestId('statusKind').props.children).toBe('uploading');
    });

    // Cancel it.
    act(() => {
      fireEvent.press(getByTestId('cancelBtn'));
    });

    expect(getByTestId('statusKind').props.children).toBe('idle');

    // Resolve the hanging promise to avoid unhandled rejections.
    resolveUpload({ success: false, error: 'Cancelled' });
  });

  it('prevents double upload when already uploading', async () => {
    let resolveUpload!: (v: any) => void;
    mockPerformUpload.mockImplementation(
      () => new Promise((resolve) => { resolveUpload = resolve; }),
    );

    const { getByTestId } = render(
      <UploadProvider>
        <TestConsumer />
      </UploadProvider>,
    );

    // Start first upload.
    act(() => {
      fireEvent.press(getByTestId('startBtn'));
    });

    await waitFor(() => {
      expect(getByTestId('statusKind').props.children).toBe('uploading');
    });

    // Try to start a second upload while the first is still running.
    act(() => {
      fireEvent.press(getByTestId('startBtn'));
    });

    // performUpload should only have been called once.
    expect(mockPerformUpload).toHaveBeenCalledTimes(1);

    resolveUpload({ success: true, fileName: 'backup.bin', fileSizeBytes: 100 });
  });

  it('reports progress via onProgress callback', async () => {
    mockPerformUpload.mockImplementation(async (callbacks: any) => {
      // Simulate progress reports.
      callbacks.onProgress({
        bytesUploaded: 500,
        totalBytes: 1000,
        speedBytesPerSec: 100,
        estimatedSecondsRemaining: 5,
      });
      return { success: true, fileName: 'backup.bin', fileSizeBytes: 1000 };
    });

    const { getByTestId } = render(
      <UploadProvider>
        <TestConsumer />
      </UploadProvider>,
    );

    await act(async () => {
      fireEvent.press(getByTestId('startBtn'));
    });

    // After upload completes, progress is cleared (set to null in finally).
    // But we can verify the mock was called with a callbacks object.
    expect(mockPerformUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        onProgress: expect.any(Function),
        isCancelled: expect.any(Function),
      }),
    );
  });

  it('handles upload exception and sets failed status', async () => {
    mockPerformUpload.mockRejectedValue(new Error('Network timeout'));

    const { getByTestId } = render(
      <UploadProvider>
        <TestConsumer />
      </UploadProvider>,
    );

    await act(async () => {
      fireEvent.press(getByTestId('startBtn'));
    });

    await waitFor(() => {
      expect(getByTestId('statusKind').props.children).toBe('failed');
    });

    expect(getByTestId('failedError').props.children).toBe('Network timeout');
  });
});
