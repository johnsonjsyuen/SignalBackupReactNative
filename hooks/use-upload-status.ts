import { useContext } from 'react';

import { UploadContext } from '@/providers/upload-context';

export function useUploadStatus() {
  const { status, progress, startUpload, cancelUpload } = useContext(UploadContext);
  return { status, progress, startUpload, cancelUpload };
}
