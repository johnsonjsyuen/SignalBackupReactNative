export const UploadConstants = {
  CHUNK_SIZE: 5 * 1024 * 1024, // 5 MB (must be multiple of 256 KB)
  MAX_NO_PROGRESS_RETRIES: 3,
  WIFI_CHECK_INTERVAL: 5, // Check every 5 chunks
  SESSION_MAX_AGE_MS: 6 * 24 * 60 * 60 * 1000, // 6 days
  MD5_BUFFER_SIZE: 8 * 1024, // 8 KB
  MIME_TYPE: 'application/octet-stream',
  BACKUP_FILE_EXTENSION: '.backup',
  RETRY_DELAY_MS: 30 * 60 * 1000, // 30 minutes
  DRIVE_API_BASE: 'https://www.googleapis.com',
  DRIVE_UPLOAD_URL: 'https://www.googleapis.com/upload/drive/v3/files',
  DRIVE_FILES_URL: 'https://www.googleapis.com/drive/v3/files',
} as const;
