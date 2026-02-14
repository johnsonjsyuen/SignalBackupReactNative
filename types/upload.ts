// --- Upload status (discriminated union) ---

export interface UploadStatusIdle {
  kind: 'idle';
}

export interface UploadStatusUploading {
  kind: 'uploading';
}

export interface UploadStatusSuccess {
  kind: 'success';
  fileName: string;
  fileSizeBytes: number;
}

export interface UploadStatusFailed {
  kind: 'failed';
  error: string;
}

export interface UploadStatusNeedsConsent {
  kind: 'needs-consent';
}

export interface UploadStatusRetryScheduled {
  kind: 'retry-scheduled';
  error: string;
  retryAtMillis: number;
}

export type UploadStatus =
  | UploadStatusIdle
  | UploadStatusUploading
  | UploadStatusSuccess
  | UploadStatusFailed
  | UploadStatusNeedsConsent
  | UploadStatusRetryScheduled;

// --- Upload progress ---

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  speedBytesPerSec: number;
  estimatedSecondsRemaining: number;
}

// --- Upload history record ---

export type UploadResultStatus = 'SUCCESS' | 'FAILED';

export interface UploadRecord {
  id: number;
  timestamp: number; // epoch ms
  fileName: string;
  fileSizeBytes: number;
  status: UploadResultStatus;
  errorMessage: string | null;
  driveFolderId: string;
  driveFileId: string | null;
}
