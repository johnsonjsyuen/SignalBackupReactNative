import React, { createContext, useCallback, useRef, useState, type PropsWithChildren } from 'react';

import type { UploadProgress, UploadStatus } from '@/types/upload';

interface UploadContextValue {
  status: UploadStatus;
  progress: UploadProgress | null;
  startUpload: () => Promise<void>;
  cancelUpload: () => void;
}

const IDLE_STATUS: UploadStatus = { kind: 'idle' };

export const UploadContext = createContext<UploadContextValue>({
  status: IDLE_STATUS,
  progress: null,
  startUpload: async () => {},
  cancelUpload: () => {},
});

export function UploadProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<UploadStatus>(IDLE_STATUS);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const cancelledRef = useRef(false);

  const startUpload = useCallback(async () => {
    if (status.kind === 'uploading') return;

    cancelledRef.current = false;
    setStatus({ kind: 'uploading' });
    setProgress(null);

    try {
      const { performUpload } = await import('@/lib/upload-engine');
      const result = await performUpload({
        onProgress: (p: UploadProgress) => {
          if (!cancelledRef.current) {
            setProgress(p);
          }
        },
        isCancelled: () => cancelledRef.current,
      });

      if (cancelledRef.current) {
        setStatus(IDLE_STATUS);
        return;
      }

      if (result.success) {
        setStatus({
          kind: 'success',
          fileName: result.fileName!,
          fileSizeBytes: result.fileSizeBytes!,
        });
      } else {
        setStatus({ kind: 'failed', error: result.error! });
      }
    } catch (e: any) {
      if (!cancelledRef.current) {
        setStatus({ kind: 'failed', error: e.message || 'Upload failed' });
      }
    } finally {
      setProgress(null);
    }
  }, [status.kind]);

  const cancelUpload = useCallback(() => {
    cancelledRef.current = true;
    setStatus(IDLE_STATUS);
    setProgress(null);
  }, []);

  return (
    <UploadContext.Provider value={{ status, progress, startUpload, cancelUpload }}>
      {children}
    </UploadContext.Provider>
  );
}
