export const StorageKeys = {
  // User settings
  LOCAL_FOLDER_URI: 'local_folder_uri',
  DRIVE_FOLDER_ID: 'drive_folder_id',
  DRIVE_FOLDER_NAME: 'drive_folder_name',
  SCHEDULE_HOUR: 'schedule_hour',
  SCHEDULE_MINUTE: 'schedule_minute',
  GOOGLE_ACCOUNT_EMAIL: 'google_account_email',
  THEME_MODE: 'theme_mode',
  WIFI_ONLY: 'wifi_only',

  // Retry state
  RETRY_AT_MILLIS: 'retry_at_millis',
  RETRY_ERROR: 'retry_error',

  // Resumable upload session (8 fields)
  RESUME_SESSION_URI: 'resume_session_uri',
  RESUME_LOCAL_FILE_URI: 'resume_local_file_uri',
  RESUME_FILE_NAME: 'resume_file_name',
  RESUME_BYTES_UPLOADED: 'resume_bytes_uploaded',
  RESUME_TOTAL_BYTES: 'resume_total_bytes',
  RESUME_DRIVE_FOLDER_ID: 'resume_drive_folder_id',
  RESUME_CREATED_AT: 'resume_created_at',
  RESUME_DRIVE_FILE_ID: 'resume_drive_file_id',
} as const;
