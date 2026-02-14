export interface DriveFolder {
  id: string;
  name: string;
}

export interface ResumableUploadSession {
  sessionUri: string;
  localFileUri: string;
  fileName: string;
  bytesUploaded: number;
  totalBytes: number;
  driveFolderId: string;
  createdAtMillis: number;
  driveFileId: string | null;
}
